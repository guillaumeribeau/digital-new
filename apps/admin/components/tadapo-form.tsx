"use client";
import { useActionState } from "react";
import { tadapoAction } from "../app/tadapo-actions";
export function TadapoForm({ id, action, children, label = "Enregistrer" }: { id: string; action: string; children?: React.ReactNode; label?: string }) {
  const [state, submit, pending] = useActionState(tadapoAction, {});
  return <form action={submit} className="mutation-form"><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value={action} />{children}<button disabled={pending} className="button">{pending ? "Enregistrement…" : label}</button>{state.error && <p role="alert" className="notice error">{state.error}</p>}{state.success && <p role="status" className="notice success">{state.success}</p>}</form>;
}
