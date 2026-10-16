"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLogo } from "./brand-logo";
import { billingMoney, creationTtc } from "../lib/site-billing-shared";
type SiteData = { version: number; company: string; previewUrl: string; screenshot: string; message: string; mode: string; creationHtCents: number; paid: boolean; agreement: string; subscriptionStatus: string | null; subscriptionInvited: boolean; subscriptionVersion: number; subscriptionWebsiteUrl: string | null; subscriptionAgreement: string; monthlyHtCents: number; firstSubscriptionPaid: boolean; cancelAtPeriodEnd: boolean; invoices: { id: string; amountCents: number; status: string; url: string | null; pdf: string | null }[] };
export function SitePortal({ id }: { id: string }) {
  const token = useRef("");
  const [data, setData] = useState<SiteData>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await fetch(`/api/client/sites/${id}`, { cache: "no-store" }); const body = await r.json();
    if (!r.ok) throw new Error(body.error); setData(body);
  }, [id]);
  useEffect(() => {
    token.current ||= new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    void (async () => {
      try {
        if (token.current) {
          const r = await fetch("/api/client/sites/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, token: token.current }) });
          const body = await r.json(); if (!r.ok) throw new Error(body.error);
        }
        await load();
      } catch (e) { setError(e instanceof Error ? e.message : "Ce lien est indisponible."); }
    })();
  }, [id, load]);
  const awaitingPayment = !!data && (!data.paid || (data.subscriptionInvited && !data.firstSubscriptionPaid));
  useEffect(() => {
    if (!awaitingPayment || !window.location.search.includes("paiement=retour")) return;
    const interval = window.setInterval(() => void load().catch(() => {}), 3000);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 60000);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [awaitingPayment, load]);
  async function perform(action: string, fields: Record<string, unknown> = {}) {
    setBusy(true); setError("");
    try {
      const r = await fetch(`/api/client/sites/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...fields }) });
      const body = await r.json(); if (!r.ok) throw new Error(body.error);
      if (body.url) window.location.assign(body.url);
    } catch (e) { setError(e instanceof Error ? e.message : "Paiement indisponible."); }
    finally { setBusy(false); }
  }
  return <main id="main" className="quote-portal"><header><div className="brand-logo"><BrandLogo /></div><span className="eyebrow">VOTRE PROJET · VOTRE CHOIX</span></header>
    {error && <p role="alert" className="notice error">{error}</p>}
    {data ? <><h1>Découvrez votre futur site.</h1><p>{data.company}</p>{data.mode !== "LIVE" && <p className="notice">MODE TEST — aucun débit réel.</p>}
      <p style={{ whiteSpace: "pre-line" }}>{data.message}</p>
      {/* Private, uploaded screenshot; no remote image request containing the access token. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.screenshot} alt={`Aperçu du site de ${data.company}`} style={{ width: "100%", borderRadius: 14, margin: "20px 0" }} />
      <a className="button secondary" href={data.previewUrl} target="_blank" rel="noreferrer">Découvrir mon site ↗</a>
      {data.paid ? <section className="panel section-gap"><h2>{data.subscriptionStatus === "canceled" ? "Votre abonnement est terminé." : data.firstSubscriptionPaid ? "Votre abonnement est activé." : data.subscriptionInvited ? "Votre site est prêt à être lancé." : "Votre création est payée."}</h2>
        {data.firstSubscriptionPaid ? <>{data.subscriptionStatus !== "canceled" && <p>Votre premier paiement mensuel est confirmé. La mise en ligne sur le domaine définitif est prévue sous 2 jours ouvrés après ce paiement, si le domaine et ses accès sont prêts.</p>}{data.subscriptionStatus === "past_due" && <p className="notice error">Un paiement est à régulariser depuis votre portail client.</p>}{data.cancelAtPeriodEnd && <p className="notice">Votre résiliation est programmée pour la fin de la période payée.</p>}{data.subscriptionStatus === "canceled" && <p className="notice">Votre abonnement est terminé.</p>}</> : data.subscriptionInvited ? <><p>Les ajustements sont validés. Activez votre abonnement pour lancer votre site sur <strong style={{ overflowWrap: "anywhere" }}>{data.subscriptionWebsiteUrl}</strong>.</p><p><strong>{billingMoney(creationTtc(data.monthlyHtCents))} TTC/mois</strong> ({billingMoney(data.monthlyHtCents)} HT, TVA 20 %). Hébergement, un domaine jusqu’à 20 € HT/an et une modification de 15 minutes maximum par mois, non reportable. Au-delà du plafond du domaine : supplément annuel accepté au préalable.</p><p>Premier mois payé immédiatement, puis renouvellement mensuel automatique. Mise en ligne sous 2 jours ouvrés après confirmation du paiement, si le domaine et ses accès sont prêts.</p><p>Résiliation possible à tout moment depuis le portail client, effective à la fin de la période payée. Remise gratuite des fichiers et du code de transfert du domaine, sous réserve des règles du registre.</p>{!data.subscriptionStatus ? <form className="mutation-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void perform("subscribe", { version: data.subscriptionVersion, agreement: f.get("agreement") === "yes" }); }}><label className="check-line"><input type="checkbox" name="agreement" value="yes" required />{data.subscriptionAgreement}</label><a className="text-link" href="https://zelyweb.com/conditions-generales" target="_blank" rel="noreferrer">Lire les conditions de l’offre</a><button className="button" disabled={busy}>{busy ? "Ouverture de Stripe…" : `Activer mon abonnement — ${billingMoney(creationTtc(data.monthlyHtCents))} TTC/mois`}</button></form> : <p className="notice">Activation en cours ou paiement à vérifier. Consultez votre portail de facturation et vos factures ci-dessous.</p>}</> : <p>Nous réalisons les ajustements avec vous. Trois séries de retours regroupés sont incluses dans les 30 jours après paiement. Une fois le site validé, vous recevrez un e-mail pour activer votre abonnement avant sa mise en ligne.</p>}
        <button className="button secondary" disabled={busy} onClick={() => void perform("portal")}>Mes factures, ma carte et mon abonnement</button></section> : <section className="panel section-gap"><h2>Valider votre commande</h2><p><strong>{billingMoney(creationTtc(data.creationHtCents))} TTC</strong> pour la création ({billingMoney(data.creationHtCents)} HT, TVA 20 %).</p><p>Puis 34,80 € TTC/mois (29 € HT), à activer par vos soins depuis un e-mail après validation des ajustements et avant la mise en ligne. Abonnement obligatoire, sans durée minimale. Hébergement, domaine jusqu’à 20 € HT/an et une modification de 15 minutes maximum par mois.</p><form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void perform("pay", { version: data.version, name: f.get("name"), agreement: f.get("agreement") === "yes" }); }} className="mutation-form"><label>Votre nom complet<input name="name" required minLength={2} maxLength={200} autoComplete="name" /></label><label className="check-line"><input type="checkbox" name="agreement" value="yes" required />{data.agreement}</label><a className="text-link" href="https://zelyweb.com/conditions-generales" target="_blank" rel="noreferrer">Lire les conditions générales</a><button className="button" disabled={busy}>{busy ? "Ouverture de Stripe…" : `Valider et payer ${billingMoney(creationTtc(data.creationHtCents))} TTC`}</button></form><p className="info-line">Le paiement est confirmé par Stripe, jamais par le simple retour sur cette page. Si le statut tarde, actualisez dans quelques instants.</p></section>}
      {!!data.invoices.length && <section className="panel section-gap"><h2>Vos factures</h2>{data.invoices.map(i => <p key={i.id}>{billingMoney(i.amountCents)} · {i.status} {i.url && <a className="text-link" href={i.url} target="_blank" rel="noreferrer">Consulter</a>} {i.pdf && <a className="text-link" href={i.pdf} target="_blank" rel="noreferrer">PDF</a>}</p>)}</section>}
      <p className="info-line section-gap">Une question ? <a href="mailto:contact@zelyweb.com">contact@zelyweb.com</a> · Guillaume Ribeau EI — Zelyweb</p>
    </> : !error && <p>Chargement de votre proposition privée…</p>}
  </main>;
}
