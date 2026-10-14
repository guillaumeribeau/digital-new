import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/access";
import { PageTitle, Empty } from "../../../components/ui";
const sections: Record<string, { title: string; description: string }> = {
  clients: { title: "Les clients", description: "La gestion des clients sera disponible dans une prochaine version. Les contacts actuels restent accessibles dans leurs demandes et projets." },
  sites: { title: "Les sites internet", description: "Le catalogue des sites sera disponible dans une prochaine version. Les URL renseignées sont accessibles dans les fiches projets." },
  abonnements: { title: "Les abonnements", description: "La gestion des abonnements à 29 € HT/mois sera ajoutée ultérieurement. Aucun paiement ni abonnement n’est créé automatiquement." },
};
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  await requireAdmin(); const { section } = await params; const info = sections[section];
  if (!info) notFound();
  return <><PageTitle eyebrow="VOTRE PLATEFORME GRANDIT" title={info.title} description="Cette rubrique est préparée pour la suite." /><section className="panel"><Empty title="À venir" description={info.description} /></section></>;
}
