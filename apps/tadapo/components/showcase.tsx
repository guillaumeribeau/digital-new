"use client";
import { useRef, useState } from "react";
import { useShowcaseMotion } from "./animation/use-showcase-motion";
import Link from "next/link";
import { ArrowUpRight, ArrowLeft, ArrowRight, Monitor, Smartphone } from "lucide-react";
import { demos } from "@tadapo/lib/demos";
import { SitePreview } from "./site-preview";
export function WebsiteShowcase() {
  const root = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState(0);
  const [mobile, setMobile] = useState(false);
  const demo = demos[selected];
  const { capture } = useShowcaseMotion(root, selected, mobile);
  function chooseDevice(next: boolean) { if (next !== mobile) { capture(); setMobile(next); } }
  return <section ref={root} id="exemples" className="showcase-section t-section"><div className="t-container"><div className="section-heading split-heading"><div><p className="t-eyebrow">PAS LE MÊME MÉTIER. PAS LE MÊME SITE.</p><h2>Et si c’était<br /><span>le vôtre ?</span></h2></div><p>Trois métiers, trois personnalités.<br />Une idée de ce qu’on pourrait imaginer pour vous.</p></div><div className="showcase-toolbar"><div role="group" className="showcase-tabs" aria-label="Choisir un exemple">{demos.map((item, index) => <button aria-pressed={selected === index} key={item.slug} onClick={() => setSelected(index)}>{item.category}<span>0{index + 1}</span></button>)}</div><div className="showcase-navigation"><button aria-label="Exemple précédent" onClick={() => setSelected((selected + demos.length - 1) % demos.length)}><ArrowLeft size={17} /></button><span>0{selected + 1} / 0{demos.length}</span><button aria-label="Exemple suivant" onClick={() => setSelected((selected + 1) % demos.length)}><ArrowRight size={17} /></button></div><div className="device-toggle" role="group" aria-label="Format de l’aperçu"><button aria-label="Aperçu ordinateur" aria-pressed={!mobile} onClick={() => chooseDevice(false)}><Monitor size={19} /></button><button aria-label="Aperçu mobile" aria-pressed={mobile} onClick={() => chooseDevice(true)}><Smartphone size={19} /></button></div></div><div className={`showcase-stage showcase-${demo.tone}${mobile ? " is-mobile" : ""}`}><Link className="showcase-screen" href={`/exemples/${demo.slug}`} aria-label={`Explorer le site ${demo.name}`} key={demo.slug}><SitePreview demo={demo} mobile={mobile} /></Link><span className="showcase-annotation">Un univers à vous.<br />Jusqu’au dernier pixel.</span></div><div className="showcase-caption"><div aria-live="polite"><strong>{demo.name}</strong><span>{demo.sector} · Démonstration fictive</span></div><Link className="t-text-link" href={`/exemples/${demo.slug}`}>Explorer ce site <ArrowUpRight size={19} /></Link></div><p className="showcase-disclaimer">Ces trois entreprises sont fictives. Les images sont illustratives et les formulaires des démonstrations ne transmettent aucun message.</p></div></section>;
}
