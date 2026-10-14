import { createHmac } from "node:crypto";
import { getDb } from "@nova/database";

export async function limitAuth(key: string, max = 10) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("AUTH_NOT_CONFIGURED");
  const hashed = createHmac("sha256", secret).update(key).digest("hex");
  const now = new Date(), expires = new Date(now.getTime() + 900000);
  const rows = await getDb().$queryRaw<{ count: number }[]>`
    INSERT INTO "AuthRateBucket" ("key", "count", "expiresAt") VALUES (${hashed}, 1, ${expires}::timestamptz)
    ON CONFLICT ("key") DO UPDATE SET "count" = CASE WHEN "AuthRateBucket"."expiresAt" <= ${now}::timestamptz
      THEN 1 ELSE "AuthRateBucket"."count" + 1 END,
      "expiresAt" = CASE WHEN "AuthRateBucket"."expiresAt" <= ${now}::timestamptz THEN ${expires}::timestamptz ELSE "AuthRateBucket"."expiresAt" END
    RETURNING "count"`;
  await getDb().authRateBucket.deleteMany({ where: { expiresAt: { lt: now } } });
  return rows[0].count <= max;
}
