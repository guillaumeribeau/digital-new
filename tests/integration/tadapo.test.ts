import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { getDb, PrismaClient } from "@nova/database";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { grantTadapoPermissions } from "../../scripts/tadapo-permissions";
import { hashPassword } from "better-auth/crypto";
import { POST as auth } from "../../apps/admin/app/api/auth/[...all]/route";
import { POST as webhook } from "../../apps/admin/app/api/webhooks/stripe/tadapo/route";
import { adminService } from "../../apps/admin/lib/service";
import { updateTadapo, attachTadapoFile } from "../../apps/admin/lib/tadapo";
import { applyTadapoStripeEvent, authorizeTadapo, cancelTadapo, checkoutTadapo, tadapoFeedback, tadapoMode, tadapoPaymentMethodLink, tadapoPublicView, tadapoStripe } from "@nova/shared/tadapo-server";
import { acceptTadapoDomain, payTadapoDomain } from "@nova/shared/tadapo-domain";
import { tadapoAnniversary, tadapoOfferVersion, tadapoOffer } from "@nova/shared/tadapo";
import { transferTadapoMail } from "../../apps/admin/lib/tadapo-outbox";
import { grantCommercialPermissions } from '../../scripts/commercial-permissions';
import { processCommercialOutbox } from '../../apps/admin/lib/commercial-mail';
import { applyTadapoInbound } from "../../apps/admin/lib/tadapo-inbound";
import { tadapoClientLink } from "@nova/shared/tadapo-server";
import { tadapoBillingWindow } from "@nova/shared/tadapo-workflow";
import { seal, unseal } from "@nova/shared/secure-payload";
import type Stripe from "stripe";
assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/lead_pipeline_test");
const db = getDb(), originalFetch = globalThis.fetch;
let cookie = "", orderId = "", token = "", projectId = "", status = "incomplete", paid = false, wrongAmount = false, cancelAt: number | null = null;
const start = Math.floor(Date.now() / 1000), periodEnd = Math.floor(tadapoAnniversary(new Date(start * 1000), 1).getTime() / 1000);
const metadata = () => ({ tadapoOrderId: orderId, purpose: "TADAPO_SUBSCRIPTION", offerVersion: tadapoOfferVersion });
const sub = () => ({ id: "sub_tadapo", object: "subscription", livemode: false, customer: "cus_tadapo", status, metadata: metadata(), start_date: start, cancel_at: cancelAt,
  items: { data: [{ quantity: 1, current_period_end: periodEnd, price: { unit_amount: wrongAmount ? 1 : 3900, currency: "eur", recurring: { interval: "month", interval_count: 1 } } }] } });
const session = () => ({ id: "cs_tadapo", mode: "subscription", livemode: false, customer: "cus_tadapo", subscription: "sub_tadapo", metadata: metadata(), currency: "eur", amount_total: 4680, payment_status: paid ? "paid" : "unpaid" });
let invoicePaid = true;
const invoice = () => ({ id: "in_tadapo", object: "invoice", customer: "cus_tadapo", parent: { subscription_details: { subscription: "sub_tadapo", metadata: metadata() } }, period_end: periodEnd,
  total: 4680, status: invoicePaid ? "paid" : "open", hosted_invoice_url: "https://invoice.stripe.com/tadapo", invoice_pdf: "https://invoice.stripe.com/tadapo.pdf" });
const event = (type: string, object: unknown, id = `evt_${randomUUID()}`) => ({ id, type, livemode: false, data: { object } }) as Stripe.Event;
const h = () => new Headers({ cookie: cookie + "; admin-brand=tadapo" });
let domainVersion = 0, domainTotal = 0, domainPaid = false;
const keys = new Set<string>();
const requestId = randomUUID();
const input = { requestId, offerVersion: tadapoOfferVersion, agreement: true, privacy: true, earlyStart: true, honeypot: "", brief: {
  plan: "essentiel", term: "12", company: "Tadapo intégration", activity: "Électricité", area: "Le Mans", fullName: "Camille Exemple", email: "tadapo-client@example.com", phone: "", objectives: "Recevoir des demandes", services: "Installations électriques", audience: "Particuliers", pages: "", existingWebsite: "", style: "Lumineux", colors: "", inspirations: "", logo: "non", content: "", domainMode: "help", domain: "",
} };
after(async () => { globalThis.fetch = originalFetch; await db.$disconnect(); });

