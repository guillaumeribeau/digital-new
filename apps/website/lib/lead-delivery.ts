import { z } from "zod";
import { brand } from "../config/brand.config";
import { leadStyleLabels } from "./lead-schema";
import type { Lead as StoredLead } from "@nova/database";
import { localEmailMode } from "./local-email";
import { escapeEmailHtml, leadEmailTemplate } from "./lead-email-template";

export class DeliveryUnavailable extends Error {}
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.LEAD_FROM_EMAIL && process.env.LEAD_TO_EMAIL);
}
export const emailPayloadSchema = z.object({
  from: z.string(), to: z.array(z.email()).min(1), subject: z.string(), text: z.string(),
  html: z.string().optional(),
  reply_to: z.email().optional(),
});
export type EmailPayload = z.infer<typeof emailPayloadSchema>;
const sender = () => localEmailMode() ? "Zelyweb Local <no-reply@nova.test>" : process.env.LEAD_FROM_EMAIL!;
export function verificationEmail(lead: Pick<StoredLead, "fullName" | "email" | "id">, token: string): EmailPayload {
  const link = new URL("/confirmer-demande", process.env.NEXT_PUBLIC_SITE_URL);
  link.hash = "token=" + token;
  return { from: sender(), to: [lead.email],
    subject: "Confirmez votre demande de site — " + brand.name,
    html: leadEmailTemplate({
      preview: "Un clic pour confirmer votre demande et nous permettre de découvrir votre projet.",
      label: "Votre futur site commence ici",
      title: "Un clic, et votre projet peut commencer.",
      introduction: `Bonjour ${lead.fullName},`,
      content: `<p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#41423c;">Nous avons bien enregistré votre demande de site. Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail et nous permettre de prendre en charge votre projet.</p>`,
      afterAction: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td bgcolor="#f4f6eb" style="padding:18px;border-left:3px solid #d4e92d;font-size:14px;line-height:1.8;"><strong>La suite est simple.</strong><br>Votre demande sera validée dès l’ouverture du lien. Vous recevrez ensuite un second e-mail de confirmation.</td></tr></table>
        <p style="margin:18px 0;font-size:12px;line-height:1.8;color:#585952;">Ce lien personnel est valable 24 heures et utilisable une seule fois. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>`,
      reference: lead.id,
      action: { label: "Confirmer ma demande", url: link.href },
    }),
    text: `Bonjour ${lead.fullName},\n\nVotre demande est enregistrée. Confirmez votre adresse e-mail pour que notre équipe puisse la traiter :\n${link}\n\nCe lien est valable 24 heures et utilisable une seule fois. Si vous n’avez pas fait cette demande, ignorez cet e-mail.\n\nPremière version complète de cinq pages gratuite sur aperçu privé. Création : 299 € HT (358,80 € TTC) après acceptation. Abonnement obligatoire à la mise en ligne : 29 € HT (34,80 € TTC)/mois, sans durée minimale. Aucun paiement à cette étape.\n\nRéférence : ${lead.id}\n\n${brand.name}` };
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
      html: leadEmailTemplate({
        preview: "Votre adresse e-mail est validée. Notre équipe peut maintenant examiner votre projet.",
        label: "C’est confirmé, on prend le relais",
        title: "Votre demande est entre de bonnes mains.",
        introduction: `Bonjour ${lead.fullName},`,
        content: `<p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#41423c;">Votre adresse e-mail est vérifiée et votre demande pour <strong>${escapeEmailHtml(lead.businessName)}</strong> est confirmée. Vous n’avez plus rien à valider.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td bgcolor="#f4f6eb" style="padding:20px;border-left:3px solid #d4e92d;">
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;font-weight:bold;">Et maintenant ?</p>
          <p style="margin:0;font-size:14px;line-height:1.9;">01 &nbsp; Nous découvrons votre activité et vos envies.<br>02 &nbsp; Nous vous recontactons pour préciser votre projet.<br>03 &nbsp; Nous préparons votre première proposition gratuite.</p></td></tr></table>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.8;color:#41423c;">Vous découvrez la proposition, puis vous décidez. Aucun paiement ne vous est demandé à cette étape.</p>`,
        reference: lead.id,
      }),
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
