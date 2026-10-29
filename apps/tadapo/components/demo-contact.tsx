"use client";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
export function DemoContactForm({ kind = "project" }: { kind?: "project" | "table" }) {
  const [message, setMessage] = useState(false);
  return <form className="demo-form" onSubmit={event => { event.preventDefault(); setMessage(true); }}>
    <div className="d-form-row"><label>Votre nom<input name="name" autoComplete="off" placeholder="Camille Martin" /></label><label>Votre adresse e-mail<input name="email" type="email" autoComplete="off" placeholder="vous@exemple.fr" /></label></div>
    {kind === "table" && <div className="d-form-row"><label>Votre date<input name="date" type="date" /></label><label>À combien ?<select name="guests" defaultValue="2"><option value="1">1 personne</option><option value="2">2 personnes</option><option value="3">3 personnes</option><option value="4">4 personnes</option><option value="more">5 personnes ou plus</option></select></label></div>}
    <label>{kind === "table" ? "Une occasion, une envie particulière ?" : "Parlez-nous de votre projet"}<textarea name="message" rows={4} placeholder={kind === "table" ? "Un déjeuner à deux, une grande tablée…" : "Votre lieu, vos envies, ce que vous aimeriez changer…"} /></label>
    <button className="demo-button" type="submit">Essayer le formulaire <ArrowUpRight size={17} /></button><p>Formulaire fictif : aucune donnée n’est conservée ou envoyée.</p>{message && <p role="status">{kind === "table" ? "Ceci est une démonstration. Aucune réservation n’a été effectuée." : "Ceci est une démonstration. Aucun message n’a été envoyé."}</p>}
  </form>;
}
