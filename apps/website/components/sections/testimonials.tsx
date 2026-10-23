"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, Quote } from "lucide-react";

const testimonials = [
  {
    theme: "Un tarif accessible",
    quote:
      "Super service, simple et efficace. Et surtout un tarif vraiment accessible. Je recommande !",
  },
  {
    theme: "Un accompagnement clair",
    quote:
      "Je suis très contente du résultat. Je n’y connaissais absolument rien en création de site et tout m’a été expliqué clairement. Merci pour la patience et les conseils !",
  },
  {
    theme: "Une belle surprise",
    quote:
      "Honnêtement, pour le prix je ne m’attendais pas à un résultat aussi bien. Très bonne surprise 👍",
  },
  {
    theme: "Un projet en confiance",
    quote:
      "J’avais demandé plusieurs devis avant de me lancer et les prix étaient souvent bien au-dessus de mon budget. J’ai découvert Zelyweb et j’ai décidé de tenter l’expérience. Au départ j’avais quelques doutes, surtout avec un tarif aussi accessible, mais finalement tout s’est très bien passé. On a pris le temps de comprendre mon activité et de répondre à mes questions. Aujourd’hui j’ai un site qui me plaît et que je peux montrer à mes clients sans hésiter. Merci encore pour l’accompagnement.",
  },
  {
    theme: "De la disponibilité",
    quote: "Rapide, disponible et à l’écoute. Rien à redire, merci !",
  },
  {
    theme: "La technique en moins",
    quote:
      "Ce que j’ai aimé, c’est de ne pas avoir à gérer toute la partie technique. J’ai expliqué ce que je voulais, on m’a conseillé sur certains points et le résultat correspond bien à mon activité. Le tout sans exploser mon budget.",
  },
  {
    theme: "Des échanges fluides",
    quote:
      "Très satisfait de mon nouveau site. Les échanges ont été fluides du début à la fin. Je recommande sans hésitation.",
  },
  {
    theme: "Bien démarrer son activité",
    quote:
      "Je viens de lancer ma petite entreprise et je cherchais quelqu’un pour m’aider à avoir une présence sur internet sans y consacrer toutes mes économies. Je suis tombé sur Zelyweb un peu par hasard. J’ai apprécié qu’on m’explique les choses simplement, sans me noyer dans des termes techniques. Il y a eu quelques ajustements à faire sur le site, mais mes remarques ont été prises en compte. Au final je suis vraiment content du résultat et surtout du rapport qualité prix.",
  },
  {
    theme: "L’essentiel, simplement",
    quote:
      "Bonne expérience dans l’ensemble. Un joli site, des tarifs raisonnables et quelqu’un de disponible quand on a des questions. C’est ce que je recherchais.",
  },
];

export function Testimonials() {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const move = useCallback((direction: number) => {
    const element = track.current;
    if (!element || !element.firstElementChild) return;
    const step = element.firstElementChild.getBoundingClientRect().width +
      parseFloat(getComputedStyle(element).columnGap);
    const end = element.scrollWidth - element.clientWidth;
    let left = element.scrollLeft + direction * step;
    if (direction > 0 && element.scrollLeft >= end - 2) left = 0;
    if (direction < 0 && element.scrollLeft <= 2) left = end;
    element.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element || paused || hovered || focused) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(element);
    const timer = window.setInterval(() => {
      if (visible && !document.hidden && !motion.matches) move(1);
    }, 6000);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [paused, hovered, focused, move]);

  return (
    <section
      className="nh-section nh-testimonials"
      aria-labelledby="testimonials-title"
      aria-roledescription="carrousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="container">
        <div className="nh-heading">
          <div>
            <p className="nh-kicker">TÉMOIGNAGES</p>
            <h2 id="testimonials-title">
              Votre projet.
              <br />
              <span>Leurs mots.</span>
            </h2>
          </div>
          <p>
            L’accompagnement, le budget, la simplicité.
            <br />
            Ce qui compte dans un projet de site.
          </p>
        </div>
        <div className="nh-testimonial-controls">
          <span>9 témoignages à découvrir</span>
          <div>
            <button
              type="button"
              aria-label={paused ? "Activer le défilement automatique" : "Mettre le défilement en pause"}
              aria-controls="testimonial-track"
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button type="button" aria-label="Témoignage précédent" aria-controls="testimonial-track" onClick={() => move(-1)}>
              <ArrowLeft size={18} />
            </button>
            <button type="button" aria-label="Témoignage suivant" aria-controls="testimonial-track" onClick={() => move(1)}>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div className="nh-testimonial-grid" id="testimonial-track" ref={track} tabIndex={0} aria-label="Les neuf témoignages">
          {testimonials.map(({ theme, quote }, index) => (
            <div className="nh-testimonial-card" key={theme} role="group" aria-roledescription="diapositive" aria-label={`${index + 1} sur ${testimonials.length}`}>
              <Quote size={28} strokeWidth={1.4} aria-hidden="true" />
              <blockquote>
                <p>« {quote} »</p>
              </blockquote>
              <p className="nh-testimonial-theme">{theme}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
