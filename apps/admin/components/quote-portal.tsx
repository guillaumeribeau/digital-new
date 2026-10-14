"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { QuoteSnapshot } from "../lib/commercial-core";
import { money } from "../lib/commercial-shared";

type PortalQuote = { status: string; snapshot: QuoteSnapshot; documentHash: string; paymentMode: string; paymentStatus?: string; acceptedName?: string; paidAt?: string };
export function QuotePortal({ id }: { id: string }) {
  const token = useRef("");
  const [quote, setQuote] = useState<PortalQuote>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/client/quotes/${id}`, { cache: "no-store" });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    setQuote(data);
  }, [id]);
  useEffect(() => {
    token.current ||= new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    void (async () => {
      try {
        if (token.current) {
          const response = await fetch("/api/client/quotes/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, token: token.current }) });
          const data = await response.json(); if (!response.ok) throw new Error(data.error);
        }
        await load();
      } catch (error) { setError(error instanceof Error ? error.message : "Le devis est indisponible."); }
    })();
  }, [id, load]);
  const awaitingPayment = quote?.status === "ACCEPTED" && !["FAILED", "EXPIRED"].includes(quote.paymentStatus || "") && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("retour") === "paiement";
  useEffect(() => {
    if (!awaitingPayment) return;
    const interval = window.setInterval(() => void load().catch(() => {}), 3000);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 60000);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [awaitingPayment, load]);
  async function perform(action: string, values: Record<string, unknown> = {}) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/client/quotes/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...values }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (data.url) window.location.assign(data.url); else await load();
    } catch (error) { setError(error instanceof Error ? error.message : "L’opération est indisponible."); }
    finally { setBusy(false); }
  }
  const snapshot = quote?.snapshot;
  return <main id="main" className="quote-portal"><header><div className="brand-logo">N<span>O</span>VA</div><span className="eyebrow">VOTRE DEVIS COMPLÉMENTAIRE</span></header>
    {error && <p className="notice error" role="alert">{error}</p>}
    {!snapshot ? !error && <p>Chargement de votre devis…</p> : <>
      <section className="panel"><p className="eyebrow">{snapshot.number}</p><h1>{snapshot.title}</h1><p>{snapshot.seller.legalName} · Pour {snapshot.buyer.company}</p>
        <p className="info-line">Valable jusqu’au {new Date(snapshot.validUntil).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} · {snapshot.deliveryTime}</p>
        <div className="table-scroll"><table><thead><tr><th>Prestation</th><th>Quantité</th><th>Prix HT</th><th>TVA</th><th>Total TTC</th></tr></thead><tbody>{snapshot.items.map((item, index) => <tr key={index}><td><strong>{item.label}</strong><small>{item.description}</small></td><td>{item.quantity}</td><td>{money(item.unitCents)}</td><td>{item.taxBasisPoints / 100} %</td><td>{money(item.totalCents)}</td></tr>)}</tbody></table></div>
        <p className="quote-total">Total TTC <strong>{money(snapshot.totalCents)}</strong></p><p className="info-line">Total HT : {money(snapshot.subtotalCents)} · TVA : {money(snapshot.taxCents)}</p>
        <a className="button secondary" href={`/api/client/quotes/${id}/pdf`} target="_blank" rel="noopener noreferrer">Télécharger le devis PDF</a>
      </section>
      <section className="panel"><h2>Conditions de la prestation</h2><p style={{ whiteSpace: "pre-wrap" }}>{snapshot.terms}</p>{snapshot.seller.taxNote && <p>{snapshot.seller.taxNote}</p>}</section>
      {quote!.status === "SENT" && <section className="panel"><h2>Accepter votre devis</h2><form className="mutation-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void perform("accept", { name: data.get("name"), agreement: data.get("agreement") === "on", documentHash: quote!.documentHash }); }}>
        <label htmlFor="accept-name">Votre nom complet</label><input id="accept-name" name="name" defaultValue={snapshot.buyer.name} minLength={2} maxLength={200} required />
        <label className="check-label"><input type="checkbox" name="agreement" required /><span>J’accepte ce devis, ses prestations, son montant et ses conditions.</span></label><button className="button" disabled={busy}>Accepter le devis</button>
      </form><details className="section-gap"><summary>Demander une modification</summary><form className="mutation-form" onSubmit={(event) => { event.preventDefault(); void perform("decline", { reason: new FormData(event.currentTarget).get("reason") }); }}><label htmlFor="reason">Votre demande</label><textarea id="reason" name="reason" required minLength={2} maxLength={2000} /><button className="button secondary" disabled={busy}>Envoyer ma demande de modification</button></form></details></section>}
      {quote!.status === "ACCEPTED" && <section className="panel"><h2>Votre devis est accepté</h2><p>{awaitingPayment ? "Votre règlement est en cours de confirmation. Le statut se met à jour automatiquement." : "Vous pouvez maintenant régler la prestation complémentaire."}</p>
        {quote!.paymentMode === "LOCAL" ? <><p className="notice section-gap">Test local : aucun débit bancaire ne sera effectué.</p><button className="button section-gap" disabled={busy} onClick={() => void perform("simulate")}>Simuler le paiement — test local</button></> : <>
          {quote!.paymentMode === "TEST" && <p className="notice">Paiement Stripe en mode test : aucun débit réel.</p>}
          {!awaitingPayment && <button className="button section-gap" disabled={busy || quote!.paymentMode === "UNCONFIGURED"} onClick={() => void perform("pay")}>Payer {money(snapshot.totalCents)} avec Stripe</button>}
          {quote!.paymentMode === "UNCONFIGURED" && <p>Le paiement en ligne sera disponible après configuration. Contactez votre interlocuteur.</p>}
        </>}
        <button className="text-link section-gap" onClick={() => void load().catch(() => setError("Actualisation indisponible."))}>Actualiser le statut du paiement</button>
      </section>}
      {["PAID", "COMPLETED"].includes(quote!.status) && <section className="panel"><h2>{quote!.paymentMode === "LOCAL" ? "Paiement simulé en local" : quote!.paymentMode === "TEST" ? "Paiement de test confirmé" : "Paiement confirmé"}</h2><p>Votre prestation {quote!.status === "COMPLETED" ? "a été réalisée." : "peut être prise en charge."}</p></section>}
      {quote!.status === "DECLINED" && <p className="notice">Votre demande de modification a été transmise. Nous allons vous répondre.</p>}
      {quote!.status === "EXPIRED" && <p className="notice">Ce devis a expiré. Répondez à l’e-mail pour demander un nouveau devis.</p>}
      <footer>{snapshot.seller.legalName} · {snapshot.seller.address} · {snapshot.seller.registrationNumber}</footer>
    </>}
  </main>;
}
