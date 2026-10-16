import { requireAdmin } from "../../../lib/access";
import Link from "next/link";
import { getDb } from "@nova/database";
import { headers } from "next/headers";
import { commercialService } from "../../../lib/commercial";
import { money } from "../../../lib/commercial-shared";
import { PageTitle, date } from "../../../components/ui";
export default async function Payments() {
  await requireAdmin();
  const rows = await commercialService.payments(await headers());
  const sites = await getDb().siteOrder.findMany({ orderBy: { updatedAt: "desc" }, take: 100, include: { project: { include: { lead: true } } } });
  return <><PageTitle eyebrow="CRÉATIONS, ABONNEMENTS ET DEVIS" title="Vos paiements" description="Suivez les créations, les abonnements et les règlements complémentaires." /><section className="panel"><h2>Créations et abonnements</h2>{sites.length ? sites.map(s => <article className="note" key={s.id}><strong>{s.project.lead.businessName}</strong><p>{s.mode === "LIVE" ? "Réel" : "Test"} · Création : {s.creationPaidAt ? "payée" : "à payer"} · Abonnement : {s.subscriptionStatus || "non démarré"}{s.cancelAtPeriodEnd ? " · résiliation programmée" : ""}</p>{s.billingAlert && <p className="notice error">Paiement ou abonnement à vérifier. Aucune suspension automatique.</p>}<Link className="text-link" href={`/projets/${s.projectId}#stripe`}>Ouvrir le suivi et les factures →</Link></article>) : <p className="info-line">Aucune présentation de site préparée.</p>}</section><section className="panel"><h2>Devis complémentaires</h2>{rows.length ? <div className="table-scroll"><table><thead><tr><th>Client et devis</th><th>Montant</th><th>Statut</th><th>Mode</th><th>Date</th></tr></thead><tbody>{rows.map((payment) => <tr key={payment.id}><td><strong>{payment.quote.lead.businessName}</strong><Link className="text-link" href={`/devis/${payment.quoteId}`}>{payment.quote.number}</Link></td><td>{money(payment.amountCents)}</td><td>{payment.status === "SUCCEEDED" ? "Confirmé" : payment.status === "FAILED" ? "Échoué" : payment.status === "EXPIRED" ? "Expiré" : "En attente"}</td><td>{payment.mode === "LIVE" ? "Réel" : payment.mode === "TEST" ? "Stripe test" : "Simulation locale"}</td><td>{date(payment.createdAt)}</td></tr>)}</tbody></table></div> : <p className="empty">Aucun paiement complémentaire enregistré.</p>}<p className="info-line">Les 100 tentatives les plus récentes sont affichées. Les paiements de test sont identifiés séparément.</p></section></>;
}
