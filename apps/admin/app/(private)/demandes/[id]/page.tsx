import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { leadStatuses, leadTransitions } from "@nova/shared";
import { leadStyleLabels } from "@nova/validation";
import { requireAdmin } from "../../../../lib/access";
import { adminService } from "../../../../lib/service";
import { PageTitle, Status, DetailFields, SafeUrl, date } from "../../../../components/ui";
import { MutationForm } from "../../../../components/mutation-form";
import { Notes, History } from "../../../../components/notes";
export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const lead = await adminService.lead(await headers(), id);
  if (!lead) notFound();
  const options = leadTransitions[lead.status];
  return <><Link className="back-link" href="/demandes">← Toutes les demandes</Link><PageTitle eyebrow="FICHE DEMANDE" title={lead.businessName} description={`Reçue le ${date(lead.createdAt)} · ${lead.fullName}`} action={<Status value={lead.status} />} />
    <p className="reference">Référence : {lead.id}</p><div className="detail-grid section-gap"><div className="detail-stack">
      <section className="panel"><h2>Le prospect et son entreprise</h2><DetailFields rows={[["Nom complet", lead.fullName], ["Entreprise", lead.businessName], ["E-mail", lead.email], ["Téléphone", lead.phone], ["Contact préféré", lead.preferredContactMethod === "telephone" ? "Téléphone" : "E-mail"], ["Ville", lead.city], ["Secteur", lead.businessSector], ["Type d’entreprise", lead.businessType], ["SIRET", lead.siret]]} /></section>
      <section className="panel"><h2>Le brief du projet</h2><DetailFields rows={[["Description", lead.projectDescription], ["Prestations", lead.services], ["Direction visuelle", leadStyleLabels[lead.preferredStyle as keyof typeof leadStyleLabels] || lead.preferredStyle], ["Couleurs", lead.preferredColors], ["Logo", lead.hasLogo], ["Photographies", lead.hasPhotos], ["Site existant", lead.hasWebsite], ["URL actuelle", <SafeUrl key="website" value={lead.currentWebsite} />], ["Compléments", lead.additionalInformation]]} /><p className="info-line">{lead.files.length ? `${lead.files.length} référence(s) de fichier enregistrée(s). L’accès privé au stockage n’est pas encore configuré.` : "Aucun fichier transmis par le formulaire."}</p>{lead.files.map((file) => <p key={file.id}>{file.originalName} · {file.mimeType} · {file.sizeBytes} octets</p>)}</section>
      <Notes id={lead.id} kind="lead" notes={lead.internalNotes} />
    </div><div className="detail-stack"><section className="panel"><h2>Qualification</h2><DetailFields rows={[["E-mail vérifié", lead.emailVerifiedAt ? date(lead.emailVerifiedAt) : "En attente"], ["Tarifs pris en connaissance", date(lead.pricingAcknowledgedAt)], ["Version tarifaire", lead.pricingVersion], ["Information de traitement", date(lead.privacyAcknowledgedAt)], ["Version confidentialité", lead.privacyVersion], ["Source", lead.source], ["UTM source", lead.utmSource], ["UTM support", lead.utmMedium], ["UTM campagne", lead.utmCampaign]]} /></section>
      <section className="panel"><h2>Prochaine étape</h2>{lead.project ? <><p className="info-line">Cette demande est associée à un projet. Son statut suit les étapes de production.</p><Link className="button" href={`/projets/${lead.project.id}`}>Ouvrir le projet →</Link></> : <>
        {!lead.emailVerifiedAt ? <p className="notice section-gap">La qualification attend la vérification de l’adresse e-mail. Aucun changement de statut n’est possible à cette étape.</p> : options.length ? <MutationForm key={lead.status} id={lead.id} operation="lead-status" button="Modifier le statut"><input type="hidden" name="expected" value={lead.status} /><label htmlFor="status">Nouveau statut</label><select name="status" id="status">{options.map((status) => <option value={status} key={status}>{leadStatuses[status]}</option>)}</select></MutationForm> : <p className="info-line">Aucune transition disponible pour ce statut.</p>}
        {lead.status === "QUALIFIED" && lead.emailVerifiedAt && <MutationForm id={lead.id} convert button="Transformer en projet" />}
      </>}</section><History items={lead.activityLogs} /></div></div></>;
}
