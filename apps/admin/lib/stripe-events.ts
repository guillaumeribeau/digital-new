export const stripeEvents = [
  "checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired",
  "payment_intent.payment_failed", "invoice.finalized", "invoice.paid", "invoice.payment_failed", "invoice.payment_action_required",
  "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
  "charge.refunded", "refund.created", "refund.updated", "refund.failed", "charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed", "charge.dispute.funds_withdrawn", "charge.dispute.funds_reinstated",
] as const;
