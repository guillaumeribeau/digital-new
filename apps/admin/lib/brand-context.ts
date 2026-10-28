import { getDb, type Prisma } from "@nova/database";
import { type Brand, brandOf } from "@nova/shared/brands";

export function adminBrand(headers: Headers): Brand {
  const value = headers.get("cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith("admin-brand="))?.split("=")[1];
  return value === "tadapo" ? "tadapo" : "zelyweb";
}
const impossible = "00000000-0000-0000-0000-000000000000";
export function brandFilter(model: string, brand: Brand): Record<string, unknown> | undefined {
  const lead = { brand };
  const project = { lead };
  const quote = { lead };
  switch (model) {
    case "Lead": case "ServiceTemplate": case "MessageTemplate": case "ManualPaymentReview": return { brand };
    case "Project": case "Conversation": case "Quote": return { lead };
    case "LeadFile": case "EmailVerificationToken": case "OutboxEvent": return { lead };
    case "ClientMessage": return { conversation: { lead } };
    case "PaymentAttempt": case "QuoteAccess": return { quote };
    case "SiteOrder": return { project };
    case "TadapoOrder": return brand === "tadapo" ? {} : { id: impossible };
    case "TadapoMail": case "TadapoFile": case "TadapoInvoice": case "TadapoFeedback": case "TadapoInboundEmail": return brand === "tadapo" ? {} : { id: impossible };
    case "CommercialEmail": return { brand };
    case "FinancialEvent": return { OR: [{ quote }, { order: { project } }] };
    case "BillingInvoice": return { OR: [{ quote }, { siteOrder: { project } }] };
    case "ActivityLog": case "InternalNote": return { OR: [{ lead }, { project }] };
    default: return undefined;
  }
}
/** Scope all reads/updates made from the operator workspace. Public token routes use explicit brand checks instead. */
export function workspaceDb(headers: Headers) {
  const brand = adminBrand(headers);
  return getDb().$extends({ query: { $allModels: { async $allOperations({ model, operation, args, query }) {
    const scope = brandFilter(model, brand);
    const input = args as { where?: Record<string, unknown>; data?: Record<string, unknown> | Record<string, unknown>[] };
    if (scope && ["findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy", "update", "updateMany", "delete", "deleteMany", "upsert"].includes(operation)) {
      input.where = { ...input.where, AND: [input.where || {}, scope] };
    }
    if (["ServiceTemplate", "MessageTemplate"].includes(model) && input.data && ["create", "createMany"].includes(operation)) {
      if (Array.isArray(input.data)) input.data = input.data.map(row => ({ ...row, brand })); else input.data = { ...input.data, brand };
    }
    return query(args);
  } } } }) as unknown as ReturnType<typeof getDb>;
}
export const settingsId = (brand: Brand) => brand === "zelyweb" ? "main" : "tadapo";
export async function requireLeadBrand(tx: Prisma.TransactionClient, id: string, brand: Brand) {
  await tx.lead.findUniqueOrThrow({ where: { id, brand: brandOf(brand) }, select: { id: true } });
}
