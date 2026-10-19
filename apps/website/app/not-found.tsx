import CommercialLayout from "./(commercial)/layout";
import Link from "@/components/ui/tracked-link";
export default function NotFound() {
  return (
    <CommercialLayout>
      <section className="container not-found">
        <span className="error-404" aria-hidden="true">
          404<span>✳︎</span>
        </span>
        <h1>
          Cette page a pris
          <br />
          un autre chemin.
        </h1>
        <p>Retrouvons le vôtre. Votre futur site vous attend.</p>
        <Link href="/" className="button">
          Revenir à l’accueil <span aria-hidden="true">✳︎</span>
        </Link>
      </section>
    </CommercialLayout>
  );
}
