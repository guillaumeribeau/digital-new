"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Globe, MessageSquare, MousePointer2, Send, Sparkles } from "lucide-react";
import { brand } from "@/config/brand.config";
import "@/styles/project-journey.css";

const stages = [
  { title: "Vous nous racontez", text: "Votre métier, vos prestations, vos envies. Quelques informations pour démarrer.", label: "Votre demande", note: "Tout commence par votre activité.", Icon: Send },
  { title: "Votre site prend forme", text: "Votre site complet de cinq pages, gratuitement sur aperçu privé, sous sept jours ouvrés après réception des informations nécessaires.", label: "La proposition gratuite", note: "Une première direction, à découvrir avant de payer.", Icon: Sparkles },
  { title: "Vous gardez la main", text: "La première version vous plaît ? Vous payez la création, puis nous réalisons trois séries de retours regroupés sous 30 jours.", label: "Votre décision", note: "Vous décidez de la suite, en toute connaissance.", Icon: MessageSquare },
  { title: "Bienvenue sur le web", text: "Après les ajustements et votre validation, nous publions votre site. Vous activez l’abonnement depuis un e-mail après les ajustements ; nous publions sous 2 jours ouvrés après confirmation du premier paiement, si le domaine est prêt.", label: "La mise en ligne", note: "Votre activité a maintenant son adresse sur le web.", Icon: Globe },
];

export function ProjectJourney() {
  const root = useRef<HTMLElement>(null);
  const manualPosition = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const selectStage = (index: number) => {
    setActive(index);
    const scene = root.current?.querySelector(".pj-theatre");
    if (window.innerWidth < 768 && scene && scene.getBoundingClientRect().top < 90) {
      window.scrollTo({ top: window.scrollY + scene.getBoundingClientRect().top - 95, behavior: "instant" });
    }
    manualPosition.current = window.scrollY;
  };
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        ScrollTrigger.create({
          trigger: root.current,
          start: "top 75%",
          end: "bottom 65%",
          onUpdate: (self) => {
            if (manualPosition.current !== null) {
              if (Math.abs(window.scrollY - manualPosition.current) < 120) return;
              manualPosition.current = null;
            }
            setActive(Math.min(3, Math.floor(self.progress * 4)));
          },
        });
      });
      cleanup = () => media.revert();
    });
    return () => { cancelled = true; cleanup(); };
  }, []);

  return (
    <section ref={root} className="pj-section" data-step={active} aria-labelledby="pj-title" id="votre-parcours">
      <div className="container">
        <div className="pj-heading">
          <div><p className="pj-kicker">VOTRE PROJET, EN MOUVEMENT</p><h2 id="pj-title">Une idée au départ.<br /><span>Votre site à l’arrivée.</span></h2></div>
          <p>Vous savez toujours où vous allez.<br />Et nous avançons avec vous.</p>
        </div>
        <div className="pj-theatre" id="pj-scene" role="group" aria-label={stages[active].label}>
          <div className="pj-orbit pj-orbit-one" aria-hidden="true" /><div className="pj-orbit pj-orbit-two" aria-hidden="true" />
          <div className="pj-scene-top"><span><i /> DE L’IDÉE À LA MISE EN LIGNE</span><span>0{active + 1} / 04</span></div>
          <div className="pj-composition" aria-hidden="true">
            <div className="pj-brief pj-float">
              <span className="pj-object-icon"><Send size={20} /></span><small>LE POINT DE DÉPART</small><strong>Parlons de<br />votre activité.</strong>
              <div className="pj-brief-field"><span>Votre entreprise</span><b>Les Jardins d’Arthur</b></div>
              <div className="pj-brief-field"><span>Votre métier</span><b>Paysagiste passionné</b></div>
              <div className="pj-brief-send">Ma demande <ArrowUpRight size={16} /></div>
              <span className="pj-received"><Check size={14} /> Demande reçue</span>
            </div>
            <div className="pj-browser">
              <div className="pj-browser-bar"><span className="pj-dots"><i /><i /><i /></span><span>{active === 3 ? "votre-site.fr" : "Votre futur site"}</span><Globe size={12} /></div>
              <div className="pj-site">
                <div className="pj-site-nav"><b>Les Jardins<br />d’Arthur<span> PAYSAGISTE</span></b><span>Les jardins &nbsp; · &nbsp; Notre approche</span><span className="pj-site-contact">Parlons de votre jardin</span></div>
                <div className="pj-site-hero"><div className="pj-site-copy"><small>DE LA NATURE À L’ÉMOTION</small><strong>Un jardin.<br />Votre refuge.</strong><p>Des espaces vivants, imaginés pour vous.</p><span>Imaginons votre jardin <ArrowUpRight size={12} /></span></div><div className="pj-site-photo"><Image src="/examples/paysagiste/hero.jpg" alt="" fill sizes="(max-width: 767px) 45vw, 350px" /></div></div>
                <div className="pj-site-services"><span>01 <b>Imaginer</b></span><span>02 <b>Créer</b></span><span>03 <b>Entretenir</b></span></div>
              </div>
              <span className="pj-example">Illustration · Exemple fictif</span>
            </div>
            <div className="pj-free pj-float"><Sparkles size={18} /><strong>Première proposition</strong><span>Gratuite. À vous de choisir.</span></div>
            <div className="pj-feedback pj-float"><span className="pj-avatar">VOUS</span><p>« Cette direction me plaît.<br />Parlons de la suite ! »</p><span className="pj-feedback-reply"><Check size={14} /> On avance ensemble</span><MousePointer2 className="pj-pointer" size={28} fill="currentColor" /></div>
            <div className="pj-live pj-float"><span><Globe size={23} /></span><div><small>UNE NOUVELLE ADRESSE</small><strong>Votre site est en ligne.</strong><p>Prêt à accueillir vos futurs clients.</p></div><Check size={22} /></div>
            <div className="pj-colors"><i /><i /><i /><span>Votre univers</span></div>
          </div>
          <div className="pj-scene-caption"><span className="pj-caption-number">0{active + 1}</span><div><strong>{stages[active].label}</strong><p>{stages[active].note}</p></div><div className="pj-scene-progress" aria-hidden="true">{stages.map((stage, i) => <i key={stage.title} className={i <= active ? "is-filled" : ""} />)}</div></div>
        </div>
        <p className="pj-instruction">Explorez les étapes <span aria-hidden="true">↓</span></p>
        <div className="pj-cards" aria-label="Les étapes de votre prise en charge">
          {stages.map(({ title, text, Icon }, i) => <button type="button" key={title} className="pj-card" aria-pressed={active === i} aria-controls="pj-scene" onClick={() => selectStage(i)}><span className="pj-card-top"><span>0{i + 1}</span><Icon size={21} strokeWidth={1.5} /></span><h3>{title}</h3><p>{text}</p><span className="pj-card-foot">{i === 0 ? "Quelques minutes pour démarrer" : i === 1 ? "0 € pour la première proposition" : i === 2 ? `${brand.pricing.creation} € HT · 358,80 € TTC` : `${brand.pricing.monthly} € HT/mois · 34,80 € TTC`}</span></button>)}
        </div>
        <div className="pj-bottom"><p>La première proposition est gratuite.<br /><strong>La suite se décide avec vous.</strong></p><Link className="button primary" href="/demander-mon-site">Imaginer mon futur site <ArrowUpRight size={18} /></Link></div>
      </div>
    </section>
  );
}
