"use client";
import { useCallback, useEffect, useState } from "react";
import { tadapoMoney, tadapoStages, type TadapoOffer } from "@nova/shared/tadapo";
import type { TadapoDomainQuote } from "@nova/shared/tadapo-domain";
type View = { id: string; stage: string; paid: boolean; offer: TadapoOffer; previewUrl?: string; websiteUrl?: string;
  reviewVersion: number; approved: boolean; subscriptionStatus: string | null; billingAlert: boolean;
  commitmentEndAt: string | null; cancelRequestedAt: string | null; cancelEffectiveAt: string | null; nextBillingAt: string | null;
  domainQuote: TadapoDomainQuote | null; domainVersion: number; domainAccepted: boolean; domainPaid: boolean; domainReady: boolean;
  invoices: { id: string; status: string; amountCents: number; hostedUrl: string | null; pdfUrl: string | null }[] };
const date = (value: string | null) => value ? new Date(value).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "En attente";
export function OrderFollowup({ id }: { id: string }) {
  const [view, setView] = useState<View | null>(null), [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const [name, setName] = useState(""), [message, setMessage] = useState(""), [domainAgreement, setDomainAgreement] = useState(false), [cancelConfirm, setCancelConfirm] = useState(false);
  const auth = useCallback(() => ({ Authorization: `Bearer ${new URLSearchParams(window.location.hash.slice(1)).get("token") || ""}` }), []);
  const load = useCallback(async () => {
    const r = await fetch(`/api/orders/${id}`, { headers: auth(), cache: "no-store" }); const data = await r.json();
    if (!r.ok) throw new Error(data.error); setView(data);
  }, [id, auth]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/orders/${id}`, { headers: auth(), cache: "no-store", signal: controller.signal })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error); return data; })
      .then(data => setView(data)).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [id, auth]);
  // The Stripe webhook can arrive after the customer. Poll only while payment is pending.
  useEffect(() => {
    if (!view || view.paid) return;
    let attempts = 0; const timer = window.setInterval(() => { if (++attempts >= 10) window.clearInterval(timer); void load().catch(() => {}); }, 3000);
    return () => window.clearInterval(timer);
  }, [view?.paid, !!view, load]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true); setError(""); setNotice("");
    try {
      const r = await fetch(`/api/orders/${id}`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const result = await r.json(); if (!r.ok) throw new Error(result.error);
      if (result.url) { window.location.assign(result.url); return; }
      await load(); setNotice("Votre demande a été enregistrée.");
    } catch (e) { setError(e instanceof Error ? e.message : "Action impossible."); } finally { setBusy(false); }
  }
  if (!view) return <section className="order-panel"><h1>Votre suivi Tadapo</h1><p role={error ? "alert" : "status"}>{error || "Chargement de votre dossier…"}</p></section>;
  const q = view.domainQuote;
  return <div className="t-followup"><section className="order-panel"><p className="t-eyebrow">VOTRE LIEN PERSONNEL</p><h1>Votre projet Tadapo.</h1><h2>{view.offer.name} · {tadapoMoney(view.offer.ttcCents, 2)} € TTC/mois</h2>{!view.paid ? <><p role="status">Votre paiement attend la confirmation de Stripe. La commande sera confirmée ici et par e-mail après réception du paiement.</p><button className="t-button" disabled={busy} onClick={() => { setError(""); void load().catch(e => setError(e.message)); }}>Actualiser</button></> : <><p>Premier mois réglé · {tadapoStages[view.stage as keyof typeof tadapoStages] || view.stage}</p><p>Les échanges et l’envoi de vos textes, photos et logo se font par réponse à nos e-mails.</p>{view.websiteUrl && view.stage === "PUBLISHED" && <a className="t-button" href={view.websiteUrl} target="_blank" rel="noreferrer">Voir mon site</a>}</>}</section>
    {view.paid && <>
      {view.previewUrl && ["PREVIEW_SENT", "REVIEW", "APPROVED", "PUBLISHED"].includes(view.stage) && <section className="order-panel"><h2>Votre version à découvrir</h2><a className="t-button" href={view.previewUrl} target="_blank" rel="noreferrer">Découvrir la version {view.reviewVersion}</a>{view.approved ? <p>Vous avez validé cette version.</p> : <form onSubmit={e => { e.preventDefault(); void act("approve", { version: view.reviewVersion, requestId: crypto.randomUUID(), name }); }}><label>Votre nom<input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={200} /></label><p>En validant, vous confirmez votre accord pour publier cette version après raccordement du domaine.</p><button className="t-button" disabled={busy}>Valider cette version</button></form>}{view.stage !== "PUBLISHED" && <form onSubmit={e => { e.preventDefault(); void act("feedback", { version: view.reviewVersion, requestId: crypto.randomUUID(), name, message }); }}><label>Votre nom<input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={200} /></label><label>Vos retours regroupés<textarea value={message} onChange={e => setMessage(e.target.value)} required minLength={2} maxLength={10000} /></label><button className="t-button t-button-outline" disabled={busy}>Envoyer mes retours</button></form>}</section>}
      {q && <section className="order-panel"><h2>Votre domaine : {q.domain}</h2><p>{q.kind === "existing" ? "Votre domaine reste chez votre fournisseur, qui continue à vous facturer son renouvellement." : `Prix réel : ${tadapoMoney(q.initialHtCents, 2)} € HT pour la première année, puis ${tadapoMoney(q.renewalHtCents, 2)} € HT/an au tarif vérifié.`}</p><p>Votre supplément initial : {tadapoMoney(q.initialExtraHtCents, 2)} € HT ({tadapoMoney(Math.round(q.initialExtraHtCents * 1.2), 2)} € TTC).</p><p>Supplément annuel au renouvellement : {tadapoMoney(q.renewalExtraHtCents, 2)} € HT, après information et accord sur le tarif réel. Aucun prélèvement automatique supplémentaire.</p>{view.domainAccepted ? <p>Domaine et tarifs approuvés.</p> : <><label><input type="checkbox" checked={domainAgreement} onChange={e => setDomainAgreement(e.target.checked)} /> {q.agreement}</label><button className="t-button" disabled={busy || !domainAgreement} onClick={() => void act("domain-accept", { version: view.domainVersion, agreement: true })}>Approuver ce domaine et ses tarifs</button></>}{view.domainAccepted && q.initialExtraHtCents > 0 && !view.domainPaid && <button className="t-button" disabled={busy} onClick={() => void act("domain-pay", { version: view.domainVersion, agreement: true })}>Payer le supplément du domaine</button>}{view.domainPaid && <p>Supplément réglé.</p>}{view.domainReady && <p>Raccordement confirmé.</p>}</section>}
      <section className="order-panel"><h2>Factures et abonnement</h2><p>Prochaine échéance : {date(view.nextBillingAt)}.</p>{view.commitmentEndAt && <p>Engagement initial jusqu’au {date(view.commitmentEndAt)}.</p>}{view.billingAlert && <p role="alert">Un paiement doit être régularisé. Consultez la facture et vérifiez votre moyen de paiement.</p>}<button className="t-button t-button-outline" disabled={busy} onClick={() => void act("payment-method")}>Gérer mon moyen de paiement</button>{view.invoices.map(i => <p key={i.id}>{tadapoMoney(i.amountCents, 2)} € TTC · {({ paid: "Payée", open: "À régler", draft: "En préparation", void: "Annulée", uncollectible: "À vérifier" } as Record<string, string>)[i.status] || "À vérifier"} {i.hostedUrl && <a href={i.hostedUrl} target="_blank" rel="noreferrer">Consulter / régler la facture</a>} {i.pdfUrl && <a href={i.pdfUrl} target="_blank" rel="noreferrer">PDF</a>}</p>)}{view.cancelRequestedAt ? <p role="status">Résiliation enregistrée. Fin prévue le {date(view.cancelEffectiveAt)}.</p> : view.subscriptionStatus !== "canceled" && <details><summary>Résilier mon abonnement</summary><p>La demande prendra effet à la fin de l’engagement initial de 12 mois, s’il est encore en cours, ou à la fin de la période mensuelle en cours.</p><label><input type="checkbox" checked={cancelConfirm} onChange={e => setCancelConfirm(e.target.checked)} /> Je confirme ma demande de résiliation.</label><button className="t-button t-button-outline" disabled={busy || !cancelConfirm} onClick={() => void act("cancel")}>Confirmer ma résiliation</button></details>}</section>
    </>}{error && <p className="order-info" role="alert">{error}</p>}{notice && <p className="order-info" role="status">{notice}</p>}
  </div>;
}
