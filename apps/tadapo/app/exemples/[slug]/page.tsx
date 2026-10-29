import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demos } from "@tadapo/lib/demos";
import { AlbaDemo, CourantDemo, PollenDemo } from "@tadapo/components/demo-sites";
import "../../../styles/demos.css";
type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return demos.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const demo = demos.find(item => item.slug === slug);
  if (!demo) notFound();
  return { title: { absolute: `${demo.name} — Démonstration Tadapo` }, description: `${demo.description} Entreprise fictive, aucune prestation réelle.`, robots: { index: false, follow: true } };
}
export default async function DemoPage({ params }: Props) {
  const { slug } = await params;
  const demo = demos.find(item => item.slug === slug);
  if (!demo) notFound();
  if (demo.tone === "electric") return <CourantDemo demo={demo} />;
  if (demo.tone === "alba") return <AlbaDemo demo={demo} />;
  return <PollenDemo demo={demo} />;
}
