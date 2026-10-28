"use client";
import { useActionState, useId, useRef, useState } from "react";
import { manualPaymentAction } from "../app/manual-payment-actions";
import { type ManualPaymentKind } from "../lib/manual-payment-types";

export function ManualPaymentForm({ id, kind, expectedUpdatedAt, status, today, paidOn, nextBillingOn }: {
  id: string; kind: ManualPaymentKind; expectedUpdatedAt: string; status: string; today: string; paidOn: string; nextBillingOn: string;
}) {
  const prefix = useId(), request = useRef("");
  const [selected, setSelected] = useState(status);
  const [state, action, pending] = useActionState(manualPaymentAction, {});
  const subscription = kind.endsWith("SUBSCRIPTION");
  return <form action={action} className="mutation-form" onSubmit={e => {
    request.current ||= crypto.randomUUID();
    (e.currentTarget.elements.namedItem("requestId") as HTMLInputElement).value = request.current;
  }}>
    <input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} />
    <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} /><input type="hidden" name="requestId" />
    <label htmlFor={prefix + "status"}>État du paiement<select id={prefix + "status"} name="status" value={selected} onChange={e => setSelected(e.target.value)}>
      <option value="PENDING">En attente</option><option value="PAID">Payé</option><option value="FAILED">Paiement échoué</option>
    </select></label>
    {selected === "PAID" && <><label htmlFor={prefix + "paid"}>Date du règlement reçu<input id={prefix + "paid"} name="paidOn" type="date" required max={today} defaultValue={paidOn} /></label>
      {subscription && <label htmlFor={prefix + "next"}>Prochaine échéance<input id={prefix + "next"} name="nextBillingOn" type="date" required min={today} defaultValue={nextBillingOn} /></label>}</>}
    <label htmlFor={prefix + "reference"}>Référence du règlement (facultatif)<input id={prefix + "reference"} name="reference" maxLength={200} placeholder="Référence Stripe ou virement" /></label>
    <label htmlFor={prefix + "note"}>Note interne (facultatif)<textarea id={prefix + "note"} name="note" maxLength={2000} rows={2} /></label>
    {state.error && <p className="notice error" role="alert">{state.error}</p>}
    {state.success && <p className="notice" role="status">{state.success}</p>}
    <button className="button secondary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer l’état du paiement"}</button>
  </form>;
}
