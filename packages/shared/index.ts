export const leadStatuses = {
  PENDING_VERIFICATION: "En attente de vérification", NEW: "Nouvelle demande", TO_QUALIFY: "À qualifier",
  QUALIFIED: "Demande qualifiée", REJECTED: "Demande refusée", IN_PROGRESS: "En création",
  PREVIEW_SENT: "Proposition envoyée", APPROVED: "Proposition acceptée", AWAITING_PAYMENT: "En attente de paiement",
  PAID: "Paiement confirmé", PUBLISHING: "En publication", PUBLISHED: "Site en ligne", CANCELLED: "Annulé",
} as const;
export type LeadStatusCode = keyof typeof leadStatuses;
export const projectStages = {
  ACCEPTED: "Projet accepté", CONTENT_PREPARATION: "Préparation des contenus", CREATION: "Création du site",
  REVIEW: "Vérification du site", PREVIEW_READY: "Proposition prête", PREVIEW_SENT: "Proposition envoyée",
  AWAITING_APPROVAL: "Attente de validation", APPROVED: "Validation obtenue", AWAITING_PAYMENT: "Attente du paiement",
  PAID: "Paiement confirmé", PUBLISHING: "Mise en ligne", PUBLISHED: "Site en ligne", CANCELLED: "Annulé",
} as const;
export type ProjectStageCode = keyof typeof projectStages;
export const leadTransitions: Record<LeadStatusCode, readonly LeadStatusCode[]> = {
  PENDING_VERIFICATION: [], NEW: ["TO_QUALIFY", "QUALIFIED", "REJECTED", "CANCELLED"],
  TO_QUALIFY: ["QUALIFIED", "REJECTED", "CANCELLED"], QUALIFIED: ["REJECTED", "CANCELLED"],
  REJECTED: ["TO_QUALIFY"], IN_PROGRESS: ["CANCELLED"], PREVIEW_SENT: ["CANCELLED"],
  APPROVED: ["CANCELLED"], AWAITING_PAYMENT: ["CANCELLED"], PAID: ["CANCELLED"],
  PUBLISHING: ["CANCELLED"], PUBLISHED: [], CANCELLED: [],
};
const order = Object.keys(projectStages).filter((key) => key !== "CANCELLED") as ProjectStageCode[];
export function nextProjectStages(stage: ProjectStageCode): ProjectStageCode[] {
  if (stage === "CANCELLED" || stage === "PUBLISHED") return [];
  return [order[order.indexOf(stage) + 1], "CANCELLED" as const].filter(Boolean);
}
export function leadStatusForStage(stage: ProjectStageCode): LeadStatusCode {
  if (["ACCEPTED", "CONTENT_PREPARATION", "CREATION", "REVIEW", "PREVIEW_READY"].includes(stage)) return "IN_PROGRESS";
  if (stage === "AWAITING_APPROVAL") return "PREVIEW_SENT";
  return stage as LeadStatusCode;
}
