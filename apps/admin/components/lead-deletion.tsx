"use client";
import { useActionState, useRef } from "react";
import { Trash2, RotateCcw, X } from "lucide-react";
import { leadVisibilityAction } from "../app/actions";

export function LeadDeletion({ id, businessName, updatedAt, deleted = false, linked = false }: {
  id: string; businessName: string; updatedAt: string; deleted?: boolean; linked?: boolean;
}) {
  const [state, action, pending] = useActionState(leadVisibilityAction, {});
  const dialog = useRef<HTMLDialogElement>(null);
  const fields = <><input type="hidden" name="id" value={id} /><input type="hidden" name="expectedUpdatedAt" value={updatedAt} />
    <input type="hidden" name="operation" value={deleted ? "restore" : "trash"} /><input type="hidden" name="confirmed" value="yes" /></>;
  if (deleted) return <section className="panel lead-trash-panel"><span className="lead-trash-symbol"><RotateCcw size={24} /></span>
    <h2>Cette demande est dans la corbeille</h2><p>Restaurez-la pour la retrouver dans votre liste et reprendre son suivi. Son contenu et son historique sont conservés.</p>
    <form action={action}>{fields}<button className="button" disabled={pending}><RotateCcw size={17} />{pending ? "Restauration…" : "Restaurer la demande"}</button>
      {state.error && <p className="notice error" role="alert">{state.error}</p>}</form></section>;
  return <section className="panel lead-trash-panel"><h2>Supprimer cette demande</h2>
    <p>{linked ? "Cette demande est liée à un projet, un devis ou des échanges. Elle reste disponible pour conserver le suivi du client." : "Placez cette demande dans la corbeille pour la retirer de votre liste. Vous pourrez la restaurer à tout moment."}</p>
    <button type="button" className="button lead-trash-button" disabled={linked} onClick={() => dialog.current?.showModal()}><Trash2 size={17} />Mettre à la corbeille</button>
    <dialog ref={dialog} className="lead-delete-dialog" aria-labelledby="lead-delete-title" aria-describedby="lead-delete-description">
      <button type="button" className="lead-dialog-close" aria-label="Fermer la confirmation" disabled={pending} onClick={() => dialog.current?.close()}><X size={21} /></button>
      <span className="lead-trash-symbol"><Trash2 size={26} /></span>
      <h2 id="lead-delete-title">Mettre cette demande à la corbeille ?</h2>
      <p id="lead-delete-description">La demande de <strong>{businessName}</strong> disparaîtra de la liste et des compteurs. Vous pourrez la restaurer depuis la corbeille.</p>
      <form action={action}>{fields}
        {state.error && <p className="notice error" role="alert">{state.error}</p>}
        <div className="lead-dialog-actions"><button type="button" className="button secondary" disabled={pending} onClick={() => dialog.current?.close()}>Annuler</button>
          <button className="button lead-trash-confirm" disabled={pending}>{pending ? "Suppression…" : "Confirmer la suppression"}</button></div>
      </form>
    </dialog>
  </section>;
}
