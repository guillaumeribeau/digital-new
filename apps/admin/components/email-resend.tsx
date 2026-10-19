"use client";
import { useState, useRef } from "react";
import { resendAction } from "../app/email-actions";
export function EmailResend({ id }: { id: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""); const request = useRef("");
  return <><button className="button secondary" disabled={busy} onClick={async () => { setBusy(true); request.current ||= crypto.randomUUID(); try { const r = await resendAction(id, request.current); if (!r.error) request.current = ""; setMessage(r.error || "Renvoi mis en attente."); } catch { setMessage("Connexion interrompue. Réessayez : la même tentative sera conservée pour éviter un doublon."); } finally { setBusy(false); } }}>Renvoyer à l’identique</button>{message && <p role="status">{message}</p>}</>;
}
