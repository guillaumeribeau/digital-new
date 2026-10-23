import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TadapoLogo } from "./logo";
import { tadapo } from "@tadapo/lib/config";
export function TadapoFooter() {
  return <footer className="t-footer"><div className="t-container"><div className="footer-top"><div><TadapoLogo light /><p>Un site qui vous ressemble.<br />Et la suite, on s’en occupe.</p></div><nav aria-label="Navigation de pied de page"><Link href="/comment-ca-marche">Comment ça marche</Link><Link href="/#exemples">Les exemples</Link><Link href="/commande">Commander mon site</Link><Link href="/#decouvrir">La démo guidée</Link><Link href="/#tarifs">Les formules</Link><a href={`mailto:${tadapo.contact}`}>Écrivez-nous <ArrowUpRight size={15} /></a></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Tadapo · Une marque de Guillaume Ribeau EI</span><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/conditions-generales">Conditions générales</Link><Link href="/confidentialite">Confidentialité</Link><Link href="/cookies">Cookies</Link><Link href="/retractation">Rétractation</Link><Link href="/resiliation">Résiliation</Link><Link href="/domaine-hebergement">Domaine et hébergement</Link></nav></div><div className="footer-word" aria-hidden="true">tadapo.</div></div></footer>;
}
