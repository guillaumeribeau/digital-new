"use client";
import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Four reversible scenes. The copy and the main CTA remain usable throughout. */
export function useHeroMotion(root: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
      entrance.from(".hero-heading-line", { yPercent: 35, rotation: -2, opacity: 0, stagger: .1, duration: .95, ease: "back.out(1.35)" })
        .from(".hero-wordmark span", { yPercent: 120, rotation: -30, scale: .4, stagger: .055, duration: 1.25, ease: "elastic.out(1,.7)" }, .05)
        .from(".hero-orbit path", { scale: .25, rotation: -120, transformOrigin: "50% 50%", duration: 1.3, ease: "back.out(1.8)" }, .05)
        .from(".hero-sticker strong", { scale: .4, y: -15, rotation: -25, opacity: 0, duration: 1.1, ease: "elastic.out(1,.65)" }, .2)
        .from(".hero-description,.hero-actions,.hero-price-note,.hero-redesign,.hero-assurances", { y: 18, opacity: 0, stagger: .07, duration: .65 }, .3);
      root.current?.querySelectorAll<SVGPathElement>(".hero-zero path").forEach(path => {
        const length = path.getTotalLength();
        entrance.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: .7 }, .65);
      });
    });
    media.add("(min-width: 1024px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)", () => {
      const element = root.current;
      if (!element) return;
      const screen = element.querySelector<HTMLElement>(".hero-screen")!;
      const preview = screen.querySelector<HTMLElement>(".site-preview")!;
      const offer = element.querySelector<HTMLElement>(".hero-price-reveal")!;
      const finalBackground = getComputedStyle(preview).backgroundColor;
      const button = screen.querySelector<HTMLElement>(".preview-button")!;
      const buttonColor = getComputedStyle(button).color;
      gsap.set(".hero-stage", { perspective: 1100 });
      gsap.set(".hero-wordmark", { opacity: 1 });
      gsap.set(screen, { rotation: -8, scale: .86, y: 15, borderColor: "transparent", boxShadow: "0px 0px 0px #1e1b1a00" });
      gsap.set(preview, { overflow: "visible", backgroundColor: "transparent" });
      gsap.set(".hero-screen .preview-browser", { x: -75, y: -10, scaleX: .5, scaleY: 2.2, rotation: -12, backgroundColor: "#ff6f50", borderRadius: 40 });
      gsap.set(".hero-screen .preview-browser>*", { opacity: 0 });
      gsap.set(".hero-screen .preview-nav", { x: 35, y: -15, scale: .65, rotation: 14, backgroundColor: "#fff8f0", borderRadius: 35 });
      gsap.set(".hero-screen .preview-nav>*", { opacity: 0 });
      gsap.set(".hero-screen .preview-copy", { x: -65, y: 75, scale: .6, rotation: -13, backgroundColor: "#ffd86b", borderRadius: 28 });
      gsap.set(".hero-screen .preview-copy>:not(.preview-button)", { opacity: 0, y: 12 });
      gsap.set(".hero-screen .preview-photo", { x: 35, y: 15, scale: .48, borderRadius: "50%", rotation: 22, backgroundColor: "#ffd86b" });
      gsap.set(".hero-screen .preview-photo img", { opacity: 0, scale: 1.18 });
      gsap.set(button, { x: 130, y: -125, scale: 1.2, rotation: 22, color: "transparent", borderRadius: 25 });
      gsap.set(".hero-screen .preview-button svg", { opacity: 0 });
      gsap.set(".hero-screen .preview-bottom", { x: -45, y: 85, scaleX: .7, opacity: 0 });
      gsap.set(".hero-phone,.hero-tablet,.hero-tags", { opacity: 0, y: 65 });
      gsap.set(offer, { autoAlpha: 0, y: 28 });
      gsap.set(".hero-price-reveal>strong", { scale: .3, rotation: -16, transformOrigin: "20% 65%" });
      let interactive = false;
      const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: {
        id: "tadapo-hero", trigger: element, start: "top 84px", end: () => `+=${Math.min(2600, window.innerHeight * 2.5)}`,
        pin: true, scrub: .65, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => { element.dataset.heroProgress = self.progress.toFixed(3); },
      }, onUpdate: () => {
        const enabled = timeline.time() > 3.38;
        if (enabled !== interactive) { interactive = enabled; offer.inert = !enabled; offer.setAttribute("aria-hidden", String(!enabled)); }
      } });
      timeline.addLabel("materials", 0)
        .to(".scene-progress", { scaleX: 1, duration: 4.5, ease: "none" }, 0)
        .to(".hero-wordmark", { opacity: .08, scale: .75, x: -20, y: -15, duration: 1.15 }, .1)
        .to(".hero-orbit", { x: 90, y: -90, scale: .6, rotation: 150, duration: 1.6 }, .1)
        .to(".hero-sticker", { x: 22, y: -18, rotation: 22, scale: .82, duration: 1.3 }, .15)
        .addLabel("assemble", .35)
        .to(screen, { rotation: 0, scale: 1, x: 0, y: 0, borderColor: "#ffffff", boxShadow: "0px 15px 45px #4a38211c", duration: 1.3 }, "assemble")
        .to(preview, { backgroundColor: finalBackground, duration: .8 }, .85)
        .to(".hero-screen .build-piece", { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1, borderRadius: 0, stagger: .09, duration: 1.15 }, "assemble")
        .to(".hero-screen .preview-browser", { backgroundColor: "#ffffff", duration: .6 }, .85)
        .to(".hero-screen .preview-nav,.hero-screen .preview-copy", { backgroundColor: "transparent", duration: .6 }, .85)
        .to(".hero-screen .preview-browser>*,.hero-screen .preview-nav>*", { opacity: 1, stagger: .035, duration: .35 }, 1)
        .to(".hero-screen .preview-copy>:not(.preview-button)", { y: 0, opacity: 1, stagger: .06, duration: .5 }, 1.05)
        .to(button, { x: 0, y: 0, rotation: 0, scale: 1, borderRadius: 3, color: buttonColor, duration: .9 }, .75)
        .to(".hero-screen .preview-button svg", { opacity: 1, duration: .3 }, 1.35)
        .to(".hero-screen .preview-photo img", { opacity: 1, scale: 1, duration: .65 }, 1)
        .set(preview, { overflow: "clip" }, 1.65)
        .addLabel("responsive", 1.85)
        .to(screen, { scale: .78, x: -28, y: -36, rotationY: -11, rotationZ: -3, duration: .85 }, "responsive")
        .fromTo(".hero-phone", { x: 90, y: 110, rotation: -15, scale: .65 }, { x: 0, y: 0, scale: 1, opacity: 1, rotation: 7, duration: .85 }, "responsive+=.08")
        .fromTo(".hero-tablet", { x: -70, y: 80, rotation: 16, scale: .75 }, { x: 0, y: 0, scale: 1, opacity: 1, rotation: -6, duration: .8 }, "responsive+=.18")
        .to(".hero-tags", { opacity: 1, y: 0, duration: .5 }, 2.25)
        .from(".hero-tags span", { y: 15, stagger: .08, duration: .4 }, 2.25)
        .addLabel("offer", 3)
        .to(".hero-screen,.hero-phone,.hero-tablet", { scale: .45, x: -75, y: -90, rotationZ: -12, opacity: 0, duration: .65 }, "offer")
        .to(".hero-tags", { opacity: 0, y: -15, duration: .3 }, "offer")
        .to(".hero-orbit", { x: -55, y: -70, scale: 1.1, rotation: 250, opacity: .65, duration: 1 }, "offer")
        .to(offer, { autoAlpha: 1, y: 0, duration: .5 }, 3.25)
        .to(".hero-price-reveal>strong", { scale: 1, rotation: 0, duration: .8, ease: "back.out(1.65)" }, 3.25)
        .from(".hero-price-reveal>p,.hero-price-reveal>div,.hero-price-reveal>small", { y: 20, opacity: 0, stagger: .08, duration: .45 }, 3.5)
        .to(".hero-price-reveal .t-spark", { rotation: 95, duration: .85 }, 3.3)
        .to(".hero-zero", { scale: 1.04, duration: .35, repeat: 1, yoyo: true }, 3.6);
      return () => { delete element.dataset.heroProgress; offer.inert = true; offer.setAttribute("aria-hidden", "true"); };
    });
    media.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference), (max-height: 649px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.from(".hero-screen", { y: 60, rotation: 7, scale: .82, opacity: 0, duration: 1.25, delay: .15, ease: "power3.out" });
      const stage = root.current?.querySelector<HTMLElement>(".hero-stage");
      if (!stage) return;
      const assembly = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: {
        id: "tadapo-hero-compact", trigger: root.current,
        start: () => `top ${document.querySelector<HTMLElement>(".t-header")?.offsetHeight || 84}px`,
        end: () => `+=${Math.max(320, stage.getBoundingClientRect().top - root.current!.getBoundingClientRect().top + stage.offsetHeight * .55)}`,
        scrub: .45,
        invalidateOnRefresh: true,
      } });
      assembly.fromTo(".hero-screen .preview-nav", { y: -18, opacity: .5 }, { y: 0, opacity: 1, duration: .7 }, 0)
        .fromTo(".hero-screen .preview-copy", { x: -15, y: 20 }, { x: 0, y: 0, duration: 1 }, 0)
        .fromTo(".hero-screen .preview-photo", { x: 16, y: 18, scale: .7, borderRadius: "50%" }, { x: 0, y: 0, scale: 1, borderRadius: 0, duration: 1.2 }, 0)
        .fromTo(".hero-screen .preview-photo img", { scale: 1.2, opacity: .25 }, { scale: 1, opacity: 1, duration: 1 }, .1)
        .fromTo(".hero-screen .preview-button", { y: 20, scale: .85 }, { y: 0, scale: 1, duration: .7 }, .25)
        .fromTo(".hero-screen .preview-bottom", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, .45)
        .to(".hero-orbit", { rotation: 65, scale: .9, duration: 1.2 }, 0);
    });
    media.add("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const element = root.current;
      if (!element) return;
      const x = gsap.quickTo(".hero-parallax", "x", { duration: .9, ease: "power3.out" });
      const y = gsap.quickTo(".hero-parallax", "y", { duration: .9, ease: "power3.out" });
      const move = (event: PointerEvent) => { const box = element.getBoundingClientRect(); x(((event.clientX - box.left) / box.width - .5) * 14); y(((event.clientY - box.top) / box.height - .5) * 12); };
      const reset = () => { x(0); y(0); };
      element.addEventListener("pointermove", move); element.addEventListener("pointerleave", reset);
      return () => { element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", reset); };
    });
    return () => media.revert();
  }, { scope: root });
}
