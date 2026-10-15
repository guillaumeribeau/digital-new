"use client";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { AntiBot, type AntiBotSettings } from "./anti-bot";

export function LeadVerification({ antiBot }: { antiBot: AntiBotSettings | null }) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeVersion, setChallengeVersion] = useState(0);
  const token = useRef("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  useLayoutEffect(() => {
    if (!token.current) token.current = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function confirm() {
    setBusy(true);
    try {
      const response = await fetch("/api/leads/verify", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.current }),
        signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (response.ok && result.success) { setConfirmed(true); token.current = ""; }
      else setMessage(result.error || "La confirmation est temporairement indisponible.");
    } catch { setMessage("La confirmation est temporairement indisponible. Réessayez."); }
    finally { setBusy(false); }
  }
  return <article className="container legal-content">
    <h1>{confirmed ? "Votre demande est confirmée." : "Confirmez votre demande."}</h1>
    {confirmed ? <p role="status">Votre adresse e-mail est vérifiée et votre demande peut maintenant être prise en charge.
      Vous allez recevoir un e-mail de confirmation. Notre équipe examinera votre projet et vous recontactera.</p> : <>
      <div className="lead-email-notice">
        <strong>Dernière étape obligatoire : validez votre adresse e-mail.</strong>
        <p>Cliquez sur « Confirmer mon adresse e-mail » ci-dessous pour activer votre demande.
          Notre équipe pourra la prendre en charge uniquement après cette validation.
          Vous recevrez ensuite un e-mail de confirmation.</p>
      </div>
      <button className="button" disabled={busy} onClick={confirm}>
        {busy ? "Confirmation…" : "Confirmer mon adresse e-mail"}</button>
      {message && <p role="alert">{message}</p>}
      <h2>Besoin d’un nouveau lien ?</h2>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        if (!turnstileToken) { setResendMessage("Terminez la vérification anti-robot avant de demander un nouveau lien."); return; }
        setBusy(true);
        try {
          const response = await fetch("/api/leads/resend", { method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: data.get("reference"), email: data.get("email"), turnstileToken }),
            signal: AbortSignal.timeout(25000) });
          const result = await response.json();
          setResendMessage(result.message || result.error || "Le renvoi est temporairement indisponible.");
        } catch { setResendMessage("Le renvoi est temporairement indisponible."); }
        finally { setBusy(false); setTurnstileToken(""); setChallengeVersion((value) => value + 1); }
      }}>
        <div className="field"><label htmlFor="reference">Référence de votre demande</label>
          <input id="reference" name="reference" required maxLength={36} /></div>
        <div className="field"><label htmlFor="email">Votre adresse e-mail</label>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
        <AntiBot key={challengeVersion} settings={antiBot} action="lead_resend" onToken={setTurnstileToken} />
        <button className="button" disabled={busy}>Demander un nouveau lien</button>
      </form>
      {resendMessage && <p role="status">{resendMessage}</p>}
    </>}
    <p><Link href="/">Revenir à l’accueil</Link></p>
  </article>;
}
