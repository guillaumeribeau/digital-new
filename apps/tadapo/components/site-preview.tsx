import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { TadapoDemo } from "@tadapo/lib/demos";
/** The same composition powers the hero, interactive previews and live demos. */
export function SitePreview({ demo, mobile = false, preload = false }: { demo: TadapoDemo; mobile?: boolean; preload?: boolean }) {
  return <div className={`site-preview preview-${demo.tone}${mobile ? " preview-mobile" : ""}`}>
    <div className="preview-browser build-piece"><i /><i /><i /><span>{demo.slug}.example</span></div>
    <div className="preview-nav build-piece"><strong>{demo.name}</strong><span>Notre savoir-faire</span><span>Parlons-en <ArrowUpRight size={10} /></span></div>
    <div className="preview-content"><div className="preview-copy build-piece"><span>{demo.sector}</span><strong>{demo.title}</strong><p>{demo.description}</p><span className="preview-button">Découvrir notre univers <ArrowUpRight size={11} /></span></div><div className="preview-photo build-piece"><Image src={demo.image} alt={demo.alt} width={900} height={900} preload={preload} sizes="(max-width: 700px) 80vw, 45vw" /></div></div>
    <div className="preview-bottom build-piece"><span>01 — Un savoir-faire</span><span>02 — Une rencontre</span><span>03 — Votre projet</span></div>
  </div>;
}
