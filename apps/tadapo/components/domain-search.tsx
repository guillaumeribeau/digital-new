"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { DomainLookup } from "@tadapo/lib/domain";
export function DomainSearch({ domain }: { domain: string }) {
  const [result, setResult] = useState<DomainLookup | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);
  async function search() {
    const id = ++latest.current;
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/domains?domain=${encodeURIComponent(domain.trim())}`, { cache: "no-store", signal: AbortSignal.timeout(12000) });
      const data = await response.json();
      if (id !== latest.current) return;
      if (!response.ok) throw new Error(data.error || "La recherche est indisponible.");
      setResult(data);
    } catch (reason) { if (id === latest.current) setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "La recherche a expiré. Réessayez."); }
    finally { if (id === latest.current) setBusy(false); }
  }
  const visible = result?.domain === domain.trim().toLowerCase() ? result : null;
  return <div className="domain-search"><button type="button" className="t-button t-button-outline" onClick={search} disabled={busy || !domain.trim()}>{busy ? "Vérification en cours…" : "Vérifier ce domaine"}</button><div aria-live="polite">{error && <p className="field-error">{error}</p>}{visible && <div className="order-info"><strong>{visible.status === "available" ? "Disponible lors de cette vérification" : visible.status === "unavailable" ? "Indisponible à l’enregistrement chez Vercel" : "Vérification auprès d’un autre fournisseur nécessaire"}</strong>{visible.status === "available" && <p>Tarif fournisseur : {visible.registrationUsd?.toLocaleString("fr-FR")} USD pour la première année ; renouvellement : {visible.renewalUsd?.toLocaleString("fr-FR")} USD/an.{visible.premium && " Domaine premium."} Le prix HT en euros et votre supplément éventuel seront confirmés avant commande. Aucune conversion ni facturation n’est effectuée ici.</p>}{visible.status === "manual" && <p>Cette extension n’est pas vendue par Vercel. Cela ne signifie pas que le domaine est pris. Il peut être enregistré auprès d’un autre fournisseur et raccordé au site hébergé sur Vercel.</p>}<p>Cette recherche ne réserve rien. Vérifié le {new Date(visible.checkedAt).toLocaleDateString("fr-FR")}.</p></div>}</div><p className="order-privacy">Seul le nom recherché est transmis à Vercel. <Link href="/domaine-hebergement">Domaine, hébergement et renouvellement</Link></p></div>;
}