test("Tadapo exige les accords, refuse les prix injectés et conserve une commande idempotente", async () => {
  Object.assign(process.env, { TADAPO_STRIPE_SECRET_KEY: "sk_test_tadapo_fixture", TADAPO_STRIPE_WEBHOOK_SECRET: "whsec_tadapo_fixture", NEXT_PUBLIC_TADAPO_SITE_URL: "http://localhost:3002", TADAPO_FROM_EMAIL: "Tadapo <contact@tadapo.test>", TADAPO_CONTACT_EMAIL: "contact@tadapo.test", TADAPO_REPLY_DOMAIN: "reponses.tadapo.test", RESEND_API_KEY: "re_test_fixture" });
  globalThis.fetch = async (url, init) => {
    const path = new URL(String(url)).pathname, fields = new URLSearchParams(String(init?.body));
    if (!path.startsWith("/v1/")) return originalFetch(url, init);
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer sk_test_tadapo_fixture");
    if (path === "/v1/tax_rates") return Response.json({ id: "txr_tadapo" });
    if (path === "/v1/checkout/sessions" && init?.method === "POST") {
      const key = new Headers(init.headers).get("idempotency-key")!; keys.add(key);
      if (fields.get("mode") === "payment") { domainVersion = Number(fields.get("metadata[domainVersion]")); domainTotal = Number(fields.get("line_items[0][price_data][unit_amount]")) * 1.2; return Response.json({ id: "cs_domain", url: "https://checkout.stripe.com/domain" }); }
      orderId = fields.get("metadata[tadapoOrderId]")!;
      assert.equal(fields.get("mode"), "subscription"); assert.equal(fields.get("line_items[0][price_data][unit_amount]"), "3900");
      assert.equal(fields.get("subscription_data[metadata][tadapoOrderId]"), orderId);
      assert.equal(fields.has("subscription_data[trial_period_days]"), false);
      return Response.json({ id: "cs_tadapo", url: "https://checkout.stripe.com/tadapo" });
    }
    if (path === "/v1/checkout/sessions/cs_tadapo") return Response.json(session());
    if (path === "/v1/checkout/sessions/cs_domain") return Response.json({ id: "cs_domain", status: domainPaid ? "complete" : "open", customer: "cus_tadapo", metadata: { tadapoOrderId: orderId, purpose: "TADAPO_DOMAIN", domainVersion: String(domainVersion) }, amount_total: domainTotal, currency: "eur", payment_status: domainPaid ? "paid" : "unpaid" });
    if (path === "/v1/subscriptions/sub_tadapo") { if (init?.method === "POST") { cancelAt = Number(fields.get("cancel_at")); assert.equal(fields.get("proration_behavior"), "none"); } return Response.json(sub()); }
    if (path === "/v1/invoices/in_tadapo") return Response.json(invoice());
    if (path === "/v1/billing_portal/configurations") { assert.equal(fields.get("features[subscription_cancel][enabled]"), "false"); assert.equal(fields.get("features[subscription_update][enabled]"), "false"); return Response.json({ id: "bpc_tadapo" }); }
    if (path === "/v1/billing_portal/sessions") { assert.equal(fields.get("configuration"), "bpc_tadapo"); return Response.json({ url: "https://billing.stripe.com/tadapo" }); }
    throw new Error(`Unexpected mock request ${path}`);
  };
  await assert.rejects(checkoutTadapo({ ...input, agreement: false }));
  await assert.rejects(checkoutTadapo({ ...input, brief: { ...input.brief, htCents: 1 } }));
  const [a, b] = await Promise.all([checkoutTadapo(input), checkoutTadapo(input)]);
  assert.equal(a.url, b.url); assert.equal(keys.size, 1);
  assert.equal(await db.tadapoOrder.count({ where: { requestId } }), 1);
  await assert.rejects(checkoutTadapo({ ...input, brief: { ...input.brief, company: "Changed" } }));
  const order = await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } }); token = unseal(order.tokenEncrypted) as string;
  assert.equal(order.projectId, null); assert.equal((await tadapoPublicView(orderId, token)).paid, false);
  assert.ok(!JSON.stringify(await tadapoPublicView(orderId, token)).includes("tokenEncrypted"));
  await assert.rejects(authorizeTadapo(orderId, "x".repeat(43)));
});

