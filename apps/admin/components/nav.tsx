"use client";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, FolderKanban, Users, Globe2, CreditCard, Settings, LogOut, ArrowUpRight, MessagesSquare, FileText, Wallet } from "lucide-react";
import { authClient, navigateSession } from "../lib/auth-client";
import { useState } from "react";
const items = [["/", "Tableau de bord", LayoutDashboard], ["/demandes", "Demandes", Inbox], ["/projets", "Projets", FolderKanban],
  ["/clients", "Clients", Users], ["/echanges", "Échanges", MessagesSquare], ["/devis", "Devis", FileText], ["/paiements", "Paiements", Wallet], ["/sites", "Sites internet", Globe2], ["/abonnements", "Abonnements", CreditCard], ["/parametres", "Paramètres", Settings]] as const;
export function Nav({ name }: { name: string }) {
  const path = usePathname();
  const [error, setError] = useState("");
  return <aside className="sidebar"><Link href="/" className="brand-logo" aria-label="Zelyweb, tableau de bord"><BrandLogo /></Link><p className="workspace-label">ESPACE ADMINISTRATEUR</p>
    <nav aria-label="Navigation principale">{items.map(([href, label, Icon]) => <Link key={href} href={href} aria-current={path === href || (href !== "/" && path.startsWith(href + "/")) ? "page" : undefined}><Icon size={19} /><span>{label}</span></Link>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-offer"><span className="eyebrow">L’OFFRE Zelyweb</span><strong>De belles idées.<br />De beaux sites.</strong><p>299 € HT + 29 € HT/mois</p></div><div className="user-card"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>Administrateur</small></div></div>
    <button className="logout" onClick={async () => { const result = await authClient.signOut(); if (result.error) setError("La déconnexion a échoué. Réessayez."); else navigateSession("/connexion"); }}><LogOut size={17} />Déconnexion<ArrowUpRight size={15} /></button>{error && <p role="alert">{error}</p>}</div>
  </aside>;
}
