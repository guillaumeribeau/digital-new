import { z } from "zod";
import { workspaceDb } from "./brand-context";
import { tadapoStages, type TadapoOffer } from "@nova/shared/tadapo";
import { prepareDomainQuote, type TadapoDomainQuote } from "@nova/shared/tadapo-domain";
import { queueTadapoEmail, TadapoError, tadapoMode } from "@nova/shared/tadapo-server";
import { seal } from "@nova/shared/secure-payload";
import { authenticate } from "./access";
import { checkUpload } from "./project-workflow";
import { queueTadapoDomainInvite, queueTadapoReviewInvite, tadapoPaymentMessage } from "@nova/shared/tadapo-mail";
import { tadapoReviewState } from "@nova/shared/tadapo-workflow";

export async function updateTadapo(h: Headers, input: unknown) {
  const actor = await authenticate(h);
  const d = z.object({ id: z.uuid(), action: z.enum(["stage", "email", "domain", "domain-purchased", "domain-ready", "review-resend", "domain-invite", "domain-renewal", "monthly-complete", "payment-resend"]),
    stage: z.string().optional(), expectedStage: z.string().optional(), subject: z.string().trim().max(200).optional(), message: z.string().trim().max(10000).optional(), requestId: z.uuid().optional(),
    domain: z.string().optional(), kind: z.enum(["new", "existing"]).optional(), initialHtCents: z.coerce.number().optional(), renewalHtCents: z.coerce.number().optional(),
    expectedVersion: z.coerce.number().int().min(1).optional(), url: z.url().optional(), renewalAt: z.iso.date().optional(), feedbackId: z.uuid().optional(),
    purpose:z.enum(['reviews','domain','monthly','billing']).optional(),
  }).parse(input);
  await workspaceDb(h).$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "TadapoOrder" WHERE "id" = ${d.id}::uuid FOR UPDATE`;
    const o = await tx.tadapoOrder.findUniqueOrThrow({ where: { id: d.id }, include: { project: true } });
    if (!o.paidAt || !o.projectId || o.mode !== tadapoMode()) throw new TadapoError("INVALID_ACTION");
    if(d.requestId && await tx.tadapoMail.findUnique({where:{key:`tadapo/${o.id}/${d.requestId}`}}))return;
    if (d.action === "stage") {
      if (o.stage !== d.expectedStage || !d.stage || !Object.hasOwn(tadapoStages, d.stage)) throw new TadapoError("STALE_STAGE");
      const allowed: Record<string, string[]> = { CONTENT_PREPARATION: ["CREATION"], CREATION: ["PREVIEW_SENT"], REVIEW: ["PREVIEW_SENT"], APPROVED: ["PUBLISHED"] };
      if (!allowed[o.stage]?.includes(d.stage)) throw new TadapoError("INVALID_ACTION");
      const consent = o.consentSnapshot as { earlyStart?: boolean };
      if (d.stage === "CREATION" && !consent.earlyStart && o.paidAt.getTime() + 14 * 86400000 > Date.now()) throw new TadapoError("EARLY_START_NOT_ACCEPTED");
      if (d.stage === "PREVIEW_SENT" && (!d.requestId || !d.url || d.expectedVersion !== o.reviewVersion)) throw new TadapoError("PREVIEW_REQUIRED");
      if(d.url){const url=new URL(d.url);if(url.protocol!=='https:'||url.username||url.password)throw new TadapoError('PREVIEW_REQUIRED');}
      const state=await tadapoReviewState(tx,o);
      if(d.stage==='PUBLISHED' && state.waiting)throw new TadapoError('NOT_READY');
      if (d.stage === "PUBLISHED" && (!o.approvedAt || o.approvedVersion !== o.reviewVersion || !o.domainReadyAt || !o.project?.websiteUrl || o.billingAlert || o.subscriptionStatus !== "active")) throw new TadapoError("NOT_READY");
      if(d.stage==='PREVIEW_SENT' && o.stage==='REVIEW'){
        if(!state.waiting)throw new TadapoError('INVALID_ACTION');
        await tx.tadapoFeedback.updateMany({where:{orderId:o.id,kind:'REVIEW',status:'OPEN'},data:{status:'CLOSED',completedAt:new Date()}});
      }
      const updated=await tx.tadapoOrder.update({ where: { id: o.id }, data: { stage: d.stage,
        ...(d.stage === "CREATION" ? { contentCompleteAt: o.contentCompleteAt || new Date() } : {}),
        ...(d.stage==='PREVIEW_SENT'?{firstVersionAt:o.firstVersionAt||new Date()}:{}),
        ...(o.stage === "REVIEW" && d.stage === "PREVIEW_SENT" ? { reviewVersion: { increment: 1 }, approvedAt: null, approvedVersion: null, approvedName: null } : {}) } });
      await tx.project.update({ where: { id: o.projectId }, data: { stage: d.stage as "CREATION" | "PREVIEW_SENT" | "REVIEW" | "PUBLISHED",...(d.stage==='PREVIEW_SENT'?{previewUrl:d.url}:{}) } });
      if(d.stage==='PREVIEW_SENT')await queueTadapoReviewInvite(tx,updated,state.rounds.length,d.requestId,d.message);
      if (d.stage === "PUBLISHED") await tx.lead.update({ where: { id: o.project!.leadId }, data: { status: "PUBLISHED" } });
    } else if(d.action==='payment-resend'){
      if(!d.requestId)throw new TadapoError('INVALID_ACTION');
      await queueTadapoEmail(tx,o,'TADAPO_PAYMENT','Votre commande Tadapo est confirmée',tadapoPaymentMessage(o),d.requestId);
    } else if(d.action==='review-resend'){
      const state=await tadapoReviewState(tx,o);
      if(!d.requestId||o.stage!=='PREVIEW_SENT'||state.waiting)throw new TadapoError('REVIEW_WAITING');
      await queueTadapoReviewInvite(tx,o,state.rounds.length,d.requestId,d.message);
    } else if(d.action==='domain-invite'){
      if(!d.requestId)throw new TadapoError('INVALID_ACTION');
      await queueTadapoDomainInvite(tx,o,d.requestId);
    } else if(d.action==='monthly-complete'){
      if(!d.feedbackId||!d.requestId)throw new TadapoError('INVALID_ACTION');
      const f=await tx.tadapoFeedback.findUniqueOrThrow({where:{id:d.feedbackId}});
      if(f.orderId!==o.id||f.kind!=='MONTHLY'||f.status!=='OPEN')throw new TadapoError('INVALID_ACTION');
      await tx.tadapoFeedback.update({where:{id:f.id},data:{status:'CLOSED',completedAt:new Date()}});
      await queueTadapoEmail(tx,o,'TADAPO_MONTHLY_DONE','Votre modification mensuelle Tadapo est réalisée',`Votre demande est réalisée :\n\n${f.content}\n\n${d.message||'Vous pouvez consulter le site et retrouver l’historique dans votre suivi.'}`,d.requestId,'monthly');
    } else if(d.action==='domain-renewal'){
      if(!o.domainPurchasedAt||!o.domainQuote||!d.requestId||!d.renewalAt||d.renewalHtCents===undefined||!Number.isSafeInteger(d.renewalHtCents)||d.renewalHtCents<0)throw new TadapoError('INVALID_ACTION');
      const q=o.domainQuote as TadapoDomainQuote;
      const proposal={id:d.requestId,renewalAt:d.renewalAt,renewalHtCents:d.renewalHtCents,previousHtCents:q.renewalHtCents,approvedAt:null};
      const history=Array.isArray(o.domainRenewalHistory)?o.domainRenewalHistory:[];
      await tx.tadapoOrder.update({where:{id:o.id},data:{domainRenewal:proposal,domainRenewalHistory:[...history,{...proposal,event:'PROPOSED'}]}});
      await queueTadapoEmail(tx,o,'TADAPO_DOMAIN_RENEWAL','Votre domaine Tadapo : changement de tarif au renouvellement',`Le tarif de renouvellement de ${q.domain} change pour le ${d.renewalAt}. Ancien tarif : ${(q.renewalHtCents/100).toFixed(2)} € HT/an. Nouveau tarif : ${(d.renewalHtCents/100).toFixed(2)} € HT/an. Prise en charge : ${(q.includedHtCents/100).toFixed(2)} € HT/an. Nouveau supplément : ${(Math.max(0,d.renewalHtCents-q.includedHtCents)/100).toFixed(2)} € HT/an.\n\nConfirmez votre accord depuis votre espace domaine. Le supplément fera l’objet d’un devis complémentaire à régler séparément avant renouvellement. Aucun supplément n’est prélevé automatiquement.`,d.requestId,'domain');
    } else if (d.action === "email") {
      if (!d.subject || !d.message || !d.requestId) throw new TadapoError("INVALID_ACTION");
      if (await tx.commercialEmail.findUnique({ where: { manualRequestId: d.requestId } })) return;
      await queueTadapoEmail(tx, o, "TADAPO_MANUAL", d.subject, d.message, d.requestId,d.purpose||'reviews');
    } else if (d.action === "domain") {
      if (o.domainAcceptedAt || o.domainSessionId || o.domainPurchasedAt) throw new TadapoError("DOMAIN_IMMUTABLE");
      const quote = prepareDomainQuote(d, o.offerSnapshot as unknown as TadapoOffer);
      if(!d.requestId)throw new TadapoError('INVALID_ACTION');
      const updated=await tx.tadapoOrder.update({ where: { id: o.id }, data: { domainQuote: quote, domainVersion: { increment: 1 } } });
      await queueTadapoEmail(tx,updated,'TADAPO_DOMAIN_QUOTE','Votre domaine Tadapo : tarifs vérifiés et devis complémentaire',`Domaine proposé : ${quote.domain}.\n${quote.kind==='existing'?'Vous conservez votre fournisseur et continuez à lui régler le renouvellement.':`Prix initial : ${(quote.initialHtCents/100).toFixed(2)} € HT ; renouvellement : ${(quote.renewalHtCents/100).toFixed(2)} € HT/an. Prise en charge : ${(quote.includedHtCents/100).toFixed(2)} € HT/an.\nSupplément initial : ${(quote.initialExtraHtCents/100).toFixed(2)} € HT ; supplément annuel : ${(quote.renewalExtraHtCents/100).toFixed(2)} € HT/an.`}\n\nConsultez le détail, approuvez le domaine et ses tarifs puis réglez le supplément éventuel depuis votre espace domaine. L’achat sera effectué manuellement à votre nom après accord et paiement. La disponibilité reste à confirmer au moment de l’achat. Aucun supplément n’est prélevé automatiquement.`,d.requestId,'domain');
    } else {
      const q = o.domainQuote as TadapoDomainQuote | null;
      if (!q || !o.domainAcceptedAt || q.initialExtraHtCents > 0 && !o.domainPaidAt) throw new TadapoError("DOMAIN_NOT_APPROVED_OR_PAID");
      if (d.action === "domain-purchased") {
        if (q.kind !== "new") throw new TadapoError("INVALID_ACTION");
        if(!d.requestId)throw new TadapoError('INVALID_ACTION');
        await tx.tadapoOrder.update({ where: { id: o.id }, data: { domainPurchasedAt: o.domainPurchasedAt || new Date() } });
        await queueTadapoEmail(tx,o,'TADAPO_DOMAIN_RESERVED','Votre nom de domaine Tadapo est réservé',`Le domaine ${q.domain} est réservé à votre nom pour votre projet. Son raccordement technique est une étape séparée. Cette confirmation ne signifie pas que le site est déjà en ligne.\n\nRenouvellement prévu : ${(q.renewalHtCents/100).toFixed(2)} € HT/an ; supplément annuel approuvé : ${(q.renewalExtraHtCents/100).toFixed(2)} € HT/an. Tout changement de prix sera annoncé pour obtenir votre nouvel accord avant facturation séparée.`,d.requestId,'domain');
      } else {
        if (q.kind === "new" && !o.domainPurchasedAt || !o.project?.websiteUrl || new URL(o.project.websiteUrl).hostname.replace(/^www\./, "") !== q.domain.replace(/^www\./, "")) throw new TadapoError("DOMAIN_NOT_READY");
        await tx.tadapoOrder.update({ where: { id: o.id }, data: { domainReadyAt: new Date() } });
      }
    }
    await tx.activityLog.create({ data: { actorId: actor.id, projectId: o.projectId, action: `TADAPO_${d.action.toUpperCase().replaceAll("-", "_")}`, before: o.stage, after: d.stage } });
  });
}
export async function attachTadapoFile(h: Headers, id: string, filename: string, bytes: Buffer) {
  const actor = await authenticate(h); z.uuid().parse(id);
  const file = checkUpload(filename, bytes);
  await workspaceDb(h).$transaction(async tx => {
    const o = await tx.tadapoOrder.findUniqueOrThrow({ where: { id } });
    if (!o.projectId) throw new TadapoError("INVALID_ACTION");
    await tx.tadapoFile.create({ data: { orderId: id, filename: file.filename, mimeType: file.mime, sizeBytes: bytes.length, encrypted: seal(bytes.toString("base64")) } });
    await tx.activityLog.create({ data: { actorId: actor.id, projectId: o.projectId, action: "TADAPO_FILE_ATTACHED" } });
  });
}
