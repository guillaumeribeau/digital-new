import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { demos } from "@tadapo/lib/demos";
import { DemoContactForm } from "@tadapo/components/demo-contact";
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
  return <><aside className="demo-banner"><Link href="/#exemples">← Retour à Tadapo</Link><span>Site de démonstration · Entreprise fictive</span></aside><main id="main" className={`demo-live demo-${demo.tone}`}><header className="demo-header t-container"><a className="demo-brand" href="#accueil">{demo.name}</a><nav aria-label="Navigation du site de démonstration"><a href="#services">Notre savoir-faire</a><a href="#approche">Notre approche</a></nav><a href="#contact">Parlons-en <span aria-hidden="true">↗</span></a></header><section className="demo-hero t-container" id="accueil"><div><p className="t-eyebrow">{demo.sector}</p><h1>{demo.title}</h1><p>{demo.description}</p><a className="demo-button" href="#services">Découvrir notre univers <ArrowUpRight size={17} /></a></div><div className="demo-image"><Image src={demo.image} alt={demo.alt} fill preload sizes="(max-width:699px) 100vw, 50vw" /></div></section><div className="demo-strip">{demo.label}</div><section id="services" className="demo-services t-container"><p className="t-eyebrow">CE QUI NOUS ANIME</p><h2>{demo.tone === "pollen" ? "À savourer ensemble." : "Du savoir-faire, à votre service."}</h2><div className="demo-service-grid">{demo.services.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section><section id="approche" className="demo-about"><div className="t-container"><div><p className="t-eyebrow">UNE FAÇON DE FAIRE</p><h2>{demo.tone === "pollen" ? "Du goût, et du cœur." : "Les bonnes idées naissent d’une rencontre."}</h2></div><p>{demo.tone === "pollen" ? "Prendre le temps de cuisiner, de choisir les produits et de dresser la table. Notre restaurant imaginaire raconte le plaisir d’accueillir et de partager une cuisine de saison." : "Comprendre votre projet, poser les bonnes questions, proposer une direction. Cette entreprise imaginaire illustre une relation simple et attentive, du premier échange jusqu’aux derniers détails."}</p></div></section><section id="contact" className="demo-contact"><div className="t-container"><div><p className="t-eyebrow">FAISONS CONNAISSANCE</p><h2>Et si on en parlait ?</h2><p>Ville d’exemple · France<br />contact@{demo.slug}.example<br />Coordonnées fictives, aucune prise de contact réelle.</p></div><DemoContactForm /></div></section><footer className="demo-footer t-container"><strong>{demo.name} · Entreprise fictive</strong><span>Photographie d’illustration : <a href={demo.credit} target="_blank" rel="noopener noreferrer">{demo.photographer} / Pexels</a>. Aucun lien avec une entreprise ou une clientèle réelle.</span><Link href="/#exemples">Retour aux exemples Tadapo</Link></footer></main></>;
}
