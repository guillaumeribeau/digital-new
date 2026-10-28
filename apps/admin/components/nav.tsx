"use client";
import { switchBrand } from "../app/brand-actions";
import { type Brand } from "@nova/shared/brands";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, FolderKanban, Users, Globe2, CreditCard, Settings, LogOut, ArrowUpRight, MessagesSquare, FileText, Wallet, Send, BarChart3, Activity, ShieldCheck } from "lucide-react";
import { authClient, navigateSession } from "../lib/auth-client";
import { useState } from "react";
const items = [["/", "Tableau de bord", LayoutDashboard], ["/demandes", "Demandes", Inbox], ["/projets", "Projets", FolderKanban], ["/commandes-tadapo", "Commandes Tadapo", CreditCard],
  ["/clients", "Clients", Users], ["/echanges", "Échanges", MessagesSquare], ["/devis", "Devis", FileText], ["/paiements", "Paiements", Wallet], ["/sites", "Sites internet", Globe2], ["/abonnements", "Abonnements", CreditCard], ["/emails", "E-mails", Send], ["/audience", "Audience et clics", BarChart3], ["/campagnes", "Campagnes", BarChart3], ["/sante", "État des services", Activity], ["/securite", "Sécurité", ShieldCheck], ["/parametres", "Paramètres", Settings]] as const;
export function Nav({ name, brand }: { name: string; brand: Brand }) {
  const path = usePathname();
  const [error, setError] = useState("");
  return <aside className="sidebar"><Link href="/" className="brand-logo" aria-label={`${brand}, tableau de bord`}>{brand === "tadapo" ? <strong style={{ color: "#e15b2a", fontSize: 30 }}>tadapo.</strong> : <BrandLogo />}</Link><p className="workspace-label">ESPACE ADMINISTRATEUR</p>
    <form action={switchBrand} className="brand-switch"><label htmlFor="workspace-brand">Marque active</label><select id="workspace-brand" name="brand" defaultValue={brand}><option value="zelyweb">Zelyweb</option><option value="tadapo">Tadapo</option></select><button className="button secondary" type="submit">Ouvrir cet espace</button></form><nav aria-label="Navigation principale">{items.filter(([href]) => brand === "tadapo" ? !["/sites", "/abonnements", "/audience", "/campagnes"].includes(href) : href !== "/commandes-tadapo").map(([href, label, Icon]) => <Link key={href} href={href} aria-current={path === href || (href !== "/" && path.startsWith(href + "/")) ? "page" : undefined}><Icon size={19} /><span>{label}</span></Link>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-offer"><span className="eyebrow">{brand === "tadapo" ? "TADAPO" : "ZELYWEB"}</span><strong>Votre espace {brand === "tadapo" ? "Tadapo" : "Zelyweb"}</strong><p>Dossiers et communications de cette marque uniquement.</p></div><div className="user-card"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>Administrateur</small></div></div>
    <button className="logout" onClick={async () => { const result = await authClient.signOut(); if (result.error) setError("La déconnexion a échoué. Réessayez."); else navigateSession("/connexion"); }}><LogOut size={17} />Déconnexion<ArrowUpRight size={15} /></button>{error && <p role="alert">{error}</p>}</div>
  </aside>;
}
