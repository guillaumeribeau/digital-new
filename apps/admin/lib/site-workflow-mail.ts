import { type Prisma, type SiteOrder } from "@nova/database";
import { CommercialError, commercialLocal, publicOrigin, replyAddress, seal, sender, unseal } from "./commercial-core";
import { business } from "@nova/shared/business";
import { billingMoney, billingNoticeEmail, defaultRevisionMessage } from "./site-billing-shared";

export type WorkflowOrder = SiteOrder & { project: { lead: { fullName: string; email: string } } };
export const ovhDomainSearch = "https://www.ovhcloud.com/fr/domains/";
export function workflowLink(o: SiteOrder, purpose: "reviews" | "domain") {
  return `${publicOrigin()}/client/site/${o.id}?parcours=${purpose === "domain" ? "domaine" : "retours"}#token=${unseal(o.tokenEncrypted)}`;
}
export function siteReplyAddress(o: SiteOrder, purpose: "reviews" | "domain") {
  if (!process.env.COMMERCIAL_REPLY_DOMAIN && !commercialLocal()) return business.email;
  const token = unseal(o.tokenEncrypted);
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new CommercialError("CONFIGURATION_REQUIRED");
  return replyAddress(`${purpose === "domain" ? "d" : `s${o.reviewVersion}`}-${token}`).replace(/^r-/, "");
}
export async function queueWorkflowEmail(tx: Prisma.TransactionClient, o: WorkflowOrder, input: {
  key: string; kind: string; purpose: "reviews" | "domain"; subject: string; text: string; requestId?: string;
}) {
  const key = `site-workflow/${o.id}/${input.key}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  if (await tx.commercialWebhook.findUnique({ where: { key } })) return;
  const link = workflowLink(o, input.purpose), subject = `${o.mode === "TEST" ? "[TEST] " : ""}${input.subject}`;
  const text = `${o.mode === "TEST" ? "MODE TEST — aucun débit réel.\n\n" : ""}${input.text}`;
  await tx.commercialEmail.create({ data: { siteOrderId: o.id, kind: input.kind, manualRequestId: input.requestId,
    expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({ from: sender(), to: [o.project.lead.email],
      reply_to: siteReplyAddress(o, input.purpose), subject, text: `Bonjour ${o.project.lead.fullName},\n\n${text}\n\n${link}\n\nGuillaume · Zelyweb`,
      html: billingNoticeEmail(o.project.lead.fullName, subject, text, link, input.purpose === "domain" ? "Mon nom de domaine" : "Voir le site et transmettre mes retours") }) } });
  await tx.commercialWebhook.create({ data: { key, provider: "INTERNAL" } });
}
export async function queueReviewInvitation(tx: Prisma.TransactionClient, o: WorkflowOrder, completed: number, requestId?: string, message?: string) {
  const next = completed + 1;
  const subject = completed === 0 ? "Votre site : première série de modifications" : completed < 3 ? `Votre site corrigé : série ${next}/3${next === 3 ? " — dernière série" : ""}` : "Votre site corrigé : validation finale";
  await queueWorkflowEmail(tx, o, { key: requestId || `review-version/${o.reviewVersion}`, kind: "SITE_REVIEW_INVITE", purpose: "reviews", requestId, subject,
    text: `${completed ? "Les corrections de votre série précédente ont été réalisées. Découvrez la nouvelle version depuis votre espace privé.\n\n" : "Votre paiement est confirmé. Vous pouvez maintenant préparer votre première série de modifications.\n\n"}${message || (completed === 0 ? defaultRevisionMessage : "Vérifiez la version corrigée avant de répondre.")}\n\n${next <= 3 ? `Série ${next}/3${next === 3 ? " : dernière série incluse" : ""}. Regroupez vos demandes dans le formulaire, puis envoyez-les en une seule fois. Après cet envoi, attendez notre version corrigée avant de transmettre d’autres demandes. Vous pouvez aussi valider le site dès qu’il vous convient. Les retours inclus sont à transmettre dans les 30 jours suivant le paiement.` : "Les trois séries incluses sont terminées. Vous pouvez valider la version finale ou demander un devis pour des changements supplémentaires."}\n\nAperçu : ${o.reviewUrl || o.previewUrl}\nLe nom de domaine se choisit dans un parcours séparé.` });
}
export async function queueDomainInvitation(tx: Prisma.TransactionClient, o: WorkflowOrder, requestId?: string) {
  await queueWorkflowEmail(tx, o, { key: requestId || "domain-initial", kind: "SITE_DOMAIN_INVITE", purpose: "domain", requestId,
    subject: "Choisissez votre nom de domaine Zelyweb", text: `Choisissez l’adresse de votre futur site, indépendamment des corrections.\n\nRecherchez un nom disponible chez OVH : ${ovhDomainSearch}\n\nLe domaine est pris en charge jusqu’à 20 € HT/an, à l’achat comme au renouvellement. Vérifiez les deux tarifs : une promotion sur la première année ne garantit pas le prix des années suivantes. Ne commandez pas le domaine vous-même : transmettez-nous votre choix dans le formulaire.\n\nSi vous préférez un domaine plus cher, nous vous présenterons les coûts initial et annuel. La différence au-delà de 20 € HT fera l’objet d’un devis séparé à accepter et régler avant réservation. En cas de changement du prix au renouvellement, vous serez informé et votre nouvel accord sera demandé avant tout supplément.\n\nLa disponibilité et les prix seront vérifiés avant achat. Votre choix ne réserve pas le domaine. Si vous possédez déjà un domaine, indiquez-le simplement dans le formulaire.` });
}
export function domainSupplementText(initial: number, renewal: number) {
  return `Prix initial : ${billingMoney(initial)} HT ; renouvellement : ${billingMoney(renewal)} HT/an. Prise en charge : 20 € HT/an. Supplément initial : ${billingMoney(Math.max(0, initial - 2000))} HT ; supplément annuel : ${billingMoney(Math.max(0, renewal - 2000))} HT/an. Tout changement de tarif au renouvellement sera annoncé avant accord et facturation séparée.`;
}
