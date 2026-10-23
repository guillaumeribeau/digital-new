"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { workflowAction } from "../app/workflow-actions";

export type WorkflowData = {
  locked?: boolean; reviewExpired?: boolean; receivingConfigured?: boolean; subscriptionStatus?: string | null; reviewVersion: number; reviewUrl: string;
  finalApprovedAt: string | null; finalApprovedName: string | null; deadline: string | null; domainReadyAt: string | null;
  domainOptions: { id: string; domain: string; initialHtCents: number; renewalHtCents: number; recommended: boolean }[];
  domainSelection: { domain: string; kind: string; status: string; purchasedAt?: string | null; renewalAt?: string | null; acceptedSnapshot: unknown; renewalProposal?: unknown } | null;
  reviewRounds: { id: string; number: number; reviewVersion: number; status: string; messages: { id: string; author: string; content: string; files: { id: string; filename: string }[] }[] }[];
  inboundEmails?: { id: string; purpose: string; state: string; sender: string; subject: string; content: string; createdAt: string; attachments: { id: string; filename: string; archived?: boolean }[] }[];
};
export function useWorkflow(id: string, client: boolean) {
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
  const router = useRouter(); const attempt = useRef({ key: "", id: "" });
  function requestId(key: string) { if (attempt.current.key !== key) attempt.current = { key, id: crypto.randomUUID() }; return attempt.current.id; }
  async function run(input: Record<string, unknown>, form?: FormData) {
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      if (client) {
        const r = await fetch(`/api/client/sites/${id}/workflow`, { method: "POST", ...(form ? { body: form } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }) });
        const body = await r.json(); if (!r.ok) throw new Error(body.error); window.dispatchEvent(new Event("workflow-refresh"));
      } else {
        const r = await workflowAction(id, { ...input, requestId: input.requestId || requestId(JSON.stringify(input)) });
        if (r.error) throw new Error(r.error); router.refresh();
      }
      attempt.current = { key: "", id: "" }; setNotice("Enregistré.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Action indisponible."); } finally { setBusy(false); }
  }
  return { busy, notice, run, requestId };
}
export function ProjectWorkflow({ id, data, client = false }: { id: string; data: WorkflowData; client?: boolean }) {
  const { busy, notice, run, requestId } = useWorkflow(id, client);
  const last = data.reviewRounds.at(-1), open = data.reviewRounds.find(r => r.status === "OPEN");
  const waiting = !!open || !!(last && last.reviewVersion >= data.reviewVersion);
  const expired = !!data.reviewExpired;
  const limit = data.reviewRounds.length >= 3;
  const canSubmit = !waiting && !data.locked && !limit && !expired && !data.finalApprovedAt;
  return <section id="retours" className="panel section-gap"><h2>Modifications du site</h2>
    <p>Version {data.reviewVersion} · <a href={data.reviewUrl} target="_blank" rel="noreferrer" className="text-link">Voir le site provisoire ↗</a></p>
    {notice && <p role="status" className="notice">{notice}</p>}
    {!client && !data.receivingConfigured && <p className="notice">Le formulaire client est disponible. La réception automatique des réponses e-mail reste à configurer ; consigne les réponses reçues dans la boîte contact.</p>}
    <p>{data.reviewRounds.filter(r => r.status === "CLOSED").length}/3 séries terminées. {data.deadline && `Retours inclus jusqu’au ${new Date(data.deadline).toLocaleDateString("fr-FR")}.`}</p>
    {waiting && <p className="notice">{client ? "Vos demandes sont envoyées. Attendez l’e-mail présentant la version corrigée avant de transmettre la série suivante." : "Le client attend ton retour. Traite les demandes puis présente la version corrigée pour rouvrir le formulaire."}</p>}
    {data.reviewRounds.map(r => <details key={r.id} open={r.status === "OPEN"} className="panel section-gap"><summary>Série {r.number}/3 · version {r.reviewVersion} · {r.status === "OPEN" ? "À traiter" : "Terminée"}</summary>{r.messages.map(m => <div key={m.id}><strong>{m.author === "CLIENT" ? "Demande du client" : "Retours reçus par e-mail"}</strong><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.content}</p>{m.files.map(f => <p key={f.id}><a className="text-link" href={`/api/review-files/${f.id}`}>{f.filename} ↓</a></p>)}</div>)}</details>)}
    {client && canSubmit && <form className="mutation-form section-gap" onSubmit={e => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      f.set("requestId", requestId(JSON.stringify([data.reviewVersion, f.get("message"), ...f.getAll("files").map(v => v instanceof File ? [v.name, v.size, v.lastModified] : v)])));
      f.set("version", String(data.reviewVersion)); void run({}, f);
    }}><h3>Série {data.reviewRounds.length + 1}/3{data.reviewRounds.length === 2 ? " — dernière série incluse" : ""}</h3><p>Regroupez toutes vos demandes. Après l’envoi, le formulaire sera fermé pendant les corrections.</p><label>Mes modifications<textarea name="message" required minLength={2} maxLength={10000} rows={6} /></label><label>Photos et documents · 3 fichiers, 5 Mo chacun · PNG, JPEG, WebP, PDF<input type="file" name="files" multiple accept="image/png,image/jpeg,image/webp,application/pdf" /></label><label className="check-line"><input type="checkbox" required />J’ai regroupé mes demandes et je les envoie pour cette série.</label><button className="button" disabled={busy}>Envoyer ma série de modifications</button></form>}
    {!client && !data.locked && <>
      {waiting ? <form className="mutation-form section-gap" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run({ action: open ? "deliver" : "version", roundId: open?.id, expectedVersion: data.reviewVersion, url: f.get("url"), message: f.get("message") || undefined }); }}><h3>Présenter les corrections terminées</h3><label>Lien de la version corrigée<input name="url" type="url" defaultValue={data.reviewUrl} required /></label><label>Message au client · facultatif<textarea name="message" rows={3} maxLength={10000} /></label><label className="check-line"><input type="checkbox" required />J’ai terminé les corrections de cette série.</label><button className="button" disabled={busy}>Terminer la série et envoyer la version corrigée</button><small>{limit ? "L’e-mail demandera la validation finale. Les demandes supplémentaires passeront sur devis." : `L’e-mail ouvrira la série ${data.reviewRounds.length + 1}/3 et proposera aussi la validation finale.`}</small></form>
      : <button className="button secondary" disabled={busy} onClick={() => void run({ action: "review-resend" })}>Renvoyer l’e-mail de retours ou de validation</button>}
      {!waiting && !limit && !expired && <details className="section-gap"><summary>Consigner une série reçue par e-mail</summary><form className="mutation-form" onSubmit={e => { e.preventDefault(); void run({ action: "email", message: new FormData(e.currentTarget).get("message") }); }}><label>Demandes regroupées<textarea name="message" required minLength={2} maxLength={10000} /></label><button className="button secondary" disabled={busy}>Enregistrer et verrouiller cette série</button></form></details>}
    </>}
    {data.finalApprovedAt ? <p className="notice">Version validée par {data.finalApprovedName} le {new Date(data.finalApprovedAt).toLocaleDateString("fr-FR")}.</p> : client && !waiting && !data.locked ? <form className="mutation-form section-gap" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run({ action: "approve", version: data.reviewVersion, name: f.get("name"), agreement: f.get("agreement") === "yes" }); }}><h3>Cette version me convient</h3><label>Votre nom<input name="name" required minLength={2} maxLength={200} /></label><label className="check-line"><input type="checkbox" name="agreement" value="yes" required />J’ai vérifié cette version et je la valide pour la mise en ligne.</label><button className="button" disabled={busy}>Valider cette version</button></form> : !client && <p className="notice">Validation finale du client attendue.</p>}
    {client && (limit || expired || data.locked || data.finalApprovedAt) && !waiting && <form className="mutation-form section-gap" onSubmit={e => { e.preventDefault(); const message = String(new FormData(e.currentTarget).get("message")); void run({ action: "extra-request", message, requestId: requestId(message) }); }}><h3>Une demande supplémentaire ?</h3><p>Les changements supplémentaires font l’objet d’un devis à accepter avant intervention.</p><label>Décrivez votre demande<textarea name="message" required minLength={2} maxLength={10000} /></label><button className="button secondary" disabled={busy}>Demander un devis</button></form>}
    {!client && <SiteInbox emails={data.inboundEmails?.filter(m => m.purpose !== "DOMAIN")} />}
  </section>;
}
export function SiteInbox({ emails }: { emails?: WorkflowData["inboundEmails"] }) {
  const labels: Record<string, string> = { SUBMITTED: "Série envoyée", DEFERRED: "Reçu pendant les corrections, à examiner", UNVERIFIED_SENDER: "Identité de l’expéditeur à vérifier", QUOTE_REQUEST: "Demande sur devis", DOMAIN_MESSAGE: "Réponse concernant le domaine", PROJECT_CLOSED: "Projet fermé" };
  return emails?.length ? <section className="section-gap"><h3>E-mails reçus et demandes supplémentaires</h3><p>Les messages sont conservés avec leur date. Un e-mail reçu pendant les corrections n’ouvre aucune nouvelle série.</p>{emails.map(m => <details key={m.id} className="panel"><summary>{m.subject} · {labels[m.state] || "À examiner"} · {new Date(m.createdAt).toLocaleString("fr-FR")}</summary><p>{m.sender}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.content}</p>{m.attachments.map(f => <p key={f.id}><a className="text-link" href={`/api/admin/site-emails/${m.id}/attachments/${f.id}`}>{f.filename} ↓</a>{!f.archived && " · fichier à récupérer chez Resend"}</p>)}</details>)}</section> : null;
}
