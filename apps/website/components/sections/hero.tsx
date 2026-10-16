"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { CTA } from "../ui/cta";
import { HeroSitePreview } from "./hero-site-preview";
import { brand } from "@/config/brand.config";
import "@/styles/hero.css";
type Sequence = {
  restart: () => unknown;
  progress: (value: number) => unknown;
  pause: () => unknown;
};
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const sequence = useRef<Sequence | null>(null);
  const [animating, setAnimating] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const mm = gsap.matchMedia();
          mm.add(
            {
              desktop: "(min-width: 901px)",
              mobile: "(max-width: 900px)",
              reduce: "(prefers-reduced-motion: reduce)",
            },
            (context) => {
              const { desktop, reduce } = context.conditions!;
              if (reduce) {
                sequence.current = null;
                return;
              }
              const distance = desktop ? 1 : 0.25;
              const section = root.current!;
              const phase = (value: string) => {
                section.dataset.phase = value;
                const label = section.querySelector(".rx-build-state");
                if (label)
                  label.textContent =
                    {
                      compose: "Les idées prennent forme",
                      reveal: "Votre proposition, en vrai",
                      ready: "À vous de décider",
                    }[value] || value;
              };
              const intro = gsap.timeline({
                defaults: { ease: "power3.out" },
                onStart: () => setAnimating(true),
                onComplete: () => {
                  setAnimating(false);
                  phase("ready");
                },
              });
              sequence.current = intro;
              intro
                .call(() => phase("compose"), [], 0)
                .fromTo(
                  ".rx-word",
                  { y: desktop ? 55 : 18, rotate: desktop ? -4 : 0 },
                  { y: 0, rotate: 0, duration: 0.75, stagger: 0.065 },
                  0,
                )
                .fromTo(
                  ".rx-mini-nav",
                  { x: 65 * distance, y: -45 * distance, rotate: 5 * distance },
                  { x: 0, y: 0, rotate: 0, duration: 1.1 },
                  0.15,
                )
                .fromTo(
                  ".rx-mini-copy",
                  {
                    x: -90 * distance,
                    y: -25 * distance,
                    rotate: -6 * distance,
                  },
                  { x: 0, y: 0, rotate: 0, duration: 1.25 },
                  0.3,
                )
                .fromTo(
                  ".rx-mini-photo",
                  {
                    x: 85 * distance,
                    y: 55 * distance,
                    rotate: 8 * distance,
                    scale: 0.92,
                  },
                  { x: 0, y: 0, rotate: 0, scale: 1, duration: 1.5 },
                  0.25,
                )
                .fromTo(
                  ".rx-mini-button",
                  {
                    x: -70 * distance,
                    y: 80 * distance,
                    rotate: -8 * distance,
                  },
                  { x: 0, y: 0, rotate: 0, duration: 1.1 },
                  0.65,
                )
                .fromTo(
                  ".rx-mini-service",
                  {
                    y: 65 * distance,
                    x: (i: number) => (i - 1) * 35 * distance,
                    rotate: (i: number) => (i - 1) * 5 * distance,
                  },
                  { x: 0, y: 0, rotate: 0, duration: 1.2, stagger: 0.1 },
                  0.75,
                )
                .fromTo(
                  ".rx-mini-seal",
                  { scale: 0.7, rotate: -25 * distance },
                  { scale: 1, rotate: 0, duration: 1.1, ease: "back.out(1.5)" },
                  0.8,
                )
                .fromTo(
                  ".rx-mini-footer",
                  { y: 25 * distance },
                  { y: 0, duration: 1 },
                  1,
                )
                .call(() => phase("reveal"), [], 1.35)
                .fromTo(
                  ".rx-question",
                  { x: -10 },
                  { x: 0, duration: 0.65 },
                  1.35,
                )
                .fromTo(
                  ".rx-pay-word",
                  { y: 20, rotate: -2 },
                  { y: 0, rotate: 0, duration: 0.65, ease: "back.out(1.5)" },
                  1.65,
                )
                .fromTo(
                  ".rx-pay-underline",
                  { scaleX: 0 },
                  { scaleX: 1, duration: 0.6, ease: "power4.out" },
                  1.65,
                );
              if (desktop) {
                gsap.set(".rx-stage", {
                  rotation: -3,
                  scale: 0.92,
                  transformOrigin: "70% 35%",
                });
                gsap
                  .timeline({
                    scrollTrigger: {
                      trigger: ".rx-workbench",
                      start: "top 20%",
                      end: "bottom 58%",
                      scrub: 0.6,
                    },
                    defaults: { ease: "none" },
                  })
                  .to(
                    ".rx-stage",
                    { scale: 1.04, rotation: 0, x: -20, duration: 1 },
                    0,
                  )
                  .fromTo(
                    ".rx-stage-orbit",
                    { y: 0 },
                    { y: 12, duration: 1 },
                    0,
                  )
                  .to(".rx-blueprint", { opacity: 0.18, duration: 1 }, 0)
                  .fromTo(
                    ".rx-progress-fill",
                    { scaleX: 0.15 },
                    { scaleX: 1, duration: 1 },
                    0,
                  )
                  .fromTo(
                    ".rx-completion",
                    { y: 18, opacity: 0.18 },
                    { y: 0, opacity: 1, duration: 0.4 },
                    0.6,
                  );
              } else {
                gsap.fromTo(
                  ".rx-completion",
                  { y: 10, opacity: 0.3 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    scrollTrigger: {
                      trigger: ".rx-completion",
                      start: "top 92%",
                      once: true,
                    },
                  },
                );
                gsap.fromTo(
                  ".rx-progress-fill",
                  { scaleX: 0.2 },
                  {
                    scaleX: 1,
                    duration: 0.65,
                    scrollTrigger: {
                      trigger: ".rx-workbench",
                      start: "top 75%",
                      once: true,
                    },
                  },
                );
              }
              return () => {
                sequence.current = null;
              };
            },
          );
          cleanup = () => mm.revert();
        }, root);
        const dispose = cleanup;
        cleanup = () => {
          dispose();
          ctx.revert();
        };
      },
    );
    return () => {
      cancelled = true;
      sequence.current = null;
      cleanup();
    };
  }, []);
  const finish = () => {
    sequence.current?.progress(1);
    sequence.current?.pause();
    setAnimating(false);
  };
  return (
    <section className="rx-hero" ref={root} data-phase="ready">
      <div className="container rx-container">
        <div className="rx-topline">
          <p>
            <span aria-hidden="true">✳︎</span> CRÉATION DE SITES VITRINES POUR LES
            PROFESSIONNELS
          </p>
          <span>ON VOUS MONTRE. VOUS DÉCIDEZ.</span>
        </div>
        <div className="rx-composition">
          <h1 className="rx-headline">
            <span className="rx-first-line">
              {["On", "crée", "votre", "site."].map((word, i) => (
                <span className="rx-word" key={word}>
                  {word}
                  {i < 3 ? " " : ""}
                </span>
              ))}
            </span>
            <span className="rx-question">
              Il vous plaît ?
              <ArrowUpRight className="rx-question-mark" aria-hidden="true" />
            </span>
            <span className="rx-pay">
              <span className="rx-pay-word">Vous payez.</span>
              <span className="rx-pay-underline" aria-hidden="true" />
            </span>
          </h1>
          <div className="rx-promise">
            <p>
              Partout en France, découvrez une première version complète de
              votre site vitrine de cinq pages avant de payer. Nous la préparons
              gratuitement sous sept jours ouvrés après réception des informations
              nécessaires. Vous décidez ensuite de commander.
            </p>
            <div className="rx-actions">
              <CTA placement="hero">Découvrir mon futur site gratuitement</CTA>
              <Link href="/exemples">
                Voir des exemples <ArrowUpRight size={17} />
              </Link>
            </div>
            <ul className="rx-reassurance">
              <li>
                <Check size={13} />
                Première proposition gratuite
              </li>
              <li className="rx-rate">
                <span className="rx-rate-label">La création</span>
                <strong>
                  {brand.pricing.creation} € <small>HT</small>
                </strong>
                <span className="rx-rate-ttc">358,80 € TTC</span>
              </li>
              <li className="rx-rate">
                <span className="rx-rate-label">La gestion technique</span>
                <strong>
                  {brand.pricing.monthly} € <small>HT/mois</small>
                </strong>
                <span className="rx-rate-ttc">34,80 € TTC/mois</span>
              </li>
            </ul>
            <p className="rx-terms">
              Vous payez la création uniquement si vous commandez après
              validation de la première version complète. Abonnement à activer avant la publication, sans durée minimale.
            </p>
          </div>
          <div className="rx-zero" aria-hidden="true">
            <span>D’ABORD VOIR.</span>
            <strong>0 €</strong>
            <span>LA PREMIÈRE PROPOSITION</span>
          </div>
          <div className="rx-workbench">
            <div className="rx-workbench-label">
              <span>
                <i /> DE VOTRE IDÉE À VOTRE SITE
              </span>
              <span>EXEMPLE FICTIF / PAYSAGISTE</span>
            </div>
            <div className="rx-blueprint" aria-hidden="true" />
            <span
              className="rx-coordinate rx-coordinate-top"
              aria-hidden="true"
            >
              DESIGN / 01
            </span>
            <span
              className="rx-coordinate rx-coordinate-bottom"
              aria-hidden="true"
            >
              100 % À VOTRE IMAGE
            </span>
            <div className="rx-stage-orbit">
              <div className="rx-stage">
                <HeroSitePreview />
              </div>
            </div>
            <div className="rx-builder-bottom">
              <span className="rx-build-state">À vous de décider</span>
              <div className="rx-animation-controls">
                <button
                  type="button"
                  onClick={() => {
                    sequence.current?.restart();
                    setAnimating(true);
                  }}
                  aria-label="Rejouer la construction du site"
                >
                  <RotateCcw size={13} />
                  Rejouer
                </button>
                <button
                  type="button"
                  onClick={finish}
                  disabled={!animating}
                  aria-label="Terminer l’animation"
                >
                  <SkipForward size={13} />
                  Terminer
                </button>
              </div>
            </div>
            <div className="rx-progress" aria-hidden="true">
              <span className="rx-progress-fill" />
            </div>
          </div>
        </div>
        <div className="rx-completion">
          <span className="rx-completion-check">
            <Check size={20} />
          </span>
          <p>
            Vous validez.
            <br className="rx-mobile-break" />{" "}
            <strong>On s’occupe du reste.</strong>
          </p>
          <a href="#votre-site" aria-label="Découvrir la suite">
            <ArrowDown size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
