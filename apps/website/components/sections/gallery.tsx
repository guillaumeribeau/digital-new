"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "@/components/ui/tracked-link";
import { darkExampleSlugs, examples, exampleSectors } from "@/lib/examples";
import "@/styles/portfolio.css";
const sectors = exampleSectors;
export function Gallery({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [tone, setTone] = useState("all");
  const [sort, setSort] = useState("selection");
  useEffect(() => {
    if (compact) return;
    type Tool = {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<unknown>;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "filter_site_demonstrations",
            title: "Filtrer les exemples de sites",
            description:
              "Affiche les démonstrations fictives du secteur choisi dans la galerie. Ne crée pas de demande et ne transmet aucune donnée.",
            inputSchema: {
              type: "object",
              properties: { sector: { type: "string", enum: sectors } },
              required: ["sector"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: async (input: unknown) => {
              if (
                !input ||
                typeof input !== "object" ||
                !("sector" in input) ||
                typeof input.sector !== "string" ||
                !sectors.includes(input.sector)
              )
                throw new Error("Secteur non valide.");
              const sector = input.sector;
              setFilter(sector);
              setSearch("");
              setTone("all");
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                ),
              );
              return {
                sector,
                count: examples.filter(
                  (d) => sector === "Tous" || d.category === sector,
                ).length,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [compact]);
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  const selected = (compact ? examples.filter((_, index) => index < 3 || (index >= 6 && index < 9)) : examples).filter(
    (d) => (filter === "Tous" || d.category === filter)
      && (tone === "all" || darkExampleSlugs.includes(d.slug) === (tone === "dark"))
      && normalize(`${d.name} ${d.sector} ${d.description} ${d.type}`).includes(normalize(search.trim())),
  ).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "fr") : sort === "sector" ? a.sector.localeCompare(b.sector, "fr") : sort === "newest" ? examples.indexOf(b) - examples.indexOf(a) : examples.indexOf(a) - examples.indexOf(b));
  return (
    <div>
      {!compact && (
        <>
        <div
          className="filters"
          role="group"
          aria-label="Filtrer les démonstrations par secteur"
        >
          {sectors.map((s) => (
            <button
              key={s}
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="gallery-controls">
          <label>Rechercher un métier<input type="search" placeholder="Électricien, boulangerie…" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <label>Ambiance<select aria-label="Ambiance" value={tone} onChange={event => setTone(event.target.value)}><option value="all">Toutes les ambiances</option><option value="light">Claire</option><option value="dark">Sombre</option></select></label>
          <label>Trier par<select aria-label="Trier par" value={sort} onChange={event => setSort(event.target.value)}><option value="selection">Notre sélection</option><option value="newest">Nouveautés</option><option value="name">Nom de A à Z</option><option value="sector">Métier de A à Z</option></select></label>
        </div>
        <div className="gallery-results"><p role="status">{selected.length} exemple{selected.length > 1 ? "s" : ""} affiché{selected.length > 1 ? "s" : ""}</p>{(filter !== "Tous" || search || tone !== "all" || sort !== "selection") && <button type="button" onClick={() => { setFilter("Tous"); setSearch(""); setTone("all"); setSort("selection"); }}>Réinitialiser</button>}</div>
        </>
      )}
      <p className="sr-only" aria-live="polite">
        {selected.length} exemple{selected.length > 1 ? "s" : ""} affiché
        {selected.length > 1 ? "s" : ""}
      </p>
      <div className={"portfolio-grid " + (compact ? "portfolio-compact" : "")}>
        {selected.length === 0 && <p className="gallery-empty">Aucun exemple ne correspond à ces critères. Essayez un autre métier ou réinitialisez les filtres.</p>}
        {selected.map((d, i) => (
          <article
            className={
              "demo-card portfolio-project portfolio-" +
              d.theme +
              (!compact && i === 0 && filter === "Tous"
                ? " portfolio-featured"
                : "")
            }
            key={d.slug}
          >
            <Link
              href={"/exemples/" + d.slug}
              className="portfolio-preview"
              aria-label={"Explorer le site de démonstration " + d.name}
            >
              <div className="portfolio-preview-label">
                <span>{String(examples.indexOf(d) + 1).padStart(2, "0")} / SITE ONE-PAGE</span>
                <span>{d.type}</span>
              </div>
              <div className="portfolio-desktop">
                <Image
                  src={"/examples/previews/" + d.slug + "-desktop.webp"}
                  alt={"Capture du véritable site de démonstration " + d.name}
                  width={1440}
                  height={1000}
                  sizes={
                    compact
                      ? "(max-width:767px) 90vw, 30vw"
                      : "(max-width:767px) 90vw, 60vw"
                  }
                />
              </div>
              {!compact && (
                <div className="portfolio-mobile">
                  <Image
                    src={"/examples/previews/" + d.slug + "-mobile.webp"}
                    alt={"Aperçu mobile du même site " + d.name}
                    width={390}
                    height={844}
                    sizes="(max-width:767px) 23vw, 15vw"
                  />
                </div>
              )}
              <span className="portfolio-explore">Explorer ce site</span>
            </Link>
            <div className="portfolio-caption">
              <div>
                <p className="portfolio-sector">
                  {d.sector} <span>· Exemple fictif</span>
                </p>
                <h3>
                  <Link href={"/exemples/" + d.slug}>{d.name}</Link>
                </h3>
                {!compact && (
                  <p className="portfolio-description">{d.description}</p>
                )}
              </div>
              <div
                className="portfolio-palette"
                aria-label="Palette de couleurs"
              >
                {d.palette.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </div>
            </div>
            <Link
              className="portfolio-project-link"
              href={"/exemples/" + d.slug}
            >
              Explorer ce site<span aria-hidden="true">✳︎</span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
