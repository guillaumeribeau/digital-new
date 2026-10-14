import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "../../../lib/access";
import { adminService, querySchema } from "../../../lib/service";
import { leadStatuses } from "@nova/shared";
import { PageTitle, Status, Empty, Filters, Pagination, date } from "../../../components/ui";
export default async function Leads({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const input = await searchParams;
  const parsed = querySchema.safeParse(input);
  const query = parsed.success && (!parsed.data.status || Object.hasOwn(leadStatuses, parsed.data.status)) ? parsed.data : querySchema.parse({});
  const data = await adminService.leads(await headers(), query);
  return <><PageTitle eyebrow="VOTRE ACTIVITÉ COMMENCE PAR EUX" title="Les demandes" description="Retrouvez les briefs reçus, qualifiez les besoins et préparez vos prochains projets." />
    <section className="panel"><Filters statuses={leadStatuses} query={query} path="/demandes" />
      {!data.rows.length ? <Empty title={data.total ? "Cette page ne contient aucun résultat" : "Aucune demande à afficher"} description="Les demandes apparaissent dès leur enregistrement. Vous pouvez aussi ajuster vos filtres." /> : <div className="table-scroll"><table><thead><tr><th>Référence</th><th>Entreprise</th><th>Contact</th><th>E-mail / téléphone</th><th>Activité</th><th>Date</th><th>Statut</th><th><span className="sr-only">Ouvrir</span></th></tr></thead><tbody>{data.rows.map((lead) => <tr key={lead.id}><td><span className="reference">{lead.id}</span></td><td><strong>{lead.businessName}</strong><small>{lead.city}</small></td><td>{lead.fullName}</td><td>{lead.email}<small>{lead.phone || "Téléphone non renseigné"}</small></td><td>{lead.businessSector}<small>{lead.services.slice(0, 100)}</small></td><td>{date(lead.createdAt)}</td><td><Status value={lead.status} /></td><td><Link className="text-link" href={`/demandes/${lead.id}`}>Ouvrir →</Link></td></tr>)}</tbody></table></div>}
      <Pagination path="/demandes" page={query.page} pages={data.pages} total={data.total} query={query} />
    </section></>;
}
