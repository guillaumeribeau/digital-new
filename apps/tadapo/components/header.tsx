"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { TadapoLogo } from "./logo";
const links = [["Comment ça marche", "/comment-ca-marche"], ["Exemples", "/#exemples"], ["Tarifs", "/#tarifs"], ["FAQ", "/#faq"]];
export function TadapoHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nav.current?.querySelector("a")?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
      if (event.key !== "Tab") return;
      const items = [toggle.current, ...Array.from(nav.current?.querySelectorAll<HTMLAnchorElement>("a") || [])].filter(Boolean) as HTMLElement[];
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index === 0) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && index === items.length - 1) { event.preventDefault(); items[0]?.focus(); }
    }
    window.addEventListener("keydown", keyboard);
    const media = window.matchMedia("(min-width: 960px)");
    const resize = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", resize);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", keyboard); media.removeEventListener("change", resize); };
  }, [open]);
  return <header className="t-header"><div className="t-container t-header-inner"><TadapoLogo /><nav className="desktop-nav" aria-label="Navigation principale">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav><Link className="t-button t-button-small header-cta" href="/commande">Créer mon site <ArrowUpRight size={16} /></Link><button className="menu-toggle" ref={toggle} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>{open && <nav ref={nav} id="mobile-navigation" className="mobile-nav" aria-label="Navigation mobile">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link className="t-button" href="/commande" onClick={() => setOpen(false)}>Créer mon site <ArrowUpRight /></Link></nav>}</header>;
}
