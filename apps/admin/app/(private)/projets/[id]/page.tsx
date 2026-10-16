import Link from "next/link";
import { getDb } from "@nova/database";
import { SiteBillingCard } from "../../../../components/site-billing-card";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { nextProjectStages, projectStages } from "@nova/shared";
import { requireAdmin } from "../../../../lib/access";
import { adminService } from "../../../../lib/service";
import { PageTitle, Status, DetailFields, SafeUrl, date } from "../../../../components/ui";
import { MutationForm } from "../../../../components/mutation-form";
import { Notes, History } from "../../../../components/notes";
export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const project = await adminService.project(await headers(), id);
  if (!project) notFound();
  const billing = await getDb().siteOrder.findUnique({ where: { projectId: id }, include: { invoices: { orderBy: { createdAt: "desc" }, take: 50 } } });
  const billingView = billing ? { id: billing.id, version: billing.version, status: billing.status, mode: billing.mode, previewUrl: billing.previewUrl, screenshot: billing.screenshot, message: billing.message, creationHtCents: billing.creationHtCents, paid: !!billing.creationPaidAt, revisionEmailSent: !!billing.revisionEmailSentAt, revisionEmailMessage: billing.revisionEmailMessage, subscriptionInvited: !!billing.subscriptionInviteSentAt, subscriptionStatus: billing.subscriptionStatus, subscriptionId: !!billing.stripeSubscriptionId, firstPaid: !!billing.firstSubscriptionPaidAt, alert: billing.billingAlert, cancelAtPeriodEnd: billing.cancelAtPeriodEnd, invoiceUrl: billing.lastInvoiceUrl, invoices: billing.invoices.map(i => ({ id: i.id, status: i.status, amountCents: i.amountCents, hostedUrl: i.hostedUrl, pdfUrl: i.pdfUrl })) } : null;
  const options = nextProjectStages(project.stage);
  const steps = Object.entries(projectStages).filter(([value]) => value !== "CANCELLED");
  const current = steps.findIndex(([value]) => value === project.stage);
  return <><Link className="back-link" href="/projets">← Tous les projets</Link><PageTitle eyebrow="SUIVI DE PRODUCTION" title={project.lead.businessName} description={`Projet créé le ${date(project.createdAt)} · ${project.lead.fullName}`} action={<div className="commercial-row"><Status value={project.stage} project /><Link className="button secondary" href={`/clients/${project.leadId}`}>Relations client et devis</Link></div>} />
    <div className="detail-grid"><div className="detail-stack"><section className="panel"><div className="panel-title"><h2>Le parcours du projet</h2><Link className="text-link" href={`/demandes/${project.leadId}`}>Voir le brief →</Link></div><ol className="progress-list">{steps.map(([value, label], index) => <li className={index < current ? "done" : index === current ? "current" : ""} key={value} aria-current={value === project.stage ? "step" : undefined}><span>{index < current ? "✓" : index + 1}</span>{label}</li>)}</ol>{project.stage === "CANCELLED" && <p className="notice section-gap">Ce projet est annulé.</p>}</section>
      <section className="panel"><h2>Les liens du projet</h2><DetailFields rows={[["Prévisualisation", <SafeUrl key="preview" value={project.previewUrl} />], ["Site définitif", <SafeUrl key="website" value={project.websiteUrl} />]]} /><MutationForm id={project.id} operation="links"><input type="hidden" name="expectedUpdatedAt" value={project.updatedAt.toISOString()} /><label htmlFor="previewUrl">URL de prévisualisation HTTPS · facultatif</label><input type="url" id="previewUrl" name="previewUrl" defaultValue={project.previewUrl || ""} maxLength={1000} placeholder="https://votre-projet.vercel.app" /><label htmlFor="websiteUrl">URL du site définitif HTTPS · facultatif</label><input type="url" id="websiteUrl" name="websiteUrl" defaultValue={project.websiteUrl || ""} maxLength={1000} placeholder="https://site-du-client.fr" /></MutationForm><p className="info-line">Ces liens sont renseignés manuellement. Aucun déploiement n’est déclenché.</p></section>
      <SiteBillingCard projectId={id} previewUrl={project.previewUrl || ""} order={billingView} />
      <Notes id={project.id} kind="project" notes={project.notes} /></div><div className="detail-stack"><section className="panel"><h2>Faire avancer le projet</h2>{options.length ? <MutationForm key={project.stage} id={project.id} operation="project-stage" button="Valider cette étape"><input type="hidden" name="expected" value={project.stage} /><label htmlFor="stage">Prochaine étape</label><select id="stage" name="stage">{options.map((stage) => <option key={stage} value={stage}>{projectStages[stage]}</option>)}</select></MutationForm> : <p className="info-line">Ce projet a atteint son statut final.</p>}<p className="info-line">Le suivi est manuel. Les étapes d’envoi, d’accord et de paiement doivent correspondre à une action ou une vérification effectivement réalisée.</p></section>
      <section className="panel"><h2>Contact et référence</h2><DetailFields rows={[["Entreprise", project.lead.businessName], ["Contact", project.lead.fullName], ["E-mail", project.lead.email], ["Téléphone", project.lead.phone], ["Projet", <span key="id" className="reference">{project.id}</span>], ["Demande", <Link key="lead" className="text-link" href={`/demandes/${project.leadId}`}>{project.leadId}</Link>]]} /></section><History items={project.activityLogs} /></div></div></>;
}
