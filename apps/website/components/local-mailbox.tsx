"use client";
import { useEffect, useRef, useState } from "react";

type LocalEmail = { id: string; subject: string; to: string[]; text: string; createdAt: string };
export function LocalMailbox() {
  const token = useRef("");
  const [emails, setEmails] = useState<LocalEmail[]>([]);
  const [status, setStatus] = useState("Chargement des e-mails…");
  async function refresh() {
    if (!token.current) { setStatus("Ouvrez cette boîte avec la commande npm run emails:local."); return; }
    try {
      const response = await fetch("/api/local-emails", { headers: { authorization: "Bearer " + token.current }, cache: "no-store" });
      if (!response.ok) throw new Error("MAILBOX_UNAVAILABLE");
      const data = await response.json();
      setEmails(data.emails); setStatus(data.emails.length ? "" : "Aucun e-mail en attente. Envoyez une demande depuis le formulaire, puis actualisez.");
    } catch { setStatus("Boîte indisponible. Rouvrez-la avec npm run emails:local."); }
  }
  useEffect(() => {
    token.current ||= new URLSearchParams(window.location.hash.slice(1)).get("key") || "";
    window.history.replaceState(null, "", window.location.pathname);
    void refresh();
  }, []);
  return <main id="main" style={{ maxWidth: 900, margin: "60px auto", padding: 24 }}>
    <h1>E-mails de test locaux</h1>
    <p>Aucun e-mail réel n’est envoyé. Les liens utilisent le même parcours de confirmation que les e-mails habituels.</p>
    <button type="button" onClick={() => void refresh()} style={{ margin: "20px 0", padding: "12px 20px" }}>Actualiser</button>
    {status && <p role="status">{status}</p>}
    {emails.map((email) => {
      const candidate = email.text.match(/https?:\/\/[^\s]+\/confirmer-demande#token=[A-Za-z0-9_-]+/)?.[0];
      let link: string | undefined;
      if (candidate) {
        const url = new URL(candidate);
        if (url.origin === window.location.origin) link = url.href;
      }
      return <article key={email.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2>{email.subject}</h2><p>À : {email.to.join(", ")}</p>
        {link && <p><a href={link} target="_blank" rel="noopener noreferrer">Ouvrir le lien de confirmation →</a></p>}
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit", lineHeight: 1.7 }}>{email.text}</pre>
      </article>;
    })}
  </main>;
}
