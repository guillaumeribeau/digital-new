import { requireAdmin } from "../../../lib/access";
import Link from "next/link";
import { headers } from "next/headers";
import { commercialService } from "../../../lib/commercial";
import { PageTitle } from "../../../components/ui";
export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; brand?: string }> }) {
  await requireAdmin();
  const query = await searchParams, page = Math.max(1, Math.min(100000, Number(query.page) || 1)), q = (query.q || "").slice(0, 200);
  const result = await commercialService.clients(await headers(), q, page, query.brand);
  return <><PageTitle eyebrow="RELATION CLIENT" title="Vos clients" description="Les contacts issus des demandes, leurs échanges et leurs prestations complémentaires." action={<Link className="button secondary" href="/echanges">Voir les échanges</Link>} />
    <section className="panel"><form className="filters"><div><label htmlFor="q">Rechercher un client</label><input id="q" name="q" defaultValue={q} maxLength={200} placeholder="Entreprise, nom ou e-mail" /></div><button className="button">Rechercher</button></form>
      {result.rows.length ? <div className="table-scroll"><table><thead><tr><th>Client</th><th>Contact</th><th>Échanges</th><th>Devis</th><th /></tr></thead><tbody>{result.rows.map((client) => <tr key={client.id}><td><strong>{client.businessName}</strong><small>{client.brand === "tadapo" ? "Tadapo" : "Zelyweb"}</small><small>{client.emailVerifiedAt ? "Adresse confirmée" : "En attente de confirmation"}</small></td><td>{client.fullName}<small>{client.email}</small></td><td>{client.conversation?.needsReply ? <span className="badge">À vous de répondre</span> : "—"}</td><td>{client._count.quotes}</td><td><Link className="text-link" href={`/clients/${client.id}`}>Ouvrir la fiche →</Link></td></tr>)}</tbody></table></div> : <p className="empty">Aucun client ne correspond à cette recherche. Les demandes du site apparaissent ici.</p>}
      <div className="pagination"><span>{result.count} contact(s) · page {page}</span><div>{page > 1 && <Link className="button secondary small" href={`?q=${encodeURIComponent(q)}&brand=${encodeURIComponent(query.brand || "")}&page=${page - 1}`}>Précédent</Link>}{page * 20 < result.count && <Link className="button secondary small" href={`?q=${encodeURIComponent(q)}&brand=${encodeURIComponent(query.brand || "")}&page=${page + 1}`}>Suivant</Link>}</div></div>
    </section></>;
}
