import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { examples } from "@/lib/examples";
import { PlumberSite } from "@/components/examples/plumber-site";
import { GardenSite } from "@/components/examples/garden-site";
import { SalonSite } from "@/components/examples/salon-site";
import { ConsultingSite } from "@/components/examples/consulting-site";
import { WellnessSite } from "@/components/examples/wellness-site";
import { CommunitySite } from "@/components/examples/community-site";
import { RestaurantSite, PhotographerSite, AutomotiveSite } from "@/components/examples/dark-sites";
import { NewDemoSite } from "@/components/examples/new-sites";
export const dynamicParams = false;
export function generateStaticParams() {
  return examples.map((e) => ({ slug: e.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = examples.find((v) => v.slug === slug);
  if (!e) return {};
  return {
    title: { absolute: e.name + " — Démonstration de site vitrine" },
    description:
      e.description + " Entreprise fictive, aucune prestation réelle.",
    robots: { index: false, follow: true },
    openGraph: {
      title: e.name + " — Site de démonstration",
      description: e.description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: e.name + " — Site de démonstration",
      description: e.description,
    },
  };
}
export default async function DemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  switch (slug) {
    case "electricien":
    case "nettoyage":
    case "coach-sportif":
    case "boulangerie":
    case "immobilier":
      return <NewDemoSite slug={slug} />;
    case "plombier":
      return <PlumberSite />;
    case "paysagiste":
      return <GardenSite />;
    case "coiffure":
      return <SalonSite />;
    case "conseil":
      return <ConsultingSite />;
    case "bien-etre":
      return <WellnessSite />;
    case "association":
      return <CommunitySite />;
    case "restaurant":
      return <RestaurantSite />;
    case "photographe":
      return <PhotographerSite />;
    case "automobile":
      return <AutomotiveSite />;
    default:
      notFound();
  }
}
