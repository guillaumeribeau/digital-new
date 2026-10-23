"use client";
import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP, Flip, ScrollTrigger);

export function useShowcaseMotion(root: RefObject<HTMLElement | null>, selected: number, mobile: boolean) {
  const state = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const stageHeight = useRef(0);
  const previous = useRef({ selected, mobile });
  const { contextSafe } = useGSAP({ scope: root });
  function capture() { contextSafe(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const screen = root.current.querySelector<HTMLElement>(".showcase-screen");
    if (screen) state.current = Flip.getState(screen, { props: "borderRadius,borderWidth" });
    stageHeight.current = root.current.querySelector<HTMLElement>(".showcase-stage")?.offsetHeight || 0;
  })(); }
  useGSAP(() => {
    const changedDemo = previous.current.selected !== selected;
    const changedDevice = previous.current.mobile !== mobile;
    previous.current = { selected, mobile };
    if (!changedDemo && !changedDevice) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { state.current = null; return; }
    const stage = root.current?.querySelector<HTMLElement>(".showcase-stage");
    if (changedDevice && state.current) {
      Flip.from(state.current, { scale: true, duration: .75, ease: "power3.inOut", onComplete: () => { ScrollTrigger.refresh(); } });
      state.current = null;
      if (stage && stageHeight.current && stage.offsetHeight !== stageHeight.current) {
        gsap.fromTo(stage, { height: stageHeight.current }, { height: stage.offsetHeight, duration: .75, ease: "power3.inOut", clearProps: "height", onComplete: () => { ScrollTrigger.refresh(); } });
      }
    }
    if (changedDemo) {
      gsap.from(".showcase-screen", { y: 32, rotationY: -12, opacity: .15, scale: .95, duration: .7, ease: "power3.out", clearProps: "transform,opacity" });
      gsap.from(".showcase-screen .preview-copy>*,.showcase-caption>div>*", { y: 12, opacity: 0, stagger: .055, duration: .5, clearProps: "transform,opacity" });
      gsap.from(".showcase-screen .preview-photo img", { scale: 1.08, duration: 1, ease: "power3.out", clearProps: "transform" });
    }
  }, { scope: root, dependencies: [selected, mobile], revertOnUpdate: true });
  return { capture };
}
