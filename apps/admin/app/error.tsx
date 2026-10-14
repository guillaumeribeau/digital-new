"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="center-page"><section className="panel"><p className="eyebrow">SERVICE INDISPONIBLE</p><h1>Nous n’avons pas pu charger cette page.</h1><p>Vérifiez la connexion à la base et sa configuration. Aucune donnée de remplacement n’est affichée.</p><button className="button" onClick={reset}>Réessayer</button></section></main>;
}
