import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Flower2, Leaf, Sprout, Trees } from "lucide-react";
export function HeroSitePreview() {
  return (
    <div
      className="rx-mini-site"
      aria-label="Aperçu React d’un site fictif de paysagiste"
    >
      <div className="rx-mini-nav rx-piece">
        <Link className="rx-mini-logo" href="/exemples/paysagiste">
          <Flower2 size={25} strokeWidth={1.2} />
          <span>
            Les Jardins
            <br />
            <b>d’Arthur</b>
          </span>
        </Link>
        <nav aria-label="Navigation de l’aperçu paysagiste">
          <Link href="/exemples/paysagiste#savoir-faire">Savoir-faire</Link>
          <Link href="/exemples/paysagiste#regard">Notre regard</Link>
        </nav>
        <Link className="rx-mini-nav-cta" href="/exemples/paysagiste#contact">
          Votre projet <ArrowUpRight size={11} />
        </Link>
      </div>
      <div className="rx-mini-hero">
        <div className="rx-mini-copy rx-piece">
          <p>PAYSAGES & JARDINS À VIVRE</p>
          <h2>
            Le jardin,
            <br />
            une autre façon
            <br />
            <em>d’habiter.</em>
          </h2>
          <p className="rx-mini-description">
            Des espaces sensibles et vivants.
            <br />
            Des lieux où l’on aime rester.
          </p>
        </div>
        <div className="rx-mini-photo rx-piece">
          <Image
            src="/examples/paysagiste/hero.jpg"
            alt="Jardin paysager verdoyant autour d’une maison, photographie d’illustration"
            fill
            sizes="(max-width:767px) 48vw, 30vw"
            preload
          />
          <span>LE GOÛT DES LIEUX.</span>
        </div>
        <Link
          className="rx-mini-button rx-piece"
          href="/exemples/paysagiste#contact"
        >
          Imaginons votre jardin <ArrowUpRight size={13} />
        </Link>
        <span className="rx-mini-seal rx-piece" aria-hidden="true">
          <Flower2 size={22} strokeWidth={1} />
          <span>
            PENSÉ POUR
            <br />
            ÊTRE VÉCU
          </span>
        </span>
      </div>
      <div className="rx-mini-services">
        {[
          {
            Icon: Sprout,
            title: "Imaginer",
            text: "Concevoir un jardin à votre image.",
          },
          {
            Icon: Trees,
            title: "Aménager",
            text: "Donner forme à vos espaces extérieurs.",
          },
          {
            Icon: Leaf,
            title: "Entretenir",
            text: "Accompagner le vivant au fil des saisons.",
          },
        ].map(({ Icon, title, text }, i) => (
          <div className="rx-mini-service rx-piece" key={title}>
            <div>
              <span>0{i + 1}</span>
              <Icon size={17} strokeWidth={1.2} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="rx-mini-footer rx-piece">
        <span>LES JARDINS D’ARTHUR · EXEMPLE FICTIF</span>
        <Link href="/exemples/paysagiste">
          Parcourir ce site <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
}
