import Image from "next/image";
import photoCredits from "@/public/examples/credits.json";
import {
  Droplets,
  Leaf,
  Scissors,
  Compass,
  Sun,
  HeartHandshake,
} from "lucide-react";
import { DemoMenu } from "./demo-menu";
import { DemoForm } from "./demo-form";
import { examples, type ExampleSlug } from "@/lib/examples";
const icons = {
  plombier: Droplets,
  paysagiste: Leaf,
  coiffure: Scissors,
  conseil: Compass,
  "bien-etre": Sun,
  association: HeartHandshake,
};
export function DemoLogo({ slug }: { slug: ExampleSlug }) {
  const e = examples.find((e) => e.slug === slug)!;
  const Icon = icons[slug];
  return (
    <a
      className="example-logo"
      href="#accueil"
      aria-label={e.name + ", accueil"}
    >
      <Icon size={27} strokeWidth={1.5} />
      <span>
        {slug === "plombier" ? (
          <>
            Atelier Martin<small>PLOMBERIE</small>
          </>
        ) : slug === "paysagiste" ? (
          <>
            Les Jardins<small>D’ARTHUR</small>
          </>
        ) : slug === "coiffure" ? (
          <>
            Maison Camille<small>LE SALON</small>
          </>
        ) : slug === "conseil" ? (
          <>
            HORIZON<small>CONSEIL</small>
          </>
        ) : slug === "bien-etre" ? (
          <>
            Équilibre <i>&</i> Sens<small>ACCOMPAGNEMENT & BIEN-ÊTRE</small>
          </>
        ) : (
          <>
            ensemble<small>& DEMAIN</small>
          </>
        )}
      </span>
    </a>
  );
}
export function DemoHeader({
  slug,
  links,
  cta,
}: {
  slug: ExampleSlug;
  links: { label: string; href: string }[];
  cta: string;
}) {
  return (
    <header className="example-header">
      <div className="ex-container">
        <DemoLogo slug={slug} />
        <DemoMenu links={links} cta={cta} />
      </div>
    </header>
  );
}
export function Photo({
  slug,
  role = "hero",
  alt,
  className = "",
  preload = false,
  sizes = "(max-width: 767px) 100vw, 50vw",
}: {
  slug: ExampleSlug;
  role?: "hero" | "detail" | "about";
  alt: string;
  className?: string;
  preload?: boolean;
  sizes?: string;
}) {
  return (
    <div className={"ex-photo " + className}>
      <Image
        src={"/examples/" + slug + "/" + role + ".jpg"}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
      />
    </div>
  );
}
export function DemoContact({
  slug,
  title,
  intro,
  form = true,
}: {
  slug: ExampleSlug;
  title: string;
  intro: string;
  form?: boolean;
}) {
  return (
    <section id="contact" className="ex-contact">
      <div className="ex-container">
        <div className="ex-contact-copy">
          <p className="ex-kicker">FAISONS CONNAISSANCE</p>
          <h2>{title}</h2>
          <p>{intro}</p>
          <div className="ex-contact-details">
            <span>Coordonnées fictives pour cette démonstration</span>
            <strong>
              {slug === "coiffure"
                ? "Le salon vous accueille"
                : slug === "association"
                  ? "Retrouvons-nous"
                  : "Un premier échange, simplement"}
            </strong>
            <p>
              Ville d’exemple · France
              <br />
              contact@
              {slug === "plombier"
                ? "atelier-martin"
                : slug === "paysagiste"
                  ? "jardins-arthur"
                  : slug === "coiffure"
                    ? "maison-camille"
                    : slug === "conseil"
                      ? "horizon-conseil"
                      : slug === "bien-etre"
                        ? "equilibre-sens"
                        : "ensemble-demain"}
              .example
              <br />
              00 00 00 00 00 · numéro non actif
            </p>
          </div>
        </div>
        {form ? (
          <DemoForm slug={slug} />
        ) : (
          <div className="ex-contact-invitation">
            <span className="ex-kicker">À VOTRE RYTHME</span>
            <h3>
              Un temps pour vous.
              <br />
              Un espace pour échanger.
            </h3>
            <p>
              Un premier contact permet de parler de vos attentes et de choisir
              un accompagnement adapté.
            </p>
            <p className="ex-form-note">
              Démonstration uniquement : aucune réservation ni prise de contact
              réelle.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
export function DemoFooter({
  slug,
  links,
}: {
  slug: ExampleSlug;
  links: { label: string; href: string }[];
}) {
  const e = examples.find((e) => e.slug === slug)!;
  return (
    <footer className="example-footer">
      <div className="ex-container">
        <div className="ex-footer-top">
          <DemoLogo slug={slug} />
          <p>{e.tagline}</p>
          <nav aria-label="Navigation de pied de page">
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="ex-footer-bottom">
          <span>
            © {new Date().getFullYear()} {e.name} · Entreprise fictive
          </span>
          <span>Site de démonstration · Aucune prestation réelle</span>
          <details className="ex-credit-details">
            <summary>Crédits photographiques</summary>
            <p>
              Photographies d’illustration, sans lien avec les entreprises
              fictives. Les personnes représentées ne sont pas présentées comme
              leur équipe ou leurs clients.
            </p>
            <ul>
              {photoCredits
                .filter((p) => p.site === slug)
                .map((p) => (
                  <li key={p.file}>
                    <a href={p.page} target="_blank" rel="noopener noreferrer">
                      {p.description} — {p.author} / Pexels
                    </a>
                  </li>
                ))}
            </ul>
            <a
              href="https://www.pexels.com/license/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Licence Pexels
            </a>
          </details>
        </div>
      </div>
    </footer>
  );
}