test("seul un paiement Stripe signé et vérifié crée le dossier, deux e-mails client séparés et les alertes admin", async () => {
  await applyTadapoStripeEvent(event("checkout.session.completed", session()));
  assert.equal((await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } })).paidAt, null);
  const fake = await webhook(new Request("http://localhost:3001/api/webhooks/stripe/tadapo", { method: "POST", headers: { "stripe-signature": "fake" }, body: "{}" })); assert.equal(fake.status, 400);
  paid = true; status = "active"; wrongAmount = true;
  await assert.rejects(applyTadapoStripeEvent(event("invoice.paid", invoice())));
  wrongAmount = false;
  const e = event("invoice.paid", invoice()), payload = JSON.stringify(e);
  const signature = tadapoStripe().webhooks.generateTestHeaderString({ payload, secret: process.env.TADAPO_STRIPE_WEBHOOK_SECRET! });
  const response = await webhook(new Request("http://localhost:3001/api/webhooks/stripe/tadapo", { method: "POST", headers: { "stripe-signature": signature }, body: payload })); assert.equal(response.status, 200);
  await applyTadapoStripeEvent(e); await applyTadapoStripeEvent(event("checkout.session.completed", session()));
  await transferTadapoMail();
  const o = await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId }, include: { project: { include: { lead: true } }, emails: true } });
  projectId = o.projectId!;
  assert.equal(o.project?.lead.brand, "tadapo"); assert.equal(o.project?.lead.emailVerifiedAt, null, "Payment does not prove ownership of email");
  assert.equal(o.emails.filter(e=>e.kind!=="TADAPO_OWNER_NOTICE").length, 2);
  assert.equal(o.emails.filter(e=>e.kind==="TADAPO_OWNER_NOTICE").length, 2); assert.equal(await db.tadapoInvoice.count({ where: { orderId } }), 1);
  assert.equal(o.commitmentEndAt?.toISOString(), tadapoAnniversary(new Date(start * 1000), 12).toISOString());
  const mail = unseal(o.emails.find(e=>e.kind==="TADAPO_PAYMENT")!.payloadEncrypted!) as { text: string; from: string }; assert.ok(mail.from.includes("Tadapo")); assert.ok(mail.text.includes("39,00")); assert.ok(mail.text.includes(token));
});

test("les impayés sont signalés sans suspension et un événement ancien relit l’état Stripe actuel", async () => {
  status = "past_due"; invoicePaid = false;
  await applyTadapoStripeEvent(event("invoice.payment_failed", invoice()));
  assert.equal((await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } })).billingAlert, true);
  status = "active"; invoicePaid = true;
  await applyTadapoStripeEvent(event("invoice.payment_failed", { ...invoice(), status: "open" }));
  const o = await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } }); assert.equal(o.billingAlert, false); assert.equal(o.stage, "CONTENT_PREPARATION");
});

