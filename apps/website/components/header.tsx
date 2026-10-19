"use client";
import Link from "@/components/ui/tracked-link";
import { brand } from "@/config/brand.config";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./ui/logo";
import { CTA } from "./ui/cta";
const nav = [
  ["Notre offre", "/notre-offre"],
  ["Exemples", "/exemples"],
  ["Comment ça marche", "/comment-ca-marche"],
  ["FAQ", "/faq"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    const links = panel.current?.querySelectorAll<HTMLElement>("a,button");
    links?.[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === "Tab" && links?.length) {
        const first = links[0],
          last = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          toggle.current?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          toggle.current?.focus();
        } else if (document.activeElement === toggle.current) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);
  return (
    <header className="header">
      <div className="header-inner">
        <Link
          href="/"
          aria-label={brand.name + ", accueil"}
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {nav.map(([label, url]) => (
            <Link
              aria-current={pathname === url ? "page" : undefined}
              key={url}
              href={url}
            >
              {label}
            </Link>
          ))}
        </nav>
        <CTA className="header-cta" placement="header">
          Mon futur site
        </CTA>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          ref={panel}
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Navigation mobile"
        >
          {nav.map(([label, url], i) => (
            <Link key={url} href={url} onClick={() => setOpen(false)}>
              <small>0{i + 1}</small>
              {label}
            </Link>
          ))}
          <div onClick={() => setOpen(false)}>
            <CTA placement="mobile-menu" />
          </div>
          <p>Votre site internet, on s’occupe de tout.</p>
        </nav>
      )}
    </header>
  );
}
