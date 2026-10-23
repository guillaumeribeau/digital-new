"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { tadapoMoney, tadapoPlans } from "@nova/shared/tadapo";
export function StickyOffer() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const hero = document.querySelector(".t-hero"); const footer = document.querySelector(".t-footer");
    if (!hero || !footer) return;
    const observer = new IntersectionObserver(() => { setVisible(hero.getBoundingClientRect().bottom < 90 && footer.getBoundingClientRect().top > window.innerHeight); }, { threshold: 0 });
    observer.observe(hero); observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  return visible ? <aside className="sticky-offer" aria-label="Les formules Tadapo"><div><strong>Dès {tadapoMoney(tadapoPlans.essentiel.monthlyCents["12"])} € HT/mois</strong><span>Engagement 12 mois · 0 € de création</span></div><Link className="t-button t-button-small" href="/#tarifs">Voir les offres <ArrowUpRight size={15} /></Link></aside> : null;
}
