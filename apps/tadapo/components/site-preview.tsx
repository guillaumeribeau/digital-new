import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { TadapoDemo } from "@tadapo/lib/demos";
import { demoPhotos } from "@tadapo/lib/demo-photos";
/** Compact, non-interactive versions of each demo for the homepage's device previews. */
export function SitePreview({ demo, mobile = false, preload = false }: { demo: TadapoDemo; mobile?: boolean; preload?: boolean }) {
  const isPollen = demo.tone === "pollen";
  const isAlba = demo.tone === "alba";
  const projects = isPollen ? [demoPhotos.dish, demoPhotos.restaurant, demoPhotos.terrace] : isAlba ? [demoPhotos.livingRoom, demoPhotos.bathroom, demoPhotos.meetingRoom] : [demoPhotos.house, demoPhotos.workspace, demoPhotos.bathroom];
  return <div className={`site-preview preview-${demo.tone}${mobile ? " preview-mobile" : ""}`}>
    <div className="preview-browser build-piece"><i /><i /><i /><span>{demo.slug}.example</span></div>
    <div className="preview-nav build-piece"><strong>{demo.name}</strong><span>{isPollen ? "La carte · Le lieu" : isAlba ? "Les projets · Le studio" : "Savoir-faire · Réalisations"}</span><span>{isPollen ? "Une table ?" : "Parlons-en"} <ArrowUpRight size={10} /></span></div>
    <div className="preview-content"><div className="preview-copy build-piece"><span>{demo.sector}</span><strong>{demo.title}</strong><p>{demo.description}</p><span className="preview-button">{isPollen ? "À la carte" : isAlba ? "Découvrir les projets" : "Préparer mon projet"} <ArrowUpRight size={11} /></span></div><div className="preview-photo build-piece"><Image src={demo.image} alt={demo.alt} width={900} height={900} preload={preload} sizes="(max-width: 700px) 80vw, 45vw" /><span className="preview-photo-label" aria-hidden="true">{isPollen ? "DU GOÛT. DU CŒUR." : isAlba ? "LE SENS DU LIEU" : "LES BONNES CONNEXIONS."}</span></div></div>
    <div className="preview-detail build-piece" aria-hidden="true"><span>{isPollen ? "L’album de pollen." : isAlba ? "Le carnet de projets" : "De l’idée au lieu de vie"}</span><div>{projects.map(photo => <Image key={photo.src} src={photo.src} alt="" width={320} height={180} sizes="20vw" />)}</div></div>
    <div className="preview-bottom build-piece"><span>{isPollen ? "Cuisine de saison" : isAlba ? "Lieux de vie" : "Rénovation"}</span><span>{isPollen ? "Le goût de cuisiner" : isAlba ? "Matières naturelles" : "Éclairage"}</span><span>{isPollen ? "Le plaisir d’accueillir" : isAlba ? "Intérieurs singuliers" : "Maison connectée"}</span></div>
  </div>;
}
