import { MutationForm } from "./mutation-form";
import { date, Status } from "./ui";
type Note = { id: string; content: string; createdAt: Date; author: { user: { name: string } } };
type Activity = { id: string; action: string; before: string | null; after: string | null; createdAt: Date; actor: { user: { name: string } } };
const names: Record<string, string> = { LEAD_TRASHED: "Demande placée dans la corbeille", LEAD_RESTORED: "Demande restaurée", NOTE_ADDED: "Note interne ajoutée", LEAD_STATUS_CHANGED: "Statut de demande modifié", PROJECT_CREATED: "Demande convertie en projet", PROJECT_STAGE_CHANGED: "Étape de production modifiée", PROJECT_LINKS_UPDATED: "Liens du projet modifiés" };
export function Notes({ id, kind, notes }: { id: string; kind: "lead" | "project"; notes: Note[] }) {
  return <section className="panel"><h2>Notes internes</h2><p className="info-line">Visibles uniquement dans l’administration.</p><MutationForm id={id} operation="note" button="Ajouter la note" reset><input type="hidden" name="kind" value={kind} /><label htmlFor="content">Votre note</label><textarea name="content" id="content" minLength={2} maxLength={5000} required placeholder="Un échange, un besoin à préciser, une idée à conserver…" /></MutationForm>
    {notes.map((note) => <div className="note" key={note.id}><div className="note-meta">{note.author.user.name} · {date(note.createdAt)}</div><p>{note.content}</p></div>)}{!notes.length && <p className="info-line">Aucune note pour le moment.</p>}{notes.length === 100 && <p className="info-line">Les 100 notes les plus récentes sont affichées.</p>}</section>;
}
export function History({ items }: { items: Activity[] }) {
  return <section className="panel"><h2>Historique</h2><ol className="timeline">{items.map((item) => <li key={item.id}><strong>{names[item.action] || item.action}</strong>{item.before && item.after && <div className="info-line"><Status value={item.before} project={item.action === "PROJECT_STAGE_CHANGED"} /> → <Status value={item.after} project={item.action === "PROJECT_STAGE_CHANGED"} /></div>}<small>{item.actor.user.name} · {date(item.createdAt)}</small></li>)}</ol>{!items.length && <p className="info-line">Aucune action administrative enregistrée.</p>}{items.length === 100 && <p className="info-line">Les 100 actions les plus récentes sont affichées.</p>}</section>;
}
