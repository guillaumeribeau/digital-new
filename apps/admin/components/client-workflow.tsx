"use client";
import { useEffect, useState, type ComponentProps } from "react";
import { ProjectWorkflow } from "./project-workflow";
import { DomainWorkflow } from "./domain-workflow";
export function ClientWorkflow({ id }: { id: string }) {
  const [error, setError] = useState("");
  const [view, setView] = useState<string | null>(null);
  const [data, setData] = useState<ComponentProps<typeof ProjectWorkflow>["data"]>();
  useEffect(() => { const load = () => { void fetch(`/api/client/sites/${id}/workflow`, { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error(); setData(await r.json()); setError(""); }).catch(() => setError("Le suivi des retours est temporairement indisponible. Actualisez la page ou contactez Guillaume par e-mail.")); }; load(); window.addEventListener("workflow-refresh", load); return () => window.removeEventListener("workflow-refresh", load); }, [id]);
  if (error) return <p className="notice error" role="alert">{error}</p>;
  const active = view || (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("parcours") === "domaine" ? "domaine" : "retours");
  return data ? <><nav className="commercial-row section-gap" aria-label="Suivi du projet"><button className="button secondary" aria-pressed={active === "retours"} onClick={() => setView("retours")}>Modifications du site</button><button className="button secondary" aria-pressed={active === "domaine"} onClick={() => setView("domaine")}>Nom de domaine</button></nav>{active === "domaine" ? <DomainWorkflow client id={id} data={data} /> : <ProjectWorkflow client id={id} data={data} />}</> : <p>Chargement de votre suivi…</p>;
}
