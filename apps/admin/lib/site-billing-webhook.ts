import { applyFinancialEvent } from "./financial-events";
import { financialStage } from "./operations";
import Stripe from "stripe";
import { getDb } from "@nova/database";
import { z } from "zod";
import { CommercialError, paymentMode } from "./commercial-core";
import { stripeClient } from "./commercial-payment";
import { billingMoney, creationTtc } from "./site-billing-shared";
import { queueSiteNotice, queueOwnerBillingNotice, storeBillingInvoice, syncSiteSubscription } from "./site-billing";
import { queueDomainInvitation, queueReviewInvitation } from "./site-workflow-mail";

export async function applySiteBillingEvent(event: Stripe.Event) {
  const mode = event.livemode ? "LIVE" : "TEST";
  if (mode !== paymentMode()) throw new CommercialError("INVALID_ACTION");
  const key = "site-stripe/" + event.id;
  if (await getDb().commercialWebhook.findUnique({ where: { key } })) return;
  await applyFinancialEvent(event);
  const stripe = stripeClient();
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.siteOrderId;
    if (!z.uuid().safeParse(id).success || session.payment_status !== "paid") return;
    const current = await getDb().siteOrder.findUniqueOrThrow({ where: { id } });
    if (session.metadata?.purpose === "SITE_SUBSCRIPTION") {
      if (current.subscriptionAttempt !== session.metadata.attemptId || current.subscriptionInviteVersion !== Number(session.metadata.inviteVersion) || !current.subscriptionConsentAt || current.mode !== mode || current.stripeCustomerId !== session.customer || session.amount_total !== creationTtc(current.monthlyHtCents) || session.currency !== "eur") throw new CommercialError("INVALID_ACTION");
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!subscriptionId) throw new CommercialError("INVALID_ACTION");
      await syncSiteSubscription(current.id, subscriptionId);
    } else {
      if (current.checkoutAttempt !== session.metadata?.attemptId || current.version !== Number(session.metadata?.version) || current.mode !== mode || current.stripeCustomerId !== session.customer || session.amount_total !== creationTtc(current.creationHtCents) || session.currency !== "eur" || !current.consentAt) throw new CommercialError("INVALID_ACTION");
      const intent = typeof session.payment_intent === "string" ? await stripe.paymentIntents.retrieve(session.payment_intent) : session.payment_intent;
      const method = typeof intent?.payment_method === "string" ? intent.payment_method : intent?.payment_method?.id;
      if (!method || intent?.status !== "succeeded") throw new CommercialError("INVALID_ACTION");
      await getDb().$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${current.id}::uuid FOR UPDATE`;
        await financialStage(tx, current.projectId, "PAID");
        await tx.siteOrder.update({ where: { id: current.id }, data: { status: "PAID", creationPaidAt: current.creationPaidAt || new Date(), paymentMethodId: method, stripeSessionId: session.id } });
      });
      await queueSiteNotice(current.id, "CREATION_PAID", "Votre paiement Zelyweb est confirmé", `Le paiement de la création de ${billingMoney(creationTtc(current.creationHtCents))} TTC est confirmé. Votre suivi et vos factures sont accessibles depuis votre espace privé. Deux e-mails séparés vous invitent à transmettre votre première série de modifications et à choisir votre nom de domaine. L’abonnement sera activé par vos soins après validation du site.`);
      await getDb().$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${current.id}::uuid FOR UPDATE`;
        const o = await tx.siteOrder.findUniqueOrThrow({ where: { id: current.id }, include: { project: { include: { lead: true } }, reviewRounds: true } });
        // A delayed duplicate payment event must never invite a client back into an old series.
        if (!o.reviewRounds.length && !o.finalApprovedAt && !o.subscriptionInviteSentAt) {
          await queueReviewInvitation(tx, o, 0);
          await tx.siteOrder.update({ where: { id: o.id }, data: { revisionEmailSentAt: o.revisionEmailSentAt || new Date() } });
        }
        await queueDomainInvitation(tx, o);
      });
      await queueOwnerBillingNotice(current.id, "CREATION_PAID", "Création du site payée", `Le paiement de création de ${billingMoney(creationTtc(current.creationHtCents))} TTC est confirmé. Vous pouvez poursuivre les ajustements avec le client.`);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const raw = event.data.object as Stripe.PaymentIntent;
    if (!z.uuid().safeParse(raw.metadata?.siteOrderId).success) return;
    const intent = await stripe.paymentIntents.retrieve(raw.id);
    const order = await getDb().siteOrder.findUniqueOrThrow({ where: { id: raw.metadata.siteOrderId } });
    if (order.mode !== mode || order.stripeCustomerId !== intent.customer || intent.metadata.siteOrderId !== order.id || intent.amount !== creationTtc(order.creationHtCents) || intent.currency !== "eur") throw new CommercialError("INVALID_ACTION");
    if (intent.status === "requires_payment_method" && !order.creationPaidAt) await queueOwnerBillingNotice(order.id, "PAYMENT_FAILED/" + intent.id + "/" + event.id, "Échec du paiement de création", "La tentative de paiement de création a échoué. Consultez Stripe et la fiche projet avant de contacter le client.");
  } else if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!z.uuid().safeParse(session.metadata?.siteOrderId).success) return;
    const order = await getDb().siteOrder.findUniqueOrThrow({ where: { id: session.metadata!.siteOrderId } });
    if (order.mode !== mode || order.stripeCustomerId !== session.customer) throw new CommercialError("INVALID_ACTION");
    const currentSession = await stripe.checkout.sessions.retrieve(session.id);
    if (currentSession.payment_status !== "paid") await queueOwnerBillingNotice(order.id, "PAYMENT_FAILED/" + session.id, "Échec de paiement client", "Le paiement n’a pas abouti. Consultez Stripe et la fiche projet avant de contacter le client. Aucune suspension automatique.");
  } else if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const id = sub.metadata?.siteOrderId;
    if (!z.uuid().safeParse(id).success) return;
    await syncSiteSubscription(id!, sub.id);
  } else if (["invoice.paid", "invoice.payment_failed", "invoice.payment_action_required", "invoice.finalized"].includes(event.type)) {
    // Retrieve current provider state: delayed events must not overwrite a paid invoice.
    const raw = event.data.object as Stripe.Invoice;
    const invoice = await stripe.invoices.retrieve(raw.id);
    const sub = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof sub === "string" ? sub : sub?.id;
    const id = invoice.metadata?.siteOrderId || invoice.parent?.subscription_details?.metadata?.siteOrderId;
    const order = id ? await getDb().siteOrder.findUnique({ where: { id } }) : subscriptionId ? await getDb().siteOrder.findUnique({ where: { stripeSubscriptionId: subscriptionId } }) : null;
    if (order) {
      if (invoice.customer !== order.stripeCustomerId || mode !== order.mode) throw new CommercialError("INVALID_ACTION");
      await getDb().$transaction(tx => storeBillingInvoice(tx, invoice, order.id));
      if (subscriptionId) {
        await syncSiteSubscription(order.id, subscriptionId);
        if (invoice.status !== "paid" && (event.type === "invoice.payment_failed" || event.type === "invoice.payment_action_required")) {
          await queueOwnerBillingNotice(order.id, "PAYMENT_FAILED/" + invoice.id, "Paiement d’abonnement à régulariser", `Un paiement d’abonnement nécessite une intervention. Facture : ${invoice.id}. Consultez le suivi dans l’admin. Aucune suspension automatique du site.`);
          await queueSiteNotice(order.id, invoice.id + "/" + event.type, "Votre abonnement Zelyweb : paiement à régulariser", `Un paiement nécessite votre intervention. Vous pouvez consulter la facture et mettre à jour votre carte dans votre portail client.${invoice.hosted_invoice_url ? "\n\nRégler la facture : " + invoice.hosted_invoice_url : ""}`);
        }
        if (invoice.status === "paid" && invoice.currency === "eur" && invoice.billing_reason !== "subscription_create") await queueOwnerBillingNotice(order.id, "SUBSCRIPTION_PAYMENT/" + invoice.id, "Facture d’abonnement réglée", `Une facture d’abonnement est réglée. Montant payé : ${billingMoney(invoice.amount_paid)} TTC. Référence : ${invoice.id}. Consultez les factures dans la fiche projet.`);
        if (invoice.status === "paid" && invoice.amount_paid === creationTtc(order.monthlyHtCents) && invoice.currency === "eur" && invoice.billing_reason === "subscription_create") await queueSiteNotice(order.id, "SUBSCRIPTION_ACTIVE", "Votre abonnement Zelyweb est activé", "Le premier paiement mensuel est confirmé et votre abonnement est activé. Votre site sera mis en ligne sur le domaine définitif sous 2 jours ouvrés, si le domaine et ses accès sont prêts. Vos factures et la gestion de votre abonnement sont disponibles depuis votre portail client.");
      }
    } else if (z.uuid().safeParse(invoice.metadata?.quoteId).success) {
      const quote = await getDb().quote.findUniqueOrThrow({ where: { id: invoice.metadata!.quoteId } });
      if (invoice.currency !== quote.currency || invoice.total !== quote.totalCents) throw new CommercialError("INVALID_ACTION");
      await getDb().$transaction(tx => storeBillingInvoice(tx, invoice, undefined, quote.id));
    }
  } else return;
  await getDb().commercialWebhook.upsert({ where: { key }, create: { key, provider: "STRIPE" }, update: {} });
}
