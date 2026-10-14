import { loadEnvConfig } from "@next/env";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "better-auth/crypto";
import { getDb } from "@nova/database";
import { z } from "zod";
import { hiddenPassword as hidden } from "./password-prompt";

async function main() {
  loadEnvConfig(resolve("."));
  const operatorUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  loadEnvConfig(resolve("apps/admin"), undefined, undefined, true);
  // Bootstrap uses operator credentials, not the restricted runtime login.
  if (operatorUrl || process.env.DIRECT_URL) process.env.DATABASE_URL = operatorUrl || process.env.DIRECT_URL;
  let input: { email: string; name: string; password: string; confirmation: string };
  if (process.argv.includes("--json-stdin")) {
    // The local graphical assistant sends credentials through an anonymous pipe,
    // never command-line arguments, environment variables or temporary files.
    let json = "";
    process.stdin.setEncoding("utf8");
    for await (const chunk of process.stdin) {
      json += chunk;
      if (json.length > 8192) throw new Error("INVALID_INPUT");
    }
    try { input = JSON.parse(json); } catch { throw new Error("INVALID_INPUT"); }
  } else {
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    let email: string, name: string;
    try {
      email = (await terminal.question("Adresse e-mail de l’administrateur : ")).trim();
      name = await terminal.question("Nom affiché : ");
    } finally { terminal.close(); }
    const password = await hidden("Mot de passe (14 caractères minimum, saisie masquée) : ");
    input = { email, name, password, confirmation: await hidden("Confirmez le mot de passe : ") };
  }
  const { email, name, password, confirmation } = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    name: z.string().trim().min(2).max(100),
    password: z.string().min(14).max(128),
    confirmation: z.string().max(128),
  }).parse(input);
  if (password !== confirmation) throw new Error("PASSWORD_MISMATCH");
  const hashed = await hashPassword(password);
  await getDb().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(762401)`;
    if (!process.argv.includes("--additional") && await tx.adminUser.count()) throw new Error("ADMIN_ALREADY_EXISTS");
    const user = await tx.user.create({ data: { name, email, emailVerified: true } });
    await tx.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: hashed } });
    await tx.adminUser.create({ data: { userId: user.id } });
  });
  console.log("Compte créé. Connectez-vous avec votre adresse e-mail et votre mot de passe.");
}
main().catch((error: unknown) => {
  const code = error instanceof z.ZodError ? "INVALID_INPUT" :
    error instanceof Error && ["INVALID_INPUT", "PASSWORD_MISMATCH", "ADMIN_ALREADY_EXISTS", "CANCELLED", "INTERACTIVE_TERMINAL_REQUIRED"].includes(error.message) ? error.message : "CREATION_FAILED";
  const explanations: Record<string, string> = {
    INVALID_INPUT: "Utilisez une adresse e-mail valide, un nom de 2 à 100 caractères et un mot de passe de 14 à 128 caractères.",
    PASSWORD_MISMATCH: "Les deux mots de passe saisis sont différents.",
    ADMIN_ALREADY_EXISTS: "Un compte administrateur existe déjà.",
    CANCELLED: "La saisie a été annulée.",
    INTERACTIVE_TERMINAL_REQUIRED: "Exécutez cette commande dans un terminal interactif.",
    CREATION_FAILED: "Vérifiez la connexion et les droits opérateur PostgreSQL.",
  };
  console.error(`Création refusée · ${code}. ${explanations[code]} Aucun secret n’est journalisé.`);
  process.exitCode = 1;
})
  .finally(async () => { try { await getDb().$disconnect(); } catch { /* Missing configuration. */ } });
