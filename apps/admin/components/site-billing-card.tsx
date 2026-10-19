"use client";
import { useActionState, useEffect, useState, useRef } from "react";
import { siteBillingAction, type SiteBillingResult } from "../app/site-billing-actions";
import { billingMoney, creationTtc, defaultRevisionMessage } from "../lib/site-billing-shared";
type Order = { refundedCents: number; disputeStatus: string | null; id: string; version: number; status: string; mode: string; previewUrl: string; screenshot: string; message: string; creationHtCents: number; paid: boolean; revisionEmailSent: boolean; revisionEmailMessage: string | null; subscriptionInvited: boolean; subscriptionStatus: string | null; subscriptionId: boolean; firstPaid: boolean; alert: boolean; cancelAtPeriodEnd: boolean; invoiceUrl: string | null; invoices: { id: string; status: string; amountCents: number; hostedUrl: string | null; pdfUrl: string | null }[] };
const performBilling = (_previous: SiteBillingResult, form: FormData) => siteBillingAction({}, form);
export function SiteBillingCard({ projectId, previewUrl, order }: { projectId: string; previewUrl: string; order: Order | null }) {
  const resendRequest = useRef("");
  const [state, action, pending] = useActionState(performBilling, {});
  const [screenshot, setScreenshot] = useState(order?.screenshot || "");
  const [fileError, setFileError] = useState("");
  const [preview, setPreview] = useState(order?.previewUrl || previewUrl);
  const [price, setPrice] = useState(((order?.creationHtCents || 29900) / 100).toFixed(2));
  const [message, setMessage] = useState(order?.message || "J’ai préparé une première version complète de votre site à partir de votre activité. Prenez le temps de la découvrir. Si elle vous plaît, vous pouvez valider votre commande ; nous réaliserons ensuite les ajustements ensemble avant la mise en ligne.");
  const [revisionMessage, setRevisionMessage] = useState(order?.revisionEmailMessage || defaultRevisionMessage);
  const [revisionDirty, setRevisionDirty] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (state.html && state.kind === "creation") queueMicrotask(() => setDirty(false));
    if (state.html && state.kind === "revisions") queueMicrotask(() => setRevisionDirty(false));
  }, [state.version, state.html, state.kind]);
  useEffect(() => { if (state.success) resendRequest.current = ""; }, [state]);
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
  return <section className="panel" id="stripe"><h2>Présentation et paiement du site</h2><p className="info-line">Première version → paiement de la création → ajustements → e-mail d’activation → paiement du premier mois par le client → publication.</p>
    {order && <p className="notice">{order.mode === "LIVE" ? "Stripe réel" : "Mode test — aucun débit réel"} · {order.paid ? "Création payée" : frozen ? "Proposition envoyée · paiement attendu" : "Brouillon"}</p>}
    {!!order?.refundedCents && <p className="notice">Remboursement confirmé : {billingMoney(order.refundedCents)} TTC. L’historique du paiement initial est conservé. Vérifiez les opérations dans Stripe.</p>}
    {order?.disputeStatus && <p className="notice">Litige Stripe : {order.disputeStatus}. Consultez Stripe avant toute décision sur ce projet.</p>}
    {frozen && order && !order.firstPaid && <form action={action} className="mutation-form" onSubmit={e => { resendRequest.current ||= crypto.randomUUID(); const f = e.currentTarget.elements.namedItem("requestId") as HTMLInputElement; f.value = resendRequest.current; }}><input type="hidden" name="operation" value="resend-current" /><input type="hidden" name="id" value={order.id} /><input type="hidden" name="requestId" /><button className="button secondary" disabled={pending}>Renvoyer l’e-mail de l’étape actuelle</button><p className="info-line">Même proposition et même prix. Aucun prélèvement. Les envois déjà en attente restent protégés des doublons.</p></form>}
    {!frozen && <><form action={action} className="mutation-form" onChange={() => setDirty(true)}>
      <input type="hidden" name="operation" value="preview" /><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="expectedVersion" value={state.version ?? order?.version ?? 0} />
      <label>Lien d’aperçu privé HTTPS<input required name="previewUrl" type="url" value={preview} onChange={e => setPreview(e.target.value)} maxLength={1000} /></label>
      <label>Prix de création HT (€)<input required name="creationPrice" value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" /></label>
      <p className="info-line">TVA 20 %. Par défaut : {billingMoney(creationTtc(29900))} TTC. Abonnement fixe : 29 € HT / 34,80 € TTC par mois, activé par le client avant publication.</p>
      <label>Message personnel<textarea required name="message" minLength={10} maxLength={5000} rows={5} value={message} onChange={e => setMessage(e.target.value)} /></label>
      <label>Capture du site<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void chooseFile(e.target.files?.[0])} /></label>
      <input type="hidden" name="screenshot" value={screenshot} />
      {fileError && <p role="alert" className="notice error">{fileError}</p>}
      <button className="button" disabled={pending || !screenshot || !!fileError}>{pending ? "Préparation…" : "Enregistrer et prévisualiser l’e-mail"}</button>
    </form>
    {state.html && state.kind === "creation" && <><iframe title="Aperçu de l’e-mail de présentation" sandbox="" srcDoc={state.html} style={{ width: "100%", height: 650, border: "1px solid #d9dce1", borderRadius: 12, marginTop: 20 }} /><form action={action} className="mutation-form"><input type="hidden" name="operation" value="send" /><input type="hidden" name="id" value={state.id} /><input type="hidden" name="version" value={state.version} /><button className="button" disabled={pending || dirty}>Envoyer cet e-mail au client</button><p className="info-line">L’envoi fige le prix, l’aperçu et les conditions de la proposition.</p></form></>}
    </>}
    {order?.paid && <section className="section-gap"><h3>2. Paiement reçu : demander les ajustements</h3>{order.revisionEmailSent ? <p className="notice">E-mail d’ajustements ajouté à la file d’envoi. Le client peut répondre directement à contact@zelyweb.com.</p> : !order.subscriptionInvited && !order.subscriptionId ? <><p>Confirmez le paiement et posez vos questions pour recueillir les modifications du client.</p><form action={action} className="mutation-form"><input type="hidden" name="operation" value="revisions-preview" /><input type="hidden" name="id" value={order.id} /><label>Questions et message pour les ajustements<textarea name="message" required minLength={10} maxLength={5000} rows={12} value={revisionMessage} onChange={e => { setRevisionMessage(e.target.value); setRevisionDirty(true); }} /></label><button className="button" disabled={pending}>Prévisualiser l’e-mail d’ajustements</button></form>{state.html && state.kind === "revisions" && <><iframe title="Aperçu de l’e-mail d’ajustements" sandbox="" srcDoc={state.html} style={{ width: "100%", height: 750, border: "1px solid #d9dce1", borderRadius: 12 }} /><form action={action} className="mutation-form"><input type="hidden" name="operation" value="revisions-send" /><input type="hidden" name="id" value={state.id} /><input type="hidden" name="version" value={state.version} /><button className="button" disabled={pending || revisionDirty}>Envoyer les questions et la confirmation au client</button></form></>}</> : <p>Le projet est déjà passé à l’étape d’abonnement.</p>}</section>}
    {order?.paid && <><h3>3. L’abonnement à la publication</h3><p>34,80 € TTC par mois · résiliation en fin de période payée.</p><p className={order.alert ? "notice error" : "notice"}>{order.firstPaid && order.subscriptionStatus === "active" && !order.alert ? "Premier paiement confirmé : vérifier le domaine avant publication." : order.subscriptionStatus ? `État Stripe : ${order.subscriptionStatus}. Vérifiez le règlement avant publication.` : "Abonnement non démarré."}{order.cancelAtPeriodEnd ? " Résiliation programmée en fin de période." : ""}</p>
      {!order.subscriptionId && !order.subscriptionInvited && <form action={action} className="mutation-form"><input type="hidden" name="operation" value="subscription-preview" /><input type="hidden" name="id" value={order.id} /><label className="check-line"><input type="checkbox" name="confirmed" value="yes" required />Les ajustements sont validés, l’URL définitive est renseignée et je suis prêt à publier après confirmation du premier paiement.</label><button className="button" disabled={pending}>Préparer l’e-mail de mise en ligne</button></form>}
      {order.subscriptionInvited && !order.subscriptionId && <p className="notice">Invitation envoyée · activation et paiement du premier mois attendus. Aucun prélèvement n’est déclenché par l’admin.</p>}
      {state.html && state.kind === "subscription" && !order.subscriptionInvited && <><iframe title="Aperçu de l’e-mail de mise en ligne" sandbox="" srcDoc={state.html} style={{ width: "100%", height: 750, border: "1px solid #d9dce1", borderRadius: 12 }} /><form action={action} className="mutation-form"><input type="hidden" name="operation" value="subscription-send" /><input type="hidden" name="id" value={state.id} /><input type="hidden" name="version" value={state.version} /><button className="button" disabled={pending}>Envoyer l’e-mail d’activation au client</button></form></>}
      <p className="info-line">Le client active et paie son abonnement sur Stripe. Mise en ligne sous 2 jours ouvrés après confirmation du premier paiement, si le domaine et ses accès sont prêts.</p>
      {order.subscriptionId && <form action={action} className="mutation-form"><input type="hidden" name="operation" value="refresh" /><input type="hidden" name="id" value={order.id} /><button className="button secondary" disabled={pending}>Actualiser le suivi Stripe</button></form>}
      {order.invoiceUrl && <a className="text-link" href={order.invoiceUrl} target="_blank" rel="noreferrer">Dernière facture Stripe ↗</a>}
    </>}
    {!!order?.invoices.length && <><h3>Factures Stripe</h3>{order.invoices.map(i => <p key={i.id}>{billingMoney(i.amountCents)} · {i.status} {i.hostedUrl && <a className="text-link" href={i.hostedUrl} target="_blank" rel="noreferrer">Consulter</a>} {i.pdfUrl && <a className="text-link" href={i.pdfUrl} target="_blank" rel="noreferrer">PDF</a>}</p>)}</>}
    {state.error && <p role="alert" className="notice error">{state.error}</p>}{state.success && <p role="status" className="notice success">{state.success}</p>}
  </section>;
}
