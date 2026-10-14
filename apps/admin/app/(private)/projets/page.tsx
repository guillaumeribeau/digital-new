import Link from "next/link";
import { headers } from "next/headers";
import { projectStages } from "@nova/shared";
import { requireAdmin } from "../../../lib/access";
import { adminService, querySchema } from "../../../lib/service";
import { PageTitle, Status, Empty, Filters, Pagination, date } from "../../../components/ui";
export default async function Projects({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const parsed = querySchema.safeParse(await searchParams);
  const query = parsed.success && (!parsed.data.status || Object.hasOwn(projectStages, parsed.data.status)) ? parsed.data : querySchema.parse({});
  const data = await adminService.projects(await headers(), query);
  return <><PageTitle eyebrow="DE L’IDÉE À LA MISE EN LIGNE" title="Les projets" description="Un suivi clair pour les contenus, la création, la proposition et la publication." action={<Link className="button secondary" href="/demandes?status=QUALIFIED">Demandes qualifiées →</Link>} />
    <section className="panel"><Filters statuses={projectStages} query={query} path="/projets" />
      {!data.rows.length ? <Empty title="Aucun projet à afficher" description="Qualifiez une demande vérifiée, puis transformez-la en projet depuis sa fiche." /> : <div className="table-scroll"><table><thead><tr><th>Projet / entreprise</th><th>Contact</th><th>Étape de production</th><th>Créé le</th><th>Prévisualisation</th><th><span className="sr-only">Ouvrir</span></th></tr></thead><tbody>{data.rows.map((project) => <tr key={project.id}><td><strong>{project.lead.businessName}</strong><small className="reference">{project.id}</small></td><td>{project.lead.fullName}<small>{project.lead.email}</small></td><td><Status value={project.stage} project /></td><td>{date(project.createdAt)}</td><td>{project.previewUrl ? "Lien renseigné" : "À renseigner"}</td><td><Link className="text-link" href={`/projets/${project.id}`}>Ouvrir →</Link></td></tr>)}</tbody></table></div>}
      <Pagination path="/projets" page={query.page} pages={data.pages} total={data.total} query={query} />
    </section></>;
}
