"use client";
import { useEffect, useState, type ComponentProps } from "react";
import { ProjectWorkflow } from "./project-workflow";
export function ClientWorkflow({ id }: { id: string }) {
  const [error, setError] = useState("");
  const [data, setData] = useState<ComponentProps<typeof ProjectWorkflow>["data"]>();
  useEffect(() => { const load = () => { void fetch(`/api/client/sites/${id}/workflow`, { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error(); setData(await r.json()); setError(""); }).catch(() => setError("Le suivi des retours est temporairement indisponible. Actualisez la page ou contactez Guillaume par e-mail.")); }; load(); window.addEventListener("workflow-refresh", load); return () => window.removeEventListener("workflow-refresh", load); }, [id]);
  if (error) return <p className="notice error" role="alert">{error}</p>;
  return data ? <ProjectWorkflow client id={id} data={data} /> : <p>Chargement des retours…</p>;
}
