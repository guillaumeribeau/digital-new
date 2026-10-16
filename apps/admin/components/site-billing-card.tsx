"use client";
import { useActionState, useEffect, useState } from "react";
import { siteBillingAction, type SiteBillingResult } from "../app/site-billing-actions";
import { billingMoney, creationTtc } from "../lib/site-billing-shared";
type Order = { id: string; version: number; status: string; mode: string; previewUrl: string; screenshot: string; message: string; creationHtCents: number; paid: boolean; subscriptionStatus: string | null; subscriptionId: boolean; firstPaid: boolean; alert: boolean; cancelAtPeriodEnd: boolean; invoiceUrl: string | null; invoices: { id: string; status: string; amountCents: number; hostedUrl: string | null; pdfUrl: string | null }[] };
const performBilling = (_previous: SiteBillingResult, form: FormData) => siteBillingAction({}, form);
export function SiteBillingCard({ projectId, previewUrl, order }: { projectId: string; previewUrl: string; order: Order | null }) {
  const [state, action, pending] = useActionState(performBilling, {});
  const [screenshot, setScreenshot] = useState(order?.screenshot || "");
  const [fileError, setFileError] = useState("");
  const [preview, setPreview] = useState(order?.previewUrl || previewUrl);
  const [price, setPrice] = useState(((order?.creationHtCents || 29900) / 100).toFixed(2));
  const [message, setMessage] = useState(order?.message || "J’ai préparé une première version complète de votre site à partir de votre activité. Prenez le temps de la découvrir. Si elle vous plaît, vous pouvez valider votre commande ; nous réaliserons ensuite les ajustements ensemble avant la mise en ligne.");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (state.html) queueMicrotask(() => setDirty(false));
  }, [state.version, state.html]);
  const frozen = !!order && order.status !== "DRAFT";
  async function chooseFile(file?: File) {
    if (!file) return;
    setFileError(""); setDirty(true);
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) throw new Error("Choisissez une capture PNG, JPEG ou WebP de moins de 8 Mo.");
      const bitmap = await createImageBitmap(file), canvas = document.createElement("canvas");
      const scale = Math.min(1, 1100 / bitmap.width);
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      let result = canvas.toDataURL("image/jpeg", 0.72);
      if (result.length > 210000) result = canvas.toDataURL("image/jpeg", 0.4);
      if (result.length > 210000) throw new Error("La capture est trop détaillée. Choisissez une image moins haute.");
      setScreenshot(result);
    } catch (e) { setFileError(e instanceof Error ? e.message : "Capture non prise en charge."); }
  }
  return <section className="panel" id="stripe"><h2>Présentation et paiement du site</h2><p className="info-line">Première version → paiement de la création → ajustements → premier paiement mensuel → publication.</p>
    {order && <p className="notice">{order.mode === "LIVE" ? "Stripe réel" : "Mode test — aucun débit réel"} · {order.paid ? "Création payée" : frozen ? "Proposition envoyée · paiement attendu" : "Brouillon"}</p>}
    {!frozen && <><form action={action} className="mutation-form" onChange={() => setDirty(true)}>
      <input type="hidden" name="operation" value="preview" /><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="expectedVersion" value={state.version ?? order?.version ?? 0} />
      <label>Lien d’aperçu privé HTTPS<input required name="previewUrl" type="url" value={preview} onChange={e => setPreview(e.target.value)} maxLength={1000} /></label>
      <label>Prix de création HT (€)<input required name="creationPrice" value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" /></label>
      <p className="info-line">TVA 20 %. Par défaut : {billingMoney(creationTtc(29900))} TTC. Abonnement fixe : 29 € HT / 34,80 € TTC par mois, à la publication.</p>
      <label>Message personnel<textarea required name="message" minLength={10} maxLength={5000} rows={5} value={message} onChange={e => setMessage(e.target.value)} /></label>
      <label>Capture du site<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void chooseFile(e.target.files?.[0])} /></label>
      <input type="hidden" name="screenshot" value={screenshot} />
      {fileError && <p role="alert" className="notice error">{fileError}</p>}
      <button className="button" disabled={pending || !screenshot || !!fileError}>{pending ? "Préparation…" : "Enregistrer et prévisualiser l’e-mail"}</button>
    </form>
    {state.html && <><iframe title="Aperçu de l’e-mail de présentation" sandbox="" srcDoc={state.html} style={{ width: "100%", height: 650, border: "1px solid #d9dce1", borderRadius: 12, marginTop: 20 }} /><form action={action} className="mutation-form"><input type="hidden" name="operation" value="send" /><input type="hidden" name="id" value={state.id} /><input type="hidden" name="version" value={state.version} /><button className="button" disabled={pending || dirty}>Envoyer cet e-mail au client</button><p className="info-line">L’envoi fige le prix, l’aperçu et les conditions de la proposition.</p></form></>}
    </>}
    {order?.paid && <><h3>L’abonnement à la publication</h3><p>34,80 € TTC par mois · résiliation en fin de période payée.</p><p className={order.alert ? "notice error" : "notice"}>{order.firstPaid && order.subscriptionStatus === "active" && !order.alert ? "Premier paiement confirmé : publication autorisée." : order.subscriptionStatus ? `État Stripe : ${order.subscriptionStatus}. Vérifiez le règlement avant publication.` : "Abonnement non démarré."}{order.cancelAtPeriodEnd ? " Résiliation programmée en fin de période." : ""}</p>
      {(!order.subscriptionId || order.subscriptionStatus === "incomplete_expired") && <form action={action} className="mutation-form"><input type="hidden" name="operation" value="activate" /><input type="hidden" name="id" value={order.id} /><label className="check-line"><input type="checkbox" name="confirmed" value="yes" required />Les ajustements sont validés, l’URL définitive est renseignée et je suis prêt à publier après confirmation du premier paiement.</label><button className="button" disabled={pending}>Démarrer l’abonnement et le premier paiement</button></form>}
      {order.subscriptionId && <form action={action} className="mutation-form"><input type="hidden" name="operation" value="refresh" /><input type="hidden" name="id" value={order.id} /><button className="button secondary" disabled={pending}>Actualiser le suivi Stripe</button></form>}
      {order.invoiceUrl && <a className="text-link" href={order.invoiceUrl} target="_blank" rel="noreferrer">Dernière facture Stripe ↗</a>}
    </>}
    {!!order?.invoices.length && <><h3>Factures Stripe</h3>{order.invoices.map(i => <p key={i.id}>{billingMoney(i.amountCents)} · {i.status} {i.hostedUrl && <a className="text-link" href={i.hostedUrl} target="_blank" rel="noreferrer">Consulter</a>} {i.pdfUrl && <a className="text-link" href={i.pdfUrl} target="_blank" rel="noreferrer">PDF</a>}</p>)}</>}
    {state.error && <p role="alert" className="notice error">{state.error}</p>}{state.success && <p role="status" className="notice success">{state.success}</p>}
  </section>;
}
