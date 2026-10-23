"use client";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { tadapoMoney } from "@nova/shared/tadapo";
gsap.registerPlugin(useGSAP);
export function AnimatedAmount({ cents }: { cents: number }) {
  const element = useRef<HTMLSpanElement>(null);
  const displayed = useRef({ cents });
  useGSAP(() => {
    if (!element.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { displayed.current.cents = cents; element.current.textContent = tadapoMoney(cents); return; }
    element.current.textContent = tadapoMoney(Math.round(displayed.current.cents / 100) * 100);
    gsap.to(displayed.current, { cents, duration: .6, ease: "power2.out", overwrite: true,
      onUpdate: () => { if (element.current) element.current.textContent = tadapoMoney(Math.round(displayed.current.cents / 100) * 100); },
      onComplete: () => { if (element.current) element.current.textContent = tadapoMoney(cents); },
    });
  }, { dependencies: [cents] });
  return <span ref={element} className="animated-amount" aria-hidden="true">{tadapoMoney(cents)}</span>;
}
