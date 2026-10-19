import { requireAdmin } from "../../../../lib/access";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { commercialService } from "../../../../lib/commercial";
import { commercialLocal } from "../../../../lib/commercial-core";
import { money, quoteStatuses, deliveryStatuses } from "../../../../lib/commercial-shared";
import { PageTitle, date } from "../../../../components/ui";
import { MessageComposer } from "../../../../components/message-composer";
import { CommercialForm } from "../../../../components/commercial-form";
export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params; if (!z.uuid().safeParse(id).success) notFound();
  const h = await headers(), client = await commercialService.client(h, id); if (!client) notFound();
  const templates = await commercialService.templates(h);
  return <><Link className="back-link" href="/clients">← Tous les clients</Link><PageTitle eyebrow="RELATION CLIENT" title={client.businessName} description={`${client.fullName} · ${client.email}`} action={<Link className="button" href={`/devis/nouveau?client=${id}`}>Nouveau devis complémentaire</Link>} />
    <nav className="commercial-tabs" aria-label="Fiche client"><a href="#echanges">Échanges</a><a href="#devis">Devis</a><a href="#paiements">Paiements</a><Link href={`/emails?client=${id}`}>Historique des e-mails</Link><Link href={`/demandes/${id}`}>Demande initiale</Link>{client.project && <Link href={`/projets/${client.project.id}`}>Projet</Link>}</nav>
    {!client.emailVerifiedAt && <p className="notice section-gap">Le client doit confirmer son adresse e-mail avant l’envoi de messages ou de devis.</p>}
    <div className="detail-grid section-gap"><section className="panel" id="echanges"><h2>Échanges avec le client</h2>{client.conversation?.needsReply && <p className="notice section-gap">Ce client attend votre réponse.</p>}
      {client.emailVerifiedAt && <MessageComposer leadId={id} requestId={randomUUID()} templates={templates.messages} />}
      <div className="section-gap">{client.conversation?.messages.length ? client.conversation.messages.map((message) => {
        const files = z.array(z.object({ id: z.string(), filename: z.string() })).safeParse(message.attachments);
        return <article className={"client-message " + message.direction.toLowerCase()} key={message.id}><div className="note-meta">{message.direction === "INBOUND" ? "Client" : "Votre équipe"} · {date(message.createdAt)} · {deliveryStatuses[message.deliveryStatus] || message.deliveryStatus}</div><h3>{message.subject}</h3><p>{message.content}</p>{files.success && files.data.map((file) => <p key={file.id}><a className="text-link" href={`/api/admin/messages/${message.id}/attachments/${encodeURIComponent(file.id)}`}>Télécharger : {file.filename}</a></p>)}</article>;
      }) : <p className="info-line">Aucun échange enregistré. Les notes internes du projet restent privées.</p>}</div>
      <p className="info-line">Les 100 messages les plus récents sont affichés.</p>
      {commercialLocal() && <details className="section-gap"><summary>Tester une réponse client en local</summary><p className="info-line">Cette simulation n’envoie aucun e-mail réel.</p><CommercialForm operation="local-reply" button="Simuler une réponse client" reset><input type="hidden" name="leadId" value={id} /><input type="hidden" name="requestId" defaultValue={randomUUID()} /><label htmlFor="local-content">Réponse de test</label><textarea id="local-content" name="content" required minLength={2} maxLength={20000} /></CommercialForm></details>}
    </section><div className="detail-stack"><section className="panel" id="devis"><div className="panel-title"><h2>Devis complémentaires</h2><Link className="text-link" href={`/devis/nouveau?client=${id}`}>Créer →</Link></div>{client.quotes.length ? client.quotes.map((quote) => <article key={quote.id} className="note"><Link className="text-link" href={`/devis/${quote.id}`}>{quote.number} · {quote.title}</Link><p>{money(quote.totalCents)} · {quoteStatuses[quote.status]}{quote.paymentMode && quote.paymentMode !== "LIVE" ? " · paiement de test" : ""}</p><small>{quote.emails[0] ? deliveryStatuses[quote.emails[0].status] || quote.emails[0].status : "Brouillon non envoyé"}</small></article>) : <p className="info-line">Aucun devis complémentaire.</p>}</section>
      <section className="panel" id="paiements"><h2>Paiements complémentaires</h2>{client.quotes.flatMap((quote) => quote.payments.map((payment) => <article className="note" key={payment.id}><strong>{quote.number} · {money(payment.amountCents)}</strong><p>{payment.status === "SUCCEEDED" ? "Confirmé" : payment.status === "FAILED" ? "Échoué" : payment.status === "EXPIRED" ? "Expiré" : "En attente"} · {payment.mode === "LIVE" ? "Réel" : payment.mode === "TEST" ? "Stripe test" : "Simulation locale"}</p><small>{date(payment.createdAt)}</small></article>))}{!client.quotes.some((quote) => quote.payments.length) && <p className="info-line">Aucun paiement complémentaire.</p>}<p className="info-line">Ces paiements sont distincts de la prestation initiale du site.</p></section>
    </div></div></>;
}
