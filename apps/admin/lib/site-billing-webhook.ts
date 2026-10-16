import Stripe from "stripe";
import { getDb } from "@nova/database";
import { z } from "zod";
import { CommercialError, paymentMode } from "./commercial-core";
import { stripeClient } from "./commercial-payment";
import { creationTtc } from "./site-billing-shared";
import { queueSiteNotice, storeBillingInvoice, syncSiteSubscription } from "./site-billing";

export async function applySiteBillingEvent(event: Stripe.Event) {
  const mode = event.livemode ? "LIVE" : "TEST";
  if (mode !== paymentMode()) throw new CommercialError("INVALID_ACTION");
  const key = "site-stripe/" + event.id;
  if (await getDb().commercialWebhook.findUnique({ where: { key } })) return;
  const stripe = stripeClient();
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.siteOrderId;
    if (!z.uuid().safeParse(id).success || session.payment_status !== "paid") return;
    const current = await getDb().siteOrder.findUniqueOrThrow({ where: { id } });
    if (current.checkoutAttempt !== session.metadata?.attemptId || current.version !== Number(session.metadata?.version) || current.mode !== mode || current.stripeCustomerId !== session.customer || session.amount_total !== creationTtc(current.creationHtCents) || session.currency !== "eur" || !current.consentAt) throw new CommercialError("INVALID_ACTION");
    const intent = typeof session.payment_intent === "string" ? await stripe.paymentIntents.retrieve(session.payment_intent) : session.payment_intent;
    const method = typeof intent?.payment_method === "string" ? intent.payment_method : intent?.payment_method?.id;
    if (!method || intent?.status !== "succeeded") throw new CommercialError("INVALID_ACTION");
    await getDb().$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${current.id}::uuid FOR UPDATE`;
      await tx.siteOrder.update({ where: { id: current.id }, data: { status: "PAID", creationPaidAt: current.creationPaidAt || new Date(), paymentMethodId: method, stripeSessionId: session.id } });
    });
    await queueSiteNotice(current.id, "CREATION_PAID", "Votre commande Zelyweb est confirmée", "Le paiement de la création est confirmé. Vous pouvez transmettre vos trois séries de retours regroupés dans les 30 jours : textes, photos, couleurs et ajustements de présentation. L’abonnement commencera à la mise en ligne après les ajustements.");
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
          await queueSiteNotice(order.id, invoice.id + "/" + event.type, "Votre abonnement Zelyweb : paiement à régulariser", `Un paiement nécessite votre intervention. Vous pouvez consulter la facture et mettre à jour votre carte dans votre portail client.${invoice.hosted_invoice_url ? "\n\nRégler la facture : " + invoice.hosted_invoice_url : ""}`);
        }
        if (invoice.status === "paid" && invoice.amount_paid === creationTtc(order.monthlyHtCents) && invoice.currency === "eur" && invoice.billing_reason === "subscription_create") await queueSiteNotice(order.id, "SUBSCRIPTION_ACTIVE", "Votre abonnement Zelyweb est activé", "Le premier paiement mensuel est confirmé. Votre abonnement est activé ; Zelyweb peut finaliser la mise en ligne de votre site. Vos factures et la gestion de votre abonnement sont disponibles depuis votre portail client.");
      }
    } else if (z.uuid().safeParse(invoice.metadata?.quoteId).success) {
      const quote = await getDb().quote.findUniqueOrThrow({ where: { id: invoice.metadata!.quoteId } });
      if (invoice.currency !== quote.currency || invoice.total !== quote.totalCents) throw new CommercialError("INVALID_ACTION");
      await getDb().$transaction(tx => storeBillingInvoice(tx, invoice, undefined, quote.id));
    }
  } else return;
  await getDb().commercialWebhook.upsert({ where: { key }, create: { key, provider: "STRIPE" }, update: {} });
}