test("l’admin filtre les marques et livre les versions avec e-mail et conserve les décisions manuelles", async () => {
  const password = "Tadapo-Test-Password-42!", user = await db.user.create({ data: { email: "tadapo-admin@example.com", name: "Admin Tadapo", emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } });
  await db.adminUser.create({ data: { userId: user.id } });
  const r = await auth(new Request("http://localhost:3001/api/auth/sign-in/email", { method: "POST", headers: { origin: "http://localhost:3001", "content-type": "application/json" }, body: JSON.stringify({ email: user.email, password }) })); assert.equal(r.status, 200);
  cookie = r.headers.getSetCookie().map(s => s.split(";")[0]).join("; ");
  const leads = await adminService.leads(h(), { brand: "tadapo" }); assert.ok(leads.rows.every(l => l.brand === "tadapo"));
  const projects = await adminService.projects(h(), { brand: "tadapo" }); assert.ok(projects.rows.some(p => p.id === projectId));
  await assert.rejects(updateTadapo(new Headers(), { id: orderId, action: "stage", stage: "CREATION" }));
  await assert.rejects(adminService.changeProjectStage(h(), { id: projectId, expected: "CONTENT_PREPARATION", stage: "CREATION" }));
  await updateTadapo(h(), { id: orderId, action: "stage", expectedStage: "CONTENT_PREPARATION", stage: "CREATION" });
  await assert.rejects(updateTadapo(h(), { id: orderId, action: "stage", expectedStage: "CREATION", stage: "PUBLISHED" }));
  let p = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  await adminService.projectLinks(h(), { id: projectId, expectedUpdatedAt: p.updatedAt.toISOString(), previewUrl: "https://preview.example.com", websiteUrl: "https://atelier.fr" });
  const before=await db.tadapoMail.count({where:{orderId}});
  await updateTadapo(h(), { id: orderId, action: "stage", expectedStage: "CREATION", stage: "PREVIEW_SENT",requestId:randomUUID(),expectedVersion:1,url:"https://preview.example.com" });
  assert.equal(await db.tadapoMail.count({ where: { orderId } }), before+1);
  const mail = { id: orderId, action: "email", requestId: randomUUID(), subject: "Votre version", message: "Découvrez votre première version." };
  await updateTadapo(h(), mail); await updateTadapo(h(), mail);
  assert.equal(await db.tadapoMail.count({ where: { orderId } }), before+2);
  const v = (await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } })).reviewVersion;
  const feedback = { action: "feedback", version: v, requestId: randomUUID(), name: "Camille", message: "Changer la photo" };
  await tadapoFeedback(orderId, token, feedback); await tadapoFeedback(orderId, token, feedback);
  await updateTadapo(h(), { id: orderId, action: "stage", expectedStage: "REVIEW", stage: "PREVIEW_SENT", requestId:randomUUID(),expectedVersion:v,url:"https://preview.example.com/v2" });
  const nextVersion = (await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } })).reviewVersion;
  assert.ok(nextVersion > v);
  await assert.rejects(tadapoFeedback(orderId, token, { action: "approve", version: v, requestId: randomUUID(), name: "Camille", message: "" }));
  const approval = { action: "approve", version: nextVersion, requestId: randomUUID(), name: "Camille", message: "" };
  await tadapoFeedback(orderId, token, approval); await tadapoFeedback(orderId, token, approval);
  await assert.rejects(updateTadapo(h(), { id: orderId, action: "stage", expectedStage: "APPROVED", stage: "PUBLISHED" }));
  p = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  assert.equal(p.stage, "APPROVED");
});

test("le domaine nécessite accord et supplément payé avant achat et publication", async () => {
  await updateTadapo(h(), { id: orderId, action: "domain", requestId:randomUUID(), domain: "atelier.fr", kind: "new", initialHtCents: 2600, renewalHtCents: 3000 });
  const o = await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } });
  await assert.rejects(updateTadapo(h(), { id: orderId, action: "domain-purchased",requestId:randomUUID() }));
  await assert.rejects(acceptTadapoDomain(orderId, token, o.domainVersion + 1));
  await acceptTadapoDomain(orderId, token, o.domainVersion);
  await assert.rejects(updateTadapo(h(), { id: orderId, action: "domain", domain: "other.fr", kind: "new", initialHtCents: 1, renewalHtCents: 1 }));
  await payTadapoDomain(orderId, token, o.domainVersion);
  assert.equal(await payTadapoDomain(orderId, token, o.domainVersion), "https://checkout.stripe.com/domain");
  await assert.rejects(updateTadapo(h(), { id: orderId, action: "domain-purchased" }));
  domainPaid = true;
  await applyTadapoStripeEvent(event("checkout.session.completed", { id: "cs_domain", metadata: { tadapoOrderId: orderId, purpose: "TADAPO_DOMAIN" } }));
  await updateTadapo(h(), { id: orderId, action: "domain-purchased",requestId:randomUUID() }); await updateTadapo(h(), { id: orderId, action: "domain-ready" });
  await updateTadapo(h(), { id: orderId, action: "stage", expectedStage: "APPROVED", stage: "PUBLISHED" });
  assert.equal((await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } })).stage, "PUBLISHED");
  await attachTadapoFile(h(), orderId, "document.pdf", Buffer.from("%PDF-fixture"));
  const file = await db.tadapoFile.findFirstOrThrow({ where: { orderId } }); assert.ok(!file.encrypted.includes("%PDF"));
});

