"use client";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
export function DemoMenu({
  links,
  cta,
}: {
  links: { label: string; href: string }[];
  cta: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <>
      <nav
        className="ex-desktop-menu"
        aria-label="Navigation du site de démonstration"
      >
        {links.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
      <a className="ex-button ex-header-cta" href="#contact">
        {cta}
      </a>
      <button
        ref={button}
        className="ex-menu-toggle"
        aria-expanded={open}
        aria-controls="example-mobile-menu"
        aria-label={open ? "Fermer la navigation" : "Ouvrir la navigation"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav
          ref={menu}
          id="example-mobile-menu"
          className="ex-mobile-menu"
          aria-label="Navigation mobile du site de démonstration"
        >
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a
            className="ex-button"
            href="#contact"
            onClick={() => setOpen(false)}
          >
            {cta}
          </a>
        </nav>
      )}
    </>
  );
}
