"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }
export type AntiBotSettings = { siteKey: string; testMode: boolean };
export function AntiBot({ settings, action, onToken }: { settings: AntiBotSettings | null; action: "lead_submit" | "lead_resend"; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const renderWidget = useCallback(() => {
    if (!settings || !container.current || !window.turnstile || widget.current !== null) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: settings.siteKey, action, language: "fr", theme: "light", size: "flexible",
      "response-field": false,
      callback: (token: string) => { onToken(token); setVerified(true); setError(""); },
      "expired-callback": () => { onToken(""); setVerified(false); },
      "error-callback": () => { onToken(""); setVerified(false); setError("La vérification anti-robot est indisponible. Vérifiez votre connexion ou rechargez la page."); },
    });
  }, [settings, action, onToken]);
  useEffect(() => {
    // Render here as well as on script readiness: Next's cached Script callback
    // is not repeated by React's development effect replay after cleanup.
    renderWidget();
    return () => {
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
      onToken("");
    };
  }, [renderWidget, onToken]);
  return <div className="anti-bot" data-verified={verified} style={{ margin: "20px 0", minWidth: 0 }}>
    <p style={{ fontSize: 12, marginBottom: 8 }}>Vérification anti-robot{settings?.testMode ? " · mode de test local" : ""}</p>
    {settings ? <><div ref={container} /><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={renderWidget} onError={() => setError("Le service anti-robot n’a pas pu être chargé. Rechargez la page pour réessayer.")} /></> : <p role="alert">La vérification anti-robot n’est pas encore configurée.</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
