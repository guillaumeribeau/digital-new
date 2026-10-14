"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const gtm = process.env.NEXT_PUBLIC_GTM_ID;
function activate() {
  if (window.location.pathname === "/confirmer-demande") return;
  if (
    !gtm ||
    !/^GTM-[A-Z0-9]+$/.test(gtm) ||
    document.getElementById("nova-gtm")
  )
    return;
  window.dataLayer ??= [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = "nova-gtm";
  script.src = "https://www.googletagmanager.com/gtm.js?id=" + gtm;
  script.async = true;
  document.head.appendChild(script);
}
export function Consent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const consent = localStorage.getItem("nova-consent");
    if (gtm && !consent) {
      queueMicrotask(() => setVisible(true));
    }
    if (consent === "accepted") activate();
    const show = () => setVisible(true);
    window.addEventListener("nova-open-consent", show);
    return () => window.removeEventListener("nova-open-consent", show);
  }, []);
  function choose(value: string) {
    localStorage.setItem("nova-consent", value);
    setVisible(false);
    if (value === "accepted") activate();
    else if (document.getElementById("nova-gtm")) window.location.reload();
  }
  return visible ? (
    <aside
      className="consent-panel"
      aria-label="Préférences de confidentialité"
    >
      <strong>Vos préférences, votre choix.</strong>
      <p>
        Avec votre accord, nous utilisons des outils de mesure pour comprendre
        les visites. Votre demande reste accessible quel que soit votre choix.
      </p>
      <Link href="/cookies">En savoir plus</Link>
      <div>
        <button onClick={() => choose("rejected")}>Refuser</button>
        <button onClick={() => choose("accepted")}>Accepter</button>
      </div>
    </aside>
  ) : null;
}
export function ConsentSettings() {
  return (
    <button
      className="button"
      onClick={() => window.dispatchEvent(new Event("nova-open-consent"))}
    >
      Gérer mes préférences
    </button>
  );
}
