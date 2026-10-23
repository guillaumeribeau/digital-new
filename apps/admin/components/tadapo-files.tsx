"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function TadapoFiles({ id }: { id: string }) {
  const [message, setMessage] = useState(""), [pending, setPending] = useState(false); const router = useRouter();
  return <form className="mutation-form" onSubmit={async event => { event.preventDefault(); const form = event.currentTarget; setPending(true); setMessage(""); try {
    const r = await fetch(`/api/admin/tadapo/${id}/files`, { method: "POST", body: new FormData(form) });
    if (!r.ok) throw new Error(); setMessage("Fichier rattaché au dossier."); form.reset(); router.refresh();
  } catch { setMessage("Ajout impossible. Utilisez un PDF ou une image PNG, JPEG ou WebP de 5 Mo maximum."); } finally { setPending(false); } }}><label>Document reçu par e-mail<input name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" required /></label><button className="button" disabled={pending}>Rattacher au dossier</button>{message && <p role="status">{message}</p>}</form>;
}
