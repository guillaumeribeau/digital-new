import { z } from "zod";
import { brand } from "../config/brand.config";
import { leadStyleLabels } from "./lead-schema";
import type { Lead as StoredLead } from "@nova/database";
import { localEmailMode } from "./local-email";

export class DeliveryUnavailable extends Error {}
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.LEAD_FROM_EMAIL && process.env.LEAD_TO_EMAIL);
}
export const emailPayloadSchema = z.object({
  from: z.string(), to: z.array(z.email()).min(1), subject: z.string(), text: z.string(),
  reply_to: z.email().optional(),
});
export type EmailPayload = z.infer<typeof emailPayloadSchema>;
const sender = () => localEmailMode() ? "NOVA Local <no-reply@nova.test>" : process.env.LEAD_FROM_EMAIL!;
export function verificationEmail(lead: Pick<StoredLead, "fullName" | "email" | "id">, token: string): EmailPayload {
  const link = new URL("/confirmer-demande", process.env.NEXT_PUBLIC_SITE_URL);
  link.hash = "token=" + token;
  return { from: sender(), to: [lead.email],
    subject: "Confirmez votre demande de site — " + brand.name,
    text: `Bonjour ${lead.fullName},\n\nVotre demande est enregistrée. Confirmez votre adresse e-mail pour que notre équipe puisse la traiter :\n${link}\n\nCe lien est valable 24 heures et utilisable une seule fois. Si vous n’avez pas fait cette demande, ignorez cet e-mail.\n\nPremière proposition gratuite. Création : 299 € HT après validation. Gestion technique : 29 € HT/mois, sans engagement de durée. Aucun paiement à cette étape.\n\nRéférence : ${lead.id}\n\n${brand.name}` };
}
export function verifiedEmails(lead: StoredLead): { receipt: EmailPayload; internal: EmailPayload } {
  const from = sender();
  const summary = [
    ["Entreprise", lead.businessName], ["Secteur", lead.businessSector], ["Ville", lead.city],
    ["Métier et prestations", lead.services], ["Description", lead.projectDescription],
    ["Style", leadStyleLabels[lead.preferredStyle as keyof typeof leadStyleLabels]],
    ["Couleurs", lead.preferredColors], ["Site actuel", lead.currentWebsite],
    ["Logo", lead.hasLogo], ["Photos", lead.hasPhotos], ["Compléments", lead.additionalInformation],
    ["Nom", lead.fullName], ["E-mail", lead.email], ["Téléphone", lead.phone],
    ["Contact préféré", lead.preferredContactMethod],
  ].map(([label, value]) => `${label} : ${value || "Non renseigné"}`).join("\n");
  return {
    receipt: { from, to: [lead.email], subject: "Votre demande est confirmée — " + brand.name,
      text: `Bonjour ${lead.fullName},\n\nVotre adresse e-mail est vérifiée et votre demande pour ${lead.businessName} est confirmée. Notre équipe va examiner votre projet et vous recontacter. La première proposition est gratuite ; aucun paiement n’est demandé à cette étape.\n\nRéférence : ${lead.id}\n\nÀ bientôt,\n${brand.name}` },
    internal: { from, to: [localEmailMode() ? "equipe@nova.test" : process.env.LEAD_TO_EMAIL!], reply_to: lead.email,
      subject: "Nouvelle demande vérifiée — " + brand.name,
      text: `Référence : ${lead.id}\n\n${summary}\n\nAdresse e-mail vérifiée. Tarifs pris en connaissance : ${lead.pricingVersion}. Information de traitement : ${lead.privacyVersion}.` },
  };
}
export async function sendEmail(payload: EmailPayload, eventId: string) {
  if (localEmailMode()) throw new DeliveryUnavailable("LOCAL_EMAIL_PREVIEW_ONLY");
  if (!emailConfigured()) throw new DeliveryUnavailable("EMAIL_NOT_CONFIGURED");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json", "Idempotency-Key": "nova-outbox/" + eventId,
    }, body: JSON.stringify(emailPayloadSchema.parse(payload)),
    signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  if (!response.ok) throw new DeliveryUnavailable("EMAIL_PROVIDER_REJECTED");
  const result = await response.json();
  if (typeof result.id !== "string" || !result.id) throw new DeliveryUnavailable("EMAIL_UNCONFIRMED");
  return result.id as string;
}
