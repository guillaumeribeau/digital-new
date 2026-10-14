"use client";
import { useState } from "react";
import type { ExampleSlug } from "@/lib/examples";
export function DemoForm({ slug }: { slug: ExampleSlug }) {
  const [notice, setNotice] = useState(false);
  return (
    <form
      className="ex-form"
      onSubmit={(e) => {
        e.preventDefault();
        setNotice(true);
      }}
    >
      <div className="ex-form-row">
        <label>
          Votre nom
          <input name="name" autoComplete="off" placeholder="Nom et prénom" />
        </label>
        <label>
          Votre e-mail
          <input
            name="email"
            type="email"
            autoComplete="off"
            placeholder="vous@exemple.fr"
          />
        </label>
      </div>
      <label>
        {slug === "association"
          ? "Ce qui vous donne envie de participer"
          : slug === "plombier"
            ? "Parlez-nous de votre besoin"
            : "Quelques mots sur votre projet"}
        <textarea
          name="message"
          rows={4}
          placeholder={
            slug === "plombier"
              ? "Une réparation, une installation, une rénovation…"
              : "Votre envie, votre question, votre besoin…"
          }
        />
      </label>
      <button
        className="ex-button"
        type="button"
        onClick={() => setNotice(true)}
      >
        {slug === "plombier"
          ? "Demander un devis"
          : slug === "association"
            ? "Rejoindre le mouvement"
            : "Envoyer mon message"}
      </button>
      <p className="ex-form-note">
        Formulaire de démonstration. Aucune donnée n’est envoyée ni enregistrée.
      </p>
      {notice && (
        <p className="ex-demo-feedback" role="status">
          Ceci est un exemple fictif. Aucun message n’a été transmis.
        </p>
      )}
    </form>
  );
}
