export const manualPaymentKinds = ["QUOTE", "SITE_CREATION", "SITE_SUBSCRIPTION", "TADAPO_SUBSCRIPTION", "TADAPO_DOMAIN"] as const;
export type ManualPaymentKind = typeof manualPaymentKinds[number];
export const manualPaymentStatuses: Record<string, string> = { PAID: "Payé", PENDING: "En attente", FAILED: "Paiement échoué" };
