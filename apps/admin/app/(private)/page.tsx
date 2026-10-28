import { workspaceDb } from "../../lib/brand-context";
import { NextActions } from "../../components/next-actions";
import Link from "next/link";
import { headers } from "next/headers";
import { Inbox, FolderKanban, Send, ArrowUpRight, CheckCircle2, Layers3, ListFilter, Globe2 } from "lucide-react";
import { requireAdmin } from "../../lib/access";
import { adminService } from "../../lib/service";
import { PageTitle, Status, Empty, date } from "../../components/ui";
export default async function Dashboard() {
  await requireAdmin();
  const data = await adminService.dashboard(await headers());
  const billingAlerts = await workspaceDb(await headers()).siteOrder.count({ where: { billingAlert: true } });
  const cards = [["Demandes reçues", data.total, Inbox], ["Nouvelles demandes", data.newLeads, Layers3], ["À qualifier", data.toQualify, ListFilter],
    ["Sites en création", data.inCreation, FolderKanban], ["Propositions envoyées", data.proposals, Send], ["Propositions acceptées", data.approved, CheckCircle2],
    ["Projets terminés", data.completed, Globe2], ["E-mails à vérifier", data.pendingVerification, Inbox]] as const;
  return <><PageTitle eyebrow="VUE D’ENSEMBLE" title="Tout commence ici" description="Gardez le fil de vos demandes et accompagnez chaque projet jusqu’à sa mise en ligne." action={<Link className="button" href="/demandes">Voir les demandes<ArrowUpRight size={16} /></Link>} />
    {billingAlerts > 0 && <p className="notice error"><strong>{billingAlerts} dossier(s) Stripe à vérifier.</strong> Un paiement ou un abonnement nécessite votre attention. <Link href="/paiements">Consulter les paiements →</Link></p>}
    <section className="metrics" aria-label="Indicateurs de la plateforme">{cards.map(([label, value, Icon], index) => <div className={`metric ${index === 0 ? "featured" : ""}`} key={label}><span>{label}</span><Icon className="metric-icon" size={18} /><strong>{value}</strong></div>)}</section>
    <div className="quick-actions">{[["/demandes?status=NEW", "Nouvelles demandes", "Les prochains projets commencent ici", Inbox], ["/projets", "Projets en cours", "Retrouvez votre suivi de production", FolderKanban], ["/projets?status=AWAITING_APPROVAL", "Propositions en attente", "Suivez les validations à obtenir", Send]].map(([href, label, desc, Icon]) => { const Symbol = Icon as typeof Inbox; return <Link className="quick-action" key={String(href)} href={String(href)}><Symbol size={20} /><span><strong>{String(label)}</strong><small>{String(desc)}</small></span><ArrowUpRight size={17} /></Link>; })}</div>
    <NextActions />
    <section className="panel"><div className="panel-title"><h2>Dernières demandes</h2><Link className="text-link" href="/demandes">Tout voir<ArrowUpRight size={14} /></Link></div>
      {!data.latest.length ? <Empty title="Votre première demande vous attend" description="Les demandes enregistrées depuis le site vitrine apparaîtront ici automatiquement." /> : <div className="table-scroll"><table><thead><tr><th>Entreprise</th><th>Contact</th><th>Reçue le</th><th>Statut</th><th><span className="sr-only">Ouvrir</span></th></tr></thead><tbody>{data.latest.map((lead) => <tr key={lead.id}><td><div className="company-cell"><span className="company-initial">{lead.businessName.slice(0, 1)}</span><div><strong>{lead.businessName}</strong><small>{lead.businessSector}</small></div></div></td><td>{lead.fullName}</td><td>{date(lead.createdAt)}</td><td><Status value={lead.status} /></td><td><Link href={`/demandes/${lead.id}`} className="text-link">Ouvrir<ArrowUpRight size={14} /></Link></td></tr>)}</tbody></table></div>}
    </section><p className="info-line">Les propositions acceptées incluent les projets validés qui poursuivent leur parcours jusqu’à la mise en ligne.</p></>;
}
