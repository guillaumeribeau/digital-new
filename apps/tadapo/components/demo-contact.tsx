"use client";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
export function DemoContactForm() {
  const [message, setMessage] = useState(false);
  return <form className="demo-form" onSubmit={event => { event.preventDefault(); setMessage(true); }}><label>Votre nom<input name="name" autoComplete="off" placeholder="Votre nom" /></label><label>Votre adresse e-mail<input name="email" type="email" autoComplete="off" placeholder="vous@exemple.fr" /></label><label>Votre projet<textarea name="message" rows={4} placeholder="Quelques mots sur votre idée…" /></label><button className="demo-button" type="submit">Essayer le formulaire <ArrowUpRight size={17} /></button><p>Formulaire fictif : aucune donnée n’est conservée ou envoyée.</p>{message && <p role="status">Ceci est une démonstration. Aucun message n’a été envoyé.</p>}</form>;
}
