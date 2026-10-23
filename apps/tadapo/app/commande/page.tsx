import type { Metadata } from "next";
import { tadapoSelection } from "@nova/shared/tadapo";
import { TadapoHeader } from "@tadapo/components/header";
import { TadapoFooter } from "@tadapo/components/footer";
import { OrderWizard } from "@tadapo/components/order-wizard";
export const metadata: Metadata = { title: "Préparer mon site", description: "Présentez votre activité et préparez le récapitulatif de votre futur site Tadapo.", robots: { index: false, follow: true } };
export default async function Order({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const selection = tadapoSelection(search.offre, search.engagement);
  return <><TadapoHeader /><main id="main" className="order-main"><OrderWizard {...selection} key={`${selection.plan}-${selection.term}`} /></main><TadapoFooter /></>;
}
