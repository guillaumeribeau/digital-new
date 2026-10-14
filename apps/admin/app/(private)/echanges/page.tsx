import { requireAdmin } from "../../../lib/access";
import Link from "next/link";
import { headers } from "next/headers";
import { commercialService } from "../../../lib/commercial";
import { PageTitle, date } from "../../../components/ui";
export default async function Inbox({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  await requireAdmin();
  const query = await searchParams, pending = query.filtre !== "tous", rows = await commercialService.inbox(await headers(), pending);
  return <><PageTitle eyebrow="RELATION CLIENT" title="Vos échanges" description="Retrouvez les conversations et les clients qui attendent votre réponse." />
    <nav className="commercial-tabs"><Link href="/echanges">À vous de répondre</Link><Link href="/echanges?filtre=tous">Tous les échanges</Link><Link href="/parametres/commercial">Modèles de messages</Link></nav>
    <section className="panel section-gap">{rows.length ? <div className="table-scroll"><table><thead><tr><th>Client</th><th>Dernier message</th><th>Date</th><th /></tr></thead><tbody>{rows.map((conversation) => <tr key={conversation.id}><td><strong>{conversation.lead.businessName}</strong><small>{conversation.lead.fullName}</small></td><td>{conversation.messages[0]?.subject || "—"}<small>{conversation.needsReply ? "À vous de répondre" : "Réponse envoyée ou en attente d’envoi"}</small></td><td>{date(conversation.updatedAt)}</td><td><Link className="text-link" href={`/clients/${conversation.leadId}#echanges`}>Répondre →</Link></td></tr>)}</tbody></table></div> : <p className="empty">{pending ? "Aucun client n’attend de réponse." : "Aucun échange enregistré."}</p>}<p className="info-line">Les 100 conversations les plus récentes sont affichées.</p></section></>;
}
