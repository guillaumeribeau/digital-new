import Link from "@/components/ui/tracked-link";
import { ConsentSettings } from "./consent";
import { ContactLink } from "./ui/contact-link";
import { Logo } from "./ui/logo";
import { brand } from "@/config/brand.config";
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <Link href="/" aria-label={"Accueil " + brand.name}>
          <Logo />
        </Link>
        <p>
          De belles idées.
          <br />
          De beaux sites. Tout simplement.
        </p>
        <div>
          <span className="eyebrow">PARTOUT EN FRANCE</span>
          <p><Link className="text-link" href="/conseils">Les conseils pour votre site</Link></p>
          <p>
            Artisans, commerçants, indépendants,
            <br />
            professions libérales et associations.
          </p>
          {brand.contactEmail && (
            <ContactLink href={"mailto:" + brand.contactEmail}>
              {brand.contactEmail}
            </ContactLink>
          )}
          {brand.phone && (
            <ContactLink href={"tel:" + brand.phone.replaceAll(" ", "")}>
              {brand.phone}
            </ContactLink>
          )}
          {brand.socialLinks.map((s) => (
            <a
              href={s.url}
              key={s.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {brand.name}
        </span>
        <nav aria-label="Informations légales">
          <Link href="/conditions-generales">Conditions de l’offre</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/politique-confidentialite">Confidentialité</Link>
          <Link href="/cookies">Cookies</Link>
          <ConsentSettings />
        </nav>
      </div>
    </footer>
  );
}
