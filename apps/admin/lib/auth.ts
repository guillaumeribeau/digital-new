import { twoFactor } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDb } from "@nova/database";

let instance: ReturnType<typeof createAuth> | undefined;
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !baseURL) throw new Error("AUTH_NOT_CONFIGURED");
  const url = new URL(baseURL);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("HTTPS_REQUIRED");
  return betterAuth({
    appName: "Zelyweb Administration", baseURL, secret,
    plugins: [twoFactor({ issuer: "Zelyweb", skipVerificationOnEnable: false, accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 900 } })],
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    trustedOrigins: [url.origin], logger: { disabled: true },
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 14,
      autoSignIn: false },
    session: { additionalFields: { mfaVerifiedAt: { type: "date", required: false, input: false } }, expiresIn: 8 * 60 * 60, updateAge: 60 * 60,
      cookieCache: { enabled: false } },
    advanced: { cookiePrefix: "nova-admin", database: { generateId: "uuid" },
      useSecureCookies: url.protocol === "https:",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" } },
    rateLimit: { enabled: false }, // Atomic PostgreSQL limiter wraps every exposed POST.
    databaseHooks: { session: { create: { before: async (session) => {
      const admin = await getDb().adminUser.findUnique({ where: { userId: session.userId }, include: { user: true } });
      if (!admin?.active || admin.role !== "ADMIN") return false;
      return { data: { ...session, mfaVerifiedAt: admin.user.twoFactorEnabled ? new Date() : null } };
    } } } },
  });
}
export function getAuth() { return instance ??= createAuth(); }