test("la résiliation respecte le terme initial et le portail ne permet pas de le contourner", async () => {
  await cancelTadapo(orderId, token); await cancelTadapo(orderId, token);
  assert.equal(cancelAt, Math.floor(tadapoAnniversary(new Date(start * 1000), 12).getTime() / 1000));
  assert.equal(await tadapoPaymentMethodLink(orderId, token), "https://billing.stripe.com/tadapo");
  const o = await db.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } });
  assert.ok(o.cancelRequestedAt); assert.ok(o.cancelEffectiveAt);
  await db.tadapoOrder.update({ where: { id: orderId }, data: { commitmentEndAt: null, cancelRequestedAt: null } });
  await cancelTadapo(orderId, token); assert.equal(cancelAt, periodEnd);
  process.env.TADAPO_STRIPE_SECRET_KEY = "sk_live_blocked_fixture"; process.env.TADAPO_ORDERING_ENABLED = "false";
  assert.equal(tadapoMode(), "LIVE", "Closing new orders must keep existing subscriptions manageable");
  await assert.rejects(checkoutTadapo({ ...input, requestId: randomUUID() }), /ORDERING_NOT_OPEN/);
});

test("le rôle public Tadapo valide le suivi et les retours sans lire les comptes, notes ou fichiers privés", async () => {
  process.env.TADAPO_STRIPE_SECRET_KEY = "sk_test_tadapo_fixture";
  const operator = new Client({ connectionString: process.env.DATABASE_URL }); await operator.connect();
  const password = randomBytes(24).toString("hex");
  await operator.query(`CREATE ROLE tadapo_test_web LOGIN PASSWORD '${password}'`);
  await grantTadapoPermissions(operator, "tadapo_test_web"); await operator.end();
  await db.tadapoOrder.update({ where: { id: orderId }, data: { stage: "PREVIEW_SENT" } });
  const url = new URL(process.env.DATABASE_URL!); url.username = "tadapo_test_web"; url.password = password;
  const runtime = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href, max: 2 }) });
  const shared = globalThis as unknown as { leadPrisma: PrismaClient }, previous = shared.leadPrisma;
  shared.leadPrisma = runtime;
  try {
    assert.equal((await tadapoPublicView(orderId, token)).paid, true);
    const o = await runtime.tadapoOrder.findUniqueOrThrow({ where: { id: orderId } });
    await tadapoFeedback(orderId, token, { action: "approve", version: o.reviewVersion, requestId: randomUUID(), name: "Camille", message: "" });
    await assert.rejects(runtime.user.findMany()); await assert.rejects(runtime.internalNote.findMany());
    await assert.rejects(runtime.tadapoFile.findMany()); await assert.rejects(runtime.commercialEmail.findMany());
    await assert.rejects(runtime.tadapoMail.findMany());
    await assert.rejects(runtime.tadapoInboundEmail.findMany());
    await assert.rejects(runtime.project.update({ where: { id: projectId }, data: { websiteUrl: "https://changed.example" } }));
  } finally { shared.leadPrisma = previous; await runtime.$disconnect(); }
});

