import { requireAdmin } from "../../../lib/access";
import Link from "next/link";
import { headers } from "next/headers";
import { commercialService } from "../../../lib/commercial";
import { money } from "../../../lib/commercial-shared";
import { PageTitle, date } from "../../../components/ui";
export default async function Payments() {
  await requireAdmin();
  const rows = await commercialService.payments(await headers());
  return <><PageTitle eyebrow="PRESTATIONS COMPLÉMENTAIRES" title="Vos paiements" description="Les règlements des devis complémentaires et les tentatives de paiement." /><section className="panel">{rows.length ? <div className="table-scroll"><table><thead><tr><th>Client et devis</th><th>Montant</th><th>Statut</th><th>Mode</th><th>Date</th></tr></thead><tbody>{rows.map((payment) => <tr key={payment.id}><td><strong>{payment.quote.lead.businessName}</strong><Link className="text-link" href={`/devis/${payment.quoteId}`}>{payment.quote.number}</Link></td><td>{money(payment.amountCents)}</td><td>{payment.status === "SUCCEEDED" ? "Confirmé" : payment.status === "FAILED" ? "Échoué" : payment.status === "EXPIRED" ? "Expiré" : "En attente"}</td><td>{payment.mode === "LIVE" ? "Réel" : payment.mode === "TEST" ? "Stripe test" : "Simulation locale"}</td><td>{date(payment.createdAt)}</td></tr>)}</tbody></table></div> : <p className="empty">Aucun paiement complémentaire enregistré.</p>}<p className="info-line">Les 100 tentatives les plus récentes sont affichées. Les paiements de test sont identifiés séparément.</p></section></>;
}
