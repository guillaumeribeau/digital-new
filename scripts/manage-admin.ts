import { loadEnvConfig } from "@next/env";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "better-auth/crypto";
import { getDb } from "@nova/database";
import { z } from "zod";
import { hiddenPassword } from "./password-prompt";
async function main() {
  loadEnvConfig(resolve("."));
  const operatorUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  loadEnvConfig(resolve("apps/admin"), undefined, undefined, true);
  if (operatorUrl || process.env.DIRECT_URL) process.env.DATABASE_URL = operatorUrl || process.env.DIRECT_URL;
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let email: string, operation: "desactiver" | "reactiver" | "mot-de-passe" | "reset-mfa";
  try {
    email = z.email().parse((await terminal.question("Adresse du compte concerné : ")).trim().toLowerCase());
    operation = z.enum(["desactiver", "reactiver", "mot-de-passe", "reset-mfa"]).parse(await terminal.question("Action (desactiver / reactiver / mot-de-passe / reset-mfa) : "));
    if (await terminal.question("Confirmez l’action en saisissant CONFIRMER : ") !== "CONFIRMER") throw new Error("CANCELLED");
  } finally { terminal.close(); }
  let password: string | undefined;
  if (operation === "mot-de-passe") {
    const value = z.string().min(14).max(128).parse(await hiddenPassword("Nouveau mot de passe (saisie masquée) : "));
    if (value !== await hiddenPassword("Confirmez le mot de passe : ")) throw new Error("PASSWORD_MISMATCH");
    password = await hashPassword(value);
  }
  await getDb().$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { email }, include: { admin: true } });
    if (!user.admin) throw new Error("NOT_ADMIN");
    await tx.session.deleteMany({ where: { userId: user.id } });
    if (operation === "desactiver" || operation === "reactiver") await tx.adminUser.update({ where: { id: user.admin.id }, data: { active: operation === "reactiver" } });
    if (operation === "reset-mfa") {
      await tx.twoFactor.deleteMany({ where: { userId: user.id } });
      await tx.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false } });
      await tx.verification.deleteMany({ where: { value: user.id } });
    }
    if (password) await tx.account.updateMany({ where: { userId: user.id, providerId: "credential" }, data: { password } });

  });
  console.log("Action enregistrée. Les sessions du compte ont été révoquées.");
}
main().catch(() => { console.error("Action refusée. Vérifiez les accès opérateur et les saisies."); process.exitCode = 1; })
  .finally(async () => { try { await getDb().$disconnect(); } catch { /* Configuration missing. */ } });
