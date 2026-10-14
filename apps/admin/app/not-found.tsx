import Link from "next/link";
export default function NotFound() { return <main id="main" className="center-page"><section className="panel"><h1>Cette fiche est introuvable.</h1><p>Elle n’existe pas ou n’est plus disponible.</p><Link className="button" href="/demandes">Revenir aux demandes</Link></section></main>; }
