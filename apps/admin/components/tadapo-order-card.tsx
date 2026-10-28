import { workspaceDb } from "../lib/brand-context";
import { headers } from "next/headers";
import { tadapoMoney, type TadapoOffer } from "@nova/shared/tadapo";
import { tadapoClientLink } from "@nova/shared/tadapo-server";
import { TadapoWorkflow } from "./tadapo-workflow";
import { TadapoFiles } from "./tadapo-files";
import { TadapoPaymentPanels } from "./tadapo-payment-panels";
import { date, SafeUrl } from "./ui";
const briefLabels: Record<string, string> = { plan: "Formule", term: "Engagement", company: "Entreprise", activity: "Activité", area: "Zone d’intervention", fullName: "Contact", email: "E-mail", phone: "Téléphone", objectives: "Objectifs", services: "Prestations", audience: "Clientèle", pages: "Pages souhaitées", existingWebsite: "Site actuel", style: "Ambiance", colors: "Couleurs", inspirations: "Inspirations", logo: "Logo", content: "Contenus disponibles", domainMode: "Situation du domaine", domain: "Domaine" };
const briefValue = (key: string, value: string) => key === "term" ? value === "12" ? "12 mois" : "Sans engagement de durée" : key === "domainMode" ? ({ existing: "Domaine existant", new: "Nouveau domaine", help: "Conseil souhaité" } as Record<string, string>)[value] || value : value || "—";
export async function TadapoOrderCard({ projectId }: { projectId: string }) {
  const o = await workspaceDb(await headers()).tadapoOrder.findUnique({ where: { projectId }, include: { invoices: { orderBy: { createdAt: "desc" }, take: 50 }, feedback: { orderBy: { createdAt: "desc" }, take: 100 }, files: { select: { id: true, filename: true, sizeBytes: true } }, emails: { select: { id: true, kind: true, status: true, deliveryStatus: true, createdAt: true, lastError: true }, orderBy: { createdAt: "desc" }, take: 30 } } });
  if (!o) return null;
  const offer = o.offerSnapshot as unknown as TadapoOffer;
  const consent = o.consentSnapshot as { acceptedAt?: string; agreement?: string; earlyStart?: boolean };
  return <>
    <section className="panel"><p className="eyebrow">TADAPO · {o.mode}</p><h2>{offer.name} · {tadapoMoney(offer.htCents)} € HT/mois</h2><p>{offer.minimumMonths ? "Engagement initial 12 mois" : "Sans engagement de durée"} · {offer.pages} page(s) · {offer.modifications} modification(s)/mois</p><p>Premier mois payé le {date(o.paidAt)}. Abonnement : {o.subscriptionStatus || "en attente"}.</p><p>Prochaine échéance : {date(o.nextBillingAt)}. Fin d’engagement : {date(o.commitmentEndAt)}.</p>{o.cancelRequestedAt && <p className="notice">Résiliation demandée le {date(o.cancelRequestedAt)} · fin prévue le {date(o.cancelEffectiveAt)}.</p>}{o.billingAlert && <p className="notice error">Paiement à régulariser. Vérifiez Stripe avant de décider d’une suspension manuelle.</p>}
      <p><a className="text-link" href={tadapoClientLink(o)} target="_blank" rel="noreferrer">Ouvrir le lien personnel du client →</a></p>
      <details><summary>Questionnaire complet et accord conservé</summary><dl className="details">{Object.entries(o.brief as Record<string, string>).map(([key, value]) => <div key={key}><dt>{briefLabels[key] || key}</dt><dd>{briefValue(key, value)}</dd></div>)}</dl><p>{consent.agreement}</p><p>Acceptation : {consent.acceptedAt} · Démarrage anticipé : {consent.earlyStart ? "demandé" : "non demandé"}.</p><p>Offre {offer.version} · Conditions {offer.termsVersion}</p></details>
      <h3>Factures</h3>{o.invoices.length ? o.invoices.map(i => <p key={i.id}>{tadapoMoney(i.amountCents, 2)} € TTC · {i.status} · <SafeUrl value={i.hostedUrl} /></p>) : <p>En attente de synchronisation Stripe.</p>}
    </section>
    <TadapoPaymentPanels order={o} />
    <TadapoWorkflow id={o.id} />
    <section className="panel"><h2>Documents reçus par e-mail</h2><TadapoFiles id={o.id} />{o.files.map(f => <p key={f.id}><a className="text-link" href={`/api/admin/tadapo/files/${f.id}`}>{f.filename}</a> · {Math.round(f.sizeBytes / 1024)} Ko</p>)}</section>
  </>;
}
