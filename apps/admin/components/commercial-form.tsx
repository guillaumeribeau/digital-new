"use client";
import { useActionState, useEffect, useRef } from "react";
import { commercialAction } from "../app/commercial-actions";
export function CommercialForm({ children, operation, id, button = "Enregistrer", reset = false, onSuccess }: { children?: React.ReactNode; operation: string; id?: string; button?: string; reset?: boolean; onSuccess?: () => void }) {
  const [state, action, pending] = useActionState(commercialAction, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success && reset) {
      form.current?.reset();
      const requestId = form.current?.querySelector<HTMLInputElement>('[name="requestId"]');
      if (requestId) requestId.value = crypto.randomUUID();
      onSuccess?.();
    }
  }, [state, reset, onSuccess]);
  return <form ref={form} action={action} className="mutation-form"><input type="hidden" name="operation" value={operation} />{id && <input type="hidden" name="id" value={id} />}{children}
    <button className="button" disabled={pending}>{pending ? "Enregistrement…" : button}</button>
    {state.error && <p role="alert" className="notice error">{state.error}</p>}{state.success && <p role="status" className="notice success">{state.success}</p>}
  </form>;
}
