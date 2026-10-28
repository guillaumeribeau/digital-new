"use client";
import { useActionState, useEffect, useRef } from "react";
import { commercialAction } from "../app/commercial-actions";
import { type Brand, brandSellerDefaults } from "@nova/shared/brands";
export function CommercialForm({ children, operation, id, button = "Enregistrer", reset = false, onSuccess, brand = "zelyweb" }: { children?: React.ReactNode; operation: string; id?: string; button?: string; reset?: boolean; onSuccess?: () => void; brand?: Brand }) {
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
  return <form ref={form} action={action} className="mutation-form"><input type="hidden" name="operation" value={operation} />{id && <input type="hidden" name="id" value={id} />}
    {operation === "settings" && <><button type="button" className="button secondary" disabled={pending} onClick={() => {
      for (const key of ["legalName", "address", "registrationNumber", "vatNumber", "taxNote", "terms"] as const) {
        const input = form.current?.elements.namedItem(key);
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) input.value = brandSellerDefaults(brand)[key];
      }
    }}>Reprendre les informations de cette marque</button><p className="info-line">Ce bouton préremplit le formulaire. Vérifiez les informations puis cliquez sur Enregistrer pour les conserver.</p></>}
    {children}
    <button className="button" disabled={pending}>{pending ? "Enregistrement…" : button}</button>
    {state.error && <p role="alert" className="notice error">{state.error}</p>}{state.success && <p role="status" className="notice success">{state.success}</p>}
  </form>;
}
