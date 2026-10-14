"use client";
import { useEffect, useRef } from "react";
export function DemoMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let cleanup = () => {};
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          for (const section of root.current?.querySelectorAll(".ex-section") ||
            []) {
            gsap.fromTo(
              section,
              { y: window.innerWidth < 768 ? 10 : 25 },
              {
                y: 0,
                duration: 0.65,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 92%",
                  once: true,
                },
              },
            );
          }
        }, root);
        cleanup = () => ctx.revert();
      },
    );
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
  return <div ref={root}>{children}</div>;
}
