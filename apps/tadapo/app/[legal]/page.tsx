import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TadapoHeader } from "@tadapo/components/header";
import { TadapoFooter } from "@tadapo/components/footer";
import { LegalContent, legalTitles } from "@tadapo/lib/legal-content";
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(legalTitles).map(legal => ({ legal })); }
export async function generateMetadata({ params }: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const { legal } = await params;
  if (!Object.hasOwn(legalTitles, legal)) notFound();
  return { title: legalTitles[legal], alternates: { canonical: "/" + legal } };
}
export default async function LegalPage({ params }: { params: Promise<{ legal: string }> }) {
  const { legal } = await params;
  if (!Object.hasOwn(legalTitles, legal)) notFound();
  return <><TadapoHeader /><main id="main" className="t-container legal-main"><p className="t-eyebrow">EN TOUTE CLARTÉ · 22 OCTOBRE 2026</p><h1>{legalTitles[legal]}.</h1><nav className="legal-nav" aria-label="Documents et guides">{Object.entries(legalTitles).map(([slug, title]) => <Link href={"/" + slug} key={slug} aria-current={slug === legal ? "page" : undefined}>{title}</Link>)}</nav><article><LegalContent slug={legal} /></article><p className="legal-date">Version de préparation — 22 octobre 2026</p></main><TadapoFooter /></>;
}