async function workflowFixture(plan: 'essentiel'|'business'='essentiel') {
  const source=await db.lead.findUniqueOrThrow({where:{id:(await db.project.findUniqueOrThrow({where:{id:projectId}})).leadId}});
  const lead=await db.lead.create({data:{...source,id:randomUUID(),requestId:randomUUID(),businessName:`Tadapo test ${randomUUID()}`,email:`${randomUUID()}@example.com`}});
  const project=await db.project.create({data:{leadId:lead.id,stage:'CREATION',websiteUrl:'https://atelier.fr'}});
  const token=randomBytes(32).toString('base64url');
  const {digestTadapo}=await import('@nova/shared/tadapo-server');
  const o=await db.tadapoOrder.create({data:{requestId:randomUUID(),payloadHash:'a'.repeat(64),projectId:project.id,brief:{...input.brief,plan,pages:plan==='business'?'Accueil et services':'',email:lead.email},offerSnapshot:tadapoOffer(plan,'12'),consentSnapshot:{earlyStart:true},mode:'TEST',stage:'CREATION',tokenHash:digestTadapo(token),tokenEncrypted:seal(token),paidAt:new Date(Date.now()-45*86400000),subscriptionStatus:'active'}});
  return {id:o.id,token};
}
async function deliver(id:string) {
  const o=await db.tadapoOrder.findUniqueOrThrow({where:{id}});
  const data={id,action:'stage',expectedStage:o.stage,stage:'PREVIEW_SENT',requestId:randomUUID(),expectedVersion:o.reviewVersion,url:`https://preview.example.com/v${o.reviewVersion+1}`};
  await updateTadapo(h(),data);await updateTadapo(h(),data);
}
test('trois séries atomiques, attente entre livraisons, anciens liens refusés et délai démarrant à la première version',async()=>{
  const f=await workflowFixture();await deliver(f.id);
  const first=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}});assert.ok(first.firstVersionAt);
  const view=await tadapoPublicView(f.id,f.token);assert.equal(view.reviewDeadline!.getTime(),first.firstVersionAt!.getTime()+30*86400000);
  for(let n=1;n<=3;n++){
    const o=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}});
    const one={action:'feedback',version:o.reviewVersion,requestId:randomUUID(),name:'Camille',message:`Série ${n} : changer la photo`};
    const two={...one,requestId:randomUUID(),message:'Autre envoi simultané'};
    const result=await Promise.allSettled([tadapoFeedback(f.id,f.token,one),tadapoFeedback(f.id,f.token,two)]);
    assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
    const accepted=result[0].status==='fulfilled'?one:two;
    await tadapoFeedback(f.id,f.token,accepted);
    await assert.rejects(tadapoFeedback(f.id,f.token,{action:'approve',version:o.reviewVersion,requestId:randomUUID(),name:'Camille'}),/REVIEW_WAITING/);
    assert.equal((await tadapoPublicView(f.id,f.token)).reviewWaiting,true);
    await deliver(f.id);
    const updated=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}});assert.equal(updated.reviewVersion,o.reviewVersion+1);assert.equal(updated.firstVersionAt!.getTime(),first.firstVersionAt!.getTime());
    await assert.rejects(tadapoFeedback(f.id,f.token,{...one,requestId:randomUUID()}),/STALE_VERSION/);
  }
  const current=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}});
  await assert.rejects(tadapoFeedback(f.id,f.token,{action:'feedback',requestId:randomUUID(),version:current.reviewVersion,name:'Camille',message:'Quatrième série'}),/REVIEW_LIMIT/);
  await tadapoFeedback(f.id,f.token,{action:'extra-request',requestId:randomUUID(),name:'Camille',message:'Merci de chiffrer une nouvelle page'});
  await tadapoFeedback(f.id,f.token,{action:'approve',requestId:randomUUID(),version:current.reviewVersion,name:'Camille'});
  const mails=await db.tadapoMail.findMany({where:{orderId:f.id}}),subjects=mails.map(m=>(unseal(m.payloadEncrypted) as {subject:string}).subject);
  assert.equal(mails.filter(m=>m.kind==='TADAPO_REVIEW_INVITE').length,4);
  assert.ok(subjects.some(s=>s.includes('série 2/3')));assert.ok(subjects.some(s=>s.includes('série 3/3 — dernière')));assert.ok(subjects.some(s=>s.includes('validation finale')));
  assert.equal(subjects.filter(s=>s.includes('Nouveaux retours Tadapo')).length,3);
  await db.tadapoOrder.update({where:{id:f.id},data:{stage:'PREVIEW_SENT',approvedAt:null,firstVersionAt:new Date(Date.now()-31*86400000)}});
  await assert.rejects(tadapoFeedback(f.id,f.token,{action:'feedback',requestId:randomUUID(),version:current.reviewVersion,name:'Camille',message:'Hors délai'}),/REVIEW_CLOSED/);
});

