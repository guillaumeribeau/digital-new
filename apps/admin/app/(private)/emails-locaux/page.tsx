import { requireAdmin } from "../../../lib/access";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { commercialLocal, emailSchema, unseal } from "../../../lib/commercial-core";
import { commercialService } from "../../../lib/commercial";
import { PageTitle } from "../../../components/ui";
export default async function LocalCommercialEmails() {
  await requireAdmin();
  if (!commercialLocal()) notFound(); const rows = await commercialService.localEmails(await headers());
  return <><PageTitle eyebrow="MODE LOCAL" title="E-mails de test commerciaux" description="Les messages et les devis préparés en local. Aucun e-mail réel n’est envoyé." action={<Link className="button secondary" href="/emails-locaux">Actualiser</Link>} />
    {rows.length ? rows.map((row) => {
      const payload = emailSchema.parse(unseal(row.payloadEncrypted!)), candidate = payload.text.match(/https?:\/\/[^\s]+\/client\/devis\/[a-f0-9-]+#token=[A-Za-z0-9_-]+/)?.[0];
      return <article className="panel section-gap" key={row.id}><h2>{payload.subject}</h2><p className="info-line">À : {payload.to.join(", ")} · Réponse : {payload.reply_to}</p>{candidate && <p><a className="button section-gap" target="_blank" rel="noopener noreferrer" href={candidate}>Ouvrir le devis côté client</a></p>}<pre className="email-preview">{payload.text}</pre>{row.quoteId && payload.attachments && <a className="text-link" href={`/api/admin/quotes/${row.quoteId}/pdf`}>Télécharger le PDF joint</a>}</article>;
    }) : <section className="panel empty">Aucun e-mail commercial en attente. Envoyez un message ou un devis depuis une fiche client.</section>}</>;
}
