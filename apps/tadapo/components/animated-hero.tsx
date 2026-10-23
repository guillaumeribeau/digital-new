"use client";
import { useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { useHeroMotion } from "./animation/use-hero-motion";
import { Spark } from "./logo";
import { SitePreview } from "./site-preview";
import { demos } from "@tadapo/lib/demos";


export function AnimatedHero() {
  const root = useRef<HTMLElement>(null);
  useHeroMotion(root);

  return <section ref={root} className="t-hero" aria-labelledby="hero-title"><div className="t-container hero-inner">
    <div className="hero-copy"><p className="t-eyebrow"><span className="status-dot" /> LE GRAND DÉPART, SANS LE GROS BUDGET.</p><h1 id="hero-title"><span className="hero-heading-line">Votre site pro.</span><span className="hero-heading-line"><span className="hero-zero">0 €<svg viewBox="0 0 250 30" aria-hidden="true"><path d="M4 20Q110-3 245 14M20 27Q135 7 228 23" /></svg></span> de frais</span><span className="hero-heading-line">de création<span className="coral">.</span></span></h1><p className="hero-description">Vous avez le savoir-faire.<br />On lui donne une belle adresse sur internet.</p><div className="hero-actions"><Link className="t-button" href="/commande">Je crée mon site <ArrowUpRight size={19} /></Link><a className="t-text-link" href="#tarifs">Voir les offres <ArrowDown size={16} /></a></div><p className="hero-price-note">Dès 39 € HT/mois · engagement 12 mois<br /><span>Ou dès 49 € HT/mois sans engagement.</span></p><Link className="hero-redesign" href="/commande">Déjà un site ? Préparons sa nouvelle version <ArrowUpRight size={13} /></Link><div className="hero-assurances"><span><Check size={14} /> Design personnalisé</span><span><Check size={14} /> Hébergement inclus</span></div></div>
    <div className="hero-stage"><div className="hero-parallax"><div className="hero-wordmark" aria-hidden="true">{"tadapo!".split("").map((letter, index) => <span key={index}>{letter}</span>)}</div><Spark className="hero-orbit" /><div className="hero-sticker"><strong>72h</strong><span>ouvrées pour votre<br />première version*</span></div><div className="hero-screen"><SitePreview demo={demos[0]} preload /></div><div className="hero-tablet" aria-hidden="true"><SitePreview demo={demos[0]} /></div><div className="hero-phone" aria-hidden="true"><SitePreview demo={demos[0]} mobile /></div><div className="hero-tags"><span>Design personnalisé</span><span>Adapté au mobile</span><span>Préparé pour le référencement</span></div><div className="hero-price-reveal" inert aria-hidden="true"><span>ET TADAPO.</span><strong>0 €<Spark /></strong><p>de frais de création.<br />Une formule qui vous va.</p><div><a href="#tarifs">Essentiel dès 39 € HT/mois <ArrowUpRight size={15} /></a><a href="#tarifs">Business dès 69 € HT/mois <ArrowUpRight size={15} /></a></div><small>Avec engagement 12 mois · mensualités récurrentes</small></div></div></div>
    <div className="hero-bottom"><span><ArrowDown size={15} /> Faites défiler. Votre site prend vie.</span><span>01 — L’IDÉE / 02 — LE DESIGN / 03 — LA VIE / 04 — TADAPO !</span><div className="scene-track"><i className="scene-progress" /></div></div>
  </div></section>;
}