test('domaine indépendant, notification du choix et nouvel accord traçable pour une hausse de renouvellement',async()=>{
  const f=await workflowFixture();
  await tadapoFeedback(f.id,f.token,{action:'domain-request',requestId:randomUUID(),name:'Camille',domain:'atelier.fr',kind:'new'});
  const proposal={id:f.id,action:'domain',requestId:randomUUID(),domain:'atelier.fr',kind:'new',initialHtCents:1800,renewalHtCents:1900};
  await updateTadapo(h(),proposal);await updateTadapo(h(),proposal);
  const o=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}});assert.equal((o.domainQuote as {initialExtraHtCents:number}).initialExtraHtCents,0);
  await acceptTadapoDomain(f.id,f.token,o.domainVersion);
  const bought={id:f.id,action:'domain-purchased',requestId:randomUUID()};await updateTadapo(h(),bought);await updateTadapo(h(),bought);
  const renewal={id:f.id,action:'domain-renewal',requestId:randomUUID(),renewalAt:'2027-10-23',renewalHtCents:2600};
  await updateTadapo(h(),renewal);await updateTadapo(h(),renewal);
  await assert.rejects(tadapoFeedback(f.id,f.token,{action:'domain-renewal',requestId:randomUUID(),name:'Camille',agreement:true}),/STALE_VERSION/);
  const consent={action:'domain-renewal',requestId:renewal.requestId,name:'Camille',agreement:true};await tadapoFeedback(f.id,f.token,consent);await tadapoFeedback(f.id,f.token,consent);
  const changed=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}});assert.equal((changed.domainQuote as {renewalExtraHtCents:number}).renewalExtraHtCents,600);assert.equal((changed.domainRenewalHistory as unknown[]).length,2);
  assert.equal(changed.firstVersionAt,null,'Domain choices do not start the review clock');
});

test('quotas mensuels Essentiel et Business, aucun report, clôture manuelle et e-mail client',async()=>{
  for(const plan of ['essentiel','business'] as const){
    const f=await workflowFixture(plan);await db.tadapoOrder.update({where:{id:f.id},data:{stage:'PUBLISHED'}});
    const quota=plan==='essentiel'?1:3;
    const outcomes=await Promise.allSettled(Array.from({length:quota+1},(_,n)=>tadapoFeedback(f.id,f.token,{action:'monthly',requestId:randomUUID(),name:'Camille',message:`Modification ${n}`})));
    assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,quota);
    const view=await tadapoPublicView(f.id,f.token);assert.equal(view.monthlyUsed,quota);
    const row=await db.tadapoFeedback.findFirstOrThrow({where:{orderId:f.id,kind:'MONTHLY'}});
    await updateTadapo(h(),{id:f.id,action:'monthly-complete',feedbackId:row.id,requestId:randomUUID()});
    assert.equal((await tadapoPublicView(f.id,f.token)).monthlyUsed,quota,'Completion does not refund consumed quota');
    const o=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}}),old=tadapoAnniversary(o.paidAt!,-1);
    await db.tadapoFeedback.updateMany({where:{orderId:f.id,kind:'MONTHLY'},data:{periodStart:tadapoBillingWindow(old,new Date(old.getTime()+86400000)).start}});
    assert.equal((await tadapoPublicView(f.id,f.token)).monthlyUsed,0);
    await tadapoFeedback(f.id,f.token,{action:'monthly',requestId:randomUUID(),name:'Camille',message:'Nouvelle période'});
    assert.ok(await db.tadapoMail.findFirst({where:{orderId:f.id,kind:'TADAPO_MONTHLY_DONE'}}));
  }
});

