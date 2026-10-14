import { requireAdmin } from "../../../lib/access";
import Link from "next/link";
import { headers } from "next/headers";
import { commercialService } from "../../../lib/commercial";
import { money, quoteStatuses } from "../../../lib/commercial-shared";
import { PageTitle, date } from "../../../components/ui";
export default async function Quotes() {
  await requireAdmin();
  const rows = await commercialService.quotes(await headers());
  return <><PageTitle eyebrow="PRESTATIONS COMPLÉMENTAIRES" title="Vos devis" description="Préparez, envoyez et suivez les prestations qui complètent les projets clients." action={<Link className="button" href="/clients">Choisir un client</Link>} /><section className="panel">{rows.length ? <div className="table-scroll"><table><thead><tr><th>Devis</th><th>Client</th><th>Montant TTC</th><th>Statut</th><th>Date</th><th /></tr></thead><tbody>{rows.map((quote) => <tr key={quote.id}><td><strong>{quote.number}</strong><small>{quote.title}</small></td><td>{quote.lead.businessName}</td><td>{money(quote.totalCents)}</td><td>{quoteStatuses[quote.status]}{quote.paymentMode && quote.paymentMode !== "LIVE" && <small>Paiement de test</small>}</td><td>{date(quote.createdAt)}</td><td><Link className="text-link" href={`/devis/${quote.id}`}>Ouvrir →</Link></td></tr>)}</tbody></table></div> : <p className="empty">Aucun devis complémentaire. Créez-en un depuis une fiche client ou un projet.</p>}<p className="info-line">Les 100 devis les plus récents sont affichés.</p></section></>;
}
