"use client";
import { useState } from "react";
import { authClient, navigateSession } from "../lib/auth-client";
import { ArrowRight, ShieldCheck } from "lucide-react";
export function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.email({ email: String(data.get("email")), password: String(data.get("password")), rememberMe: false });
      if (result.error) setError("Connexion refusée ou temporairement indisponible. Vérifiez vos identifiants.");
      else navigateSession(result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect ? "/verification" : "/");
    } catch { setError("La connexion est temporairement indisponible."); }
    finally { setBusy(false); }
  }} className="login-form"><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} placeholder="vous@entreprise.fr" />
    <label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
    {error && <p className="notice error" role="alert">{error}</p>}<button className="button" disabled={busy}>{busy ? "Connexion…" : "Accéder à mon espace"}<ArrowRight size={18} /></button>
    <p className="login-security"><ShieldCheck size={16} />Accès réservé aux comptes autorisés.</p>
  </form>;
}