test('réponses e-mail archivées, séries uniques, ancien lien et expéditeur différent sans ouverture de série',async()=>{
  const f=await workflowFixture();await deliver(f.id);
  const o=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}}),brief=o.brief as {email:string};
  const email={id:randomUUID(),to:[`tr1-${f.token}@reponses.tadapo.test`],from:brief.email,subject:'Mes retours',text:'Changer le texte de présentation.',attachments:[]};
  assert.equal(await applyTadapoInbound(email),true);await applyTadapoInbound(email);
  assert.equal(await db.tadapoFeedback.count({where:{orderId:f.id,kind:'REVIEW'}}),1);
  await applyTadapoInbound({...email,id:randomUUID(),text:'Autre message entre les séries'});
  await deliver(f.id);
  await applyTadapoInbound({...email,id:randomUUID(),text:'Réponse à l’ancien lien'});
  await applyTadapoInbound({...email,id:randomUUID(),to:[`tr2-${f.token}@reponses.tadapo.test`],from:'intrus@example.com'});
  const archive=await db.tadapoInboundEmail.findMany({where:{orderId:f.id}});assert.equal(archive.length,4);
  assert.ok(archive.some(e=>e.state==='DEFERRED'));assert.ok(archive.some(e=>e.state==='STALE_VERSION'));assert.ok(archive.some(e=>e.state==='UNVERIFIED_SENDER'));
  assert.equal(await db.tadapoFeedback.count({where:{orderId:f.id,kind:'REVIEW'}}),1);
  assert.ok(!JSON.stringify(await tadapoPublicView(f.id,f.token)).includes('payloadEncrypted'));
  assert.ok(tadapoClientLink(o).includes(f.token));
  const savedFetch=globalThis.fetch;
  globalThis.fetch=async(url,init)=>{
    if(String(url)===`https://api.resend.com/emails/receiving/test-attachment-email/attachments/test-attachment`)return Response.json({object:'attachment',id:'test-attachment',filename:'contenu.pdf',content_type:'application/pdf',download_url:'https://files.example.com/contenu.pdf',size:20});
    if(String(url)==='https://files.example.com/contenu.pdf')return new Response(Buffer.from('%PDF-tadapo-attachment'));
    return savedFetch(url,init);
  };
  try {await applyTadapoInbound({...email,id:'test-attachment-email',to:[`td-${f.token}@reponses.tadapo.test`],attachments:[{id:'test-attachment',filename:'contenu.pdf',content_type:'application/pdf'}]});}
  finally{globalThis.fetch=savedFetch;}
  const withFile=await db.tadapoInboundEmail.findUniqueOrThrow({where:{providerId:'test-attachment-email'}});
  const file=(withFile.attachments as {archived:boolean;encrypted:string}[])[0];assert.equal(file.archived,true);assert.equal(unseal(file.encrypted),Buffer.from('%PDF-tadapo-attachment').toString('base64'));
  await transferTadapoMail();await transferTadapoMail();
  const transferred=await db.commercialEmail.findMany({where:{tadapoOrderId:f.id}});assert.equal(transferred.length,await db.tadapoMail.count({where:{orderId:f.id}}));
});

test('le worker restreint transfère et envoie les messages Tadapo et écarte les invitations obsolètes',async()=>{
  await transferTadapoMail();await db.commercialEmail.updateMany({where:{status:'PENDING'},data:{status:'CANCELLED'}});
  const f=await workflowFixture();await deliver(f.id);
  const o=await db.tadapoOrder.findUniqueOrThrow({where:{id:f.id}});
  await tadapoFeedback(f.id,f.token,{action:'feedback',version:o.reviewVersion,requestId:randomUUID(),name:'Camille',message:'Changer le titre'});
  await deliver(f.id);
  const operator=new Client({connectionString:process.env.DATABASE_URL});await operator.connect();const password=randomBytes(24).toString('hex');
  await operator.query(`CREATE ROLE tadapo_mail_worker LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
  await grantCommercialPermissions(operator,'commercial_test_admin','tadapo_mail_worker');await operator.end();
  const url=new URL(process.env.DATABASE_URL!);url.username='tadapo_mail_worker';url.password=password;
  const runtime=new PrismaClient({adapter:new PrismaPg({connectionString:url.href,max:2})});
  const shared=globalThis as unknown as {leadPrisma:PrismaClient},previous=shared.leadPrisma,fetchBefore=globalThis.fetch,modeBefore=process.env.COMMERCIAL_MODE;
  const sent:{subject:string;to:string[]}[]=[];shared.leadPrisma=runtime;process.env.COMMERCIAL_MODE='';
  globalThis.fetch=async(url,init)=>{assert.equal(String(url),'https://api.resend.com/emails');sent.push(JSON.parse(String(init?.body)));return Response.json({id:randomUUID()});};
  try {
    const result=await processCommercialOutbox(20);assert.equal(result.failed,0);assert.equal(result.sent,2);
    assert.equal(sent.filter(m=>m.subject.includes('série 2/3')).length,1);assert.equal(sent.filter(m=>m.subject.includes('première série')).length,0);
    await assert.rejects(runtime.tadapoOrder.findMany());await assert.rejects(runtime.internalNote.findMany());
  }finally{globalThis.fetch=fetchBefore;shared.leadPrisma=previous;if(modeBefore===undefined)delete process.env.COMMERCIAL_MODE;else process.env.COMMERCIAL_MODE=modeBefore;await runtime.$disconnect();}
});
