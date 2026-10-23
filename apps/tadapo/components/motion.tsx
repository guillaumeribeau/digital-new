"use client";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sectionEntrances, processNarrative, closingReveal } from "./animation/section-motion";
import { animateDetails } from "./animation/details-motion";
gsap.registerPlugin(useGSAP, ScrollTrigger);
export function Motion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP((context, contextSafe) => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      if (!root.current) return;
      sectionEntrances(root.current);
      processNarrative(root.current);
      closingReveal(root.current);
      return animateDetails(root.current, contextSafe!);
    });
    return () => media.revert();
  }, { scope: root });
  return <div ref={root}>{children}</div>;
}
