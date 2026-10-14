import { getDb } from "@nova/database";
import { getAuth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export class AdminAccessError extends Error {
  constructor(public reason: "UNAUTHENTICATED" | "FORBIDDEN") { super(reason); }
}
export async function authenticate(requestHeaders: Headers) {
  // Do not open a database connection for anonymous page requests.
  if (!requestHeaders.get("cookie")?.includes("nova-admin")) throw new AdminAccessError("UNAUTHENTICATED");
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) throw new AdminAccessError("UNAUTHENTICATED");
  const db = getDb();
  const admin = await db.adminUser.findUnique({ where: { userId: session.user.id }, include: { user: true } });
  if (!admin || !admin.active || admin.role !== "ADMIN") throw new AdminAccessError("FORBIDDEN");
  const persisted = await db.session.findUnique({ where: { id: session.session.id } });
  if (!persisted || persisted.expiresAt <= new Date()) throw new AdminAccessError("UNAUTHENTICATED");
  return admin;
}
export async function requireAdmin() {
  try { return await authenticate(await headers()); }
  catch (error) {
    if (error instanceof AdminAccessError) {
      redirect("/connexion");
    }
    throw error;
  }
}
