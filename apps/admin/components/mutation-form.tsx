"use client";
import { useActionState, useRef, useEffect } from "react";
import { saveAction, convertAction } from "../app/actions";
export function MutationForm({ children, operation, id, button = "Enregistrer", convert = false, reset = false }: {
  children?: React.ReactNode; operation?: string; id: string; button?: string; convert?: boolean; reset?: boolean;
}) {
  const [state, action, pending] = useActionState(convert ? convertAction : saveAction, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success && reset) form.current?.reset(); }, [state, reset]);
  return <form ref={form} action={action} className="mutation-form"><input type="hidden" name="id" value={id} /><input type="hidden" name="operation" value={operation || ""} />{children}
    <button className="button" disabled={pending}>{pending ? "Enregistrement…" : button}</button>
    {state.error && <p className="notice error" role="alert">{state.error}</p>}{state.success && <p className="notice success" role="status">{state.success}</p>}
  </form>;
}
