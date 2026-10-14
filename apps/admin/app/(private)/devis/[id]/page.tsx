import { requireAdmin } from "../../../../lib/access";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { commercialService } from "../../../../lib/commercial";
import { snapshotSchema } from "../../../../lib/commercial-core";
import { deliveryStatuses, money, quoteStatuses } from "../../../../lib/commercial-shared";
import { PageTitle, DetailFields, date } from "../../../../components/ui";
import { CommercialForm } from "../../../../components/commercial-form";
export default async function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params; if (!z.uuid().safeParse(id).success) notFound();
  const h = await headers(), quote = await commercialService.quote(h, id); if (!quote) notFound();
  const settings = await commercialService.settings(h), items = snapshotSchema.shape.items.parse(quote.items);
  const issuerReady = !!(settings?.legalName && settings?.address && settings?.registrationNumber);
  return <><Link className="back-link" href={`/clients/${quote.leadId}`}>← {quote.lead.businessName}</Link><PageTitle eyebrow={quote.number} title={quote.title} description={`${quote.lead.fullName} · ${quoteStatuses[quote.status]}`} action={quote.status === "DRAFT" ? <Link className="button secondary" href={`/devis/nouveau?client=${quote.leadId}&modifier=${id}`}>Modifier le brouillon</Link> : !["ACCEPTED", "PAID", "COMPLETED"].includes(quote.status) ? <Link className="button secondary" href={`/devis/nouveau?client=${quote.leadId}&revision=${id}`}>Créer une nouvelle version</Link> : undefined} />
    <div className="detail-grid"><div className="detail-stack"><section className="panel"><h2>Les prestations</h2><div className="table-scroll"><table><thead><tr><th>Prestation</th><th>Quantité</th><th>Prix HT</th><th>TVA</th><th>Total TTC</th></tr></thead><tbody>{items.map((item, i) => <tr key={i}><td><strong>{item.label}</strong><small>{item.description}</small></td><td>{item.quantity}</td><td>{money(item.unitCents)}</td><td>{item.taxBasisPoints / 100} %</td><td>{money(item.totalCents)}</td></tr>)}</tbody></table></div><p className="quote-total">Total TTC <strong>{money(quote.totalCents)}</strong></p><p className="info-line">HT : {money(quote.subtotalCents)} · TVA : {money(quote.taxCents)}</p>
      {(quote.snapshot || issuerReady) ? <a className="button secondary" target="_blank" rel="noopener noreferrer" href={`/api/admin/quotes/${id}/pdf`}>Voir le devis PDF</a> : <p className="notice">Renseignez votre entreprise dans <Link href="/parametres/commercial">les paramètres commerciaux</Link> pour générer le PDF et envoyer ce devis.</p>}
      </section><section className="panel"><h2>Facturation et conditions</h2><DetailFields rows={[["Nom de facturation", quote.billingName], ["Adresse", quote.billingAddress], ["Immatriculation", quote.billingRegistrationNumber], ["N° TVA", quote.billingVatNumber], ["Délai", quote.deliveryTime], ["Validité", date(quote.validUntil)], ["Conditions", quote.terms]]} /></section>
      <section className="panel"><h2>Paiements</h2>{quote.payments.length ? quote.payments.map((payment) => <article className="note" key={payment.id}><strong>{money(payment.amountCents)} · {payment.status === "SUCCEEDED" ? "Confirmé" : payment.status === "FAILED" ? "Échoué" : payment.status === "EXPIRED" ? "Expiré" : "En attente"}</strong><p>{payment.mode === "LIVE" ? "Paiement réel" : payment.mode === "TEST" ? "Stripe en mode test" : "Simulation locale — aucun débit bancaire"}</p><small>{date(payment.createdAt)}</small></article>) : <p className="info-line">Aucun paiement enregistré.</p>}</section></div>
      <div className="detail-stack"><section className="panel"><h2>Suivi du devis</h2><DetailFields rows={[["Numéro", quote.number], ["Statut", quoteStatuses[quote.status]], ["Accepté par", quote.acceptedName], ["Acceptation", quote.acceptedAt ? date(quote.acceptedAt) : null], ["Paiement", quote.paidAt ? date(quote.paidAt) : null]]} />
        {quote.paymentMode && quote.paymentMode !== "LIVE" && <p className="notice section-gap">Ce paiement est un test et ne correspond pas à un encaissement réel.</p>}
        {quote.status === "DRAFT" && issuerReady && <CommercialForm operation="send-quote" id={id} button="Envoyer le devis au client"><p className="info-line">Le client recevra le PDF et le lien privé pour accepter et payer. Le devis sera figé après l’envoi.</p></CommercialForm>}
        {["SENT", "ACCEPTED"].includes(quote.status) && <CommercialForm operation="remind" id={id} button="Relancer le client" />}
        {["DRAFT", "SENT", "DECLINED", "EXPIRED"].includes(quote.status) && <CommercialForm operation="cancel" id={id} button="Annuler ce devis" />}
        {quote.status === "PAID" && <CommercialForm operation="complete" id={id} button="Marquer la prestation réalisée" />}
      </section><section className="panel"><h2>Envois d’e-mails</h2>{quote.emails.length ? quote.emails.map((email) => <article className="note" key={email.id}><strong>{email.kind === "REMINDER" ? "Relance" : "Devis"} · {deliveryStatuses[email.status] || email.status}</strong><small>{date(email.createdAt)}</small>{email.lastError && <p className="notice error">L’envoi n’a pas abouti. Vérifiez les paramètres du service d’e-mails.</p>}</article>) : <p className="info-line">Aucun e-mail préparé.</p>}</section></div></div></>;
}
