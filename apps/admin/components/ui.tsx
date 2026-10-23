import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { leadStatuses, projectStages, type LeadStatusCode, type ProjectStageCode } from "@nova/shared";
export function Status({ value, project = false }: { value: string; project?: boolean }) {
  const label = project ? projectStages[value as ProjectStageCode] : leadStatuses[value as LeadStatusCode];
  return <span className={`badge badge-${value.toLowerCase()}`}>{label || value}</span>;
}
export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}<span>.</span></h1><p>{description}</p></div>{action}</div>;
}
export const date = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(value) : "Non renseigné";
export function Empty({ title, description }: { title: string; description: string }) {
  return <div className="empty"><span className="empty-icon"><Inbox size={28} /></span><h2>{title}</h2><p>{description}</p></div>;
}
export function DetailFields({ rows }: { rows: [string, React.ReactNode][] }) {
  return <dl className="details">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Non renseigné"}</dd></div>)}</dl>;
}
export function SafeUrl({ value }: { value: string | null }) {
  if (!value) return <>Non renseigné</>;
  let safe = false;
  try { const url = new URL(value); safe = ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
  catch { safe = false; }
  if (!safe) return <>{value}</>;
  return <a href={value} target="_blank" rel="noopener noreferrer" className="text-link">{value}<ArrowUpRight size={14} /><span className="sr-only"> (nouvel onglet)</span></a>;
}
export function Pagination({ page, pages, total, query, path }: { page: number; pages: number; total: number; query: { q: string; status: string; sort: string }; path: string }) {
  const href = (next: number) => path + "?" + new URLSearchParams({ ...query, page: String(next) });
  return <div className="pagination"><span>{total} résultat{total > 1 ? "s" : ""} · Page {page} sur {pages}</span><div>
    {page > 1 && <Link className="button secondary small" href={href(page - 1)}><ChevronLeft size={15} />Précédent</Link>}
    {page < pages && <Link className="button secondary small" href={href(page + 1)}>Suivant<ChevronRight size={15} /></Link>}
  </div></div>;
}
export function Filters({ statuses, query, path }: { statuses: Record<string, string>; query: { q: string; status: string; sort: string; view?: string; brand?: string }; path: string }) {
  return <form className="filters" action={path}>{query.view === "trash" && <input type="hidden" name="view" value="trash" />}<div className="search-field"><label htmlFor="q">Rechercher</label><input id="q" name="q" placeholder="Entreprise, contact, activité…" defaultValue={query.q} maxLength={200} /></div>
    <div><label htmlFor="brand">Marque</label><select id="brand" name="brand" defaultValue={query.brand || ""}><option value="">Toutes les marques</option><option value="zelyweb">Zelyweb</option><option value="tadapo">Tadapo</option></select></div><div><label htmlFor="status">Statut</label><select id="status" name="status" defaultValue={query.status}><option value="">Tous les statuts</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <div><label htmlFor="sort">Date de réception</label><select id="sort" name="sort" defaultValue={query.sort}><option value="desc">Plus récentes</option><option value="asc">Plus anciennes</option></select></div>
    <button className="button" type="submit">Appliquer</button><Link className="text-link" href={path + (query.view === "trash" ? "?view=trash" : "")}>Réinitialiser</Link>
  </form>;
}
