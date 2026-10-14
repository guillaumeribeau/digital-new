"use client";
import { useEffect, useRef } from "react";
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          gsap.fromTo(
            root.current,
            { y: window.innerWidth < 768 ? 15 : 32 },
            {
              y: 0,
              duration: 0.75,
              ease: "power3.out",
              scrollTrigger: {
                trigger: root.current,
                start: "top 94%",
                once: true,
              },
            },
          );
        }, root);
        dispose = () => ctx.revert();
      },
    );
    return () => {
      cancelled = true;
      dispose();
    };
  }, []);
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
