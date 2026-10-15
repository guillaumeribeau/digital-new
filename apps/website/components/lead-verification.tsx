"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleCheck, AlertCircle, LoaderCircle } from "lucide-react";
import { AntiBot, type AntiBotSettings } from "./anti-bot";

type VerificationResult = { confirmed: boolean; error?: string };
async function verifyToken(token: string): Promise<VerificationResult> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return { confirmed: false, error: "Le lien de confirmation est incomplet. Ouvrez le lien reçu par e-mail ou demandez-en un nouveau." };
  }
  try {
    const response = await fetch("/api/leads/verify", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(25000) });
    const result = await response.json();
    if (response.ok && result.success) return { confirmed: true };
    return { confirmed: false, error: result.error || "La confirmation est temporairement indisponible. Réessayez." };
  } catch {
    return { confirmed: false, error: "La confirmation est temporairement indisponible. Vérifiez votre connexion et réessayez." };
  }
}

export function LeadVerification({ antiBot }: { antiBot: AntiBotSettings | null }) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeVersion, setChallengeVersion] = useState(0);
  const token = useRef("");
  const request = useRef<Promise<VerificationResult> | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"checking" | "confirmed" | "error">("checking");
  const [canRetry, setCanRetry] = useState(false);
  const [message, setMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  useEffect(() => {
    if (!request.current) {
      token.current = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      window.history.replaceState(null, "", window.location.pathname);
      request.current = verifyToken(token.current);
    }
    // Reuse the in-flight request during React's development effect replay.
    // A single click must only consume the one-time token once.
    let active = true;
    request.current.then((result) => {
      if (!active) return;
      setStatus(result.confirmed ? "confirmed" : "error");
      setMessage(result.error || "");
      setCanRetry(!result.confirmed && /^[A-Za-z0-9_-]{43}$/.test(token.current));
      if (result.confirmed) token.current = "";
    });
    return () => { active = false; };
  }, []);
  async function confirm() {
    setStatus("checking");
    const result = await verifyToken(token.current);
    setStatus(result.confirmed ? "confirmed" : "error");
    setMessage(result.error || "");
    if (result.confirmed) token.current = "";
  }
  return <article className="container lead-verification">
    <div className="lead-verification-card" aria-busy={status === "checking"}>
      <div className={"lead-verification-icon " + status} aria-hidden="true">
        {status === "checking" ? <LoaderCircle className="spinner" size={34} /> : status === "confirmed" ? <CircleCheck size={34} /> : <AlertCircle size={34} />}
      </div>
      <p className="eyebrow">{status === "confirmed" ? "ON PREND LE RELAIS" : status === "checking" ? "UN INSTANT…" : "VÉRIFIONS VOTRE LIEN"}</p>
      <h1>{status === "confirmed" ? "Votre demande est confirmée." : status === "checking" ? "Nous validons votre demande…" : "La validation n’a pas abouti."}</h1>
      {status === "checking" && <p role="status">La confirmation se fait automatiquement. Vous n’avez rien d’autre à faire.</p>}
    {status === "confirmed" && <div role="status">
      <p>Votre adresse e-mail est vérifiée. Notre équipe peut maintenant prendre en charge votre projet.</p>
      <div className="lead-email-notice"><strong>Votre e-mail de confirmation va suivre.</strong>
        <p>Nous vous envoyons un récapitulatif de cette validation. Notre équipe examinera votre demande et vous recontactera pour la suite.</p></div>
    </div>}
    {status === "error" && <>
      {message && <p role="alert">{message}</p>}
      {canRetry && <button className="button" disabled={busy} onClick={confirm}>Réessayer la validation</button>}
      <details className="lead-verification-recovery">
      <summary>Recevoir un nouveau lien</summary>
      <p>Indiquez la référence de votre demande et l’adresse e-mail utilisée dans le formulaire.</p>
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
      </details>
    </>}
    <Link className="button lead-verification-home" href="/">Revenir à l’accueil</Link>
    </div>
  </article>;
}
