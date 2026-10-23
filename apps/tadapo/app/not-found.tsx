import Link from "next/link";
import { TadapoHeader } from "@tadapo/components/header";
import { TadapoFooter } from "@tadapo/components/footer";
import { Spark } from "@tadapo/components/logo";
export default function NotFound() { return <><TadapoHeader /><main id="main" className="not-found"><Spark /><h1>Oups. Pas par ici.</h1><p>Votre prochaine bonne idée se trouve peut-être à l’accueil.</p><Link className="t-button" href="/">Retour à Tadapo</Link></main><TadapoFooter /></>; }
