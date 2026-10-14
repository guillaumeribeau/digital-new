import { getDb, Prisma, type Quote } from "@nova/database";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { authenticate } from "./access";
import { calculate, commercialLocal, CommercialError, digest, publicOrigin, quoteInput, replyAddress, seal, sender, snapshotSchema, type CommercialEmailPayload } from "./commercial-core";
import { quotePdf } from "./quote-pdf";

export const settingsInput = z.object({ legalName: z.string().trim().max(200), address: z.string().trim().max(1000),
  registrationNumber: z.string().trim().max(100), vatNumber: z.string().trim().max(100), taxNote: z.string().trim().max(1000),
  terms: z.string().trim().max(10000), validityDays: z.coerce.number().int().min(1).max(180), reminderDays: z.coerce.number().int().min(0).max(30) });
const queueData = (payload: CommercialEmailPayload, kind: string, relation: { messageId?: string; quoteId?: string }) => ({
  id: randomUUID(), ...relation, kind, payloadEncrypted: seal(payload), expiresAt: new Date(Date.now() + 23 * 3600000),
});
function configured() {
  sender(); publicOrigin();
  if (!commercialLocal() && (!process.env.RESEND_API_KEY || !process.env.COMMERCIAL_REPLY_DOMAIN)) throw new CommercialError("CONFIGURATION_REQUIRED");
}
export async function buildSnapshot(quote: Quote) {
  if (quote.snapshot) return snapshotSchema.parse(quote.snapshot);
  const db = getDb(), [settings, lead] = await Promise.all([db.commercialSettings.findUnique({ where: { id: "main" } }), db.lead.findUniqueOrThrow({ where: { id: quote.leadId } })]);
  if (!settings) throw new CommercialError("SELLER_REQUIRED");
  const result = snapshotSchema.safeParse({ number: quote.number, title: quote.title, createdAt: quote.createdAt.toISOString(), validUntil: quote.validUntil.toISOString(),
    deliveryTime: quote.deliveryTime, terms: quote.terms, seller: settings,
    buyer: { company: quote.billingName || lead.businessName, name: lead.fullName, email: lead.email, address: quote.billingAddress, registrationNumber: quote.billingRegistrationNumber, vatNumber: quote.billingVatNumber },
    items: quote.items, subtotalCents: quote.subtotalCents, taxCents: quote.taxCents, totalCents: quote.totalCents });
  if (!result.success) throw new CommercialError("SELLER_REQUIRED");
  return result.data;
}
export const commercialService = {
  async clients(headers: Headers, q = "", page = 1) {
    await authenticate(headers); q = z.string().max(200).parse(q); page = z.number().int().min(1).max(100000).parse(page);
    const where: Prisma.LeadWhereInput = q ? { OR: ["businessName", "fullName", "email"].map((field) => ({ [field]: { contains: q, mode: "insensitive" } })) } : {};
    const [rows, count] = await getDb().$transaction([getDb().lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 20, skip: (page - 1) * 20,
      select: { id: true, businessName: true, fullName: true, email: true, emailVerifiedAt: true, conversation: { select: { needsReply: true } }, _count: { select: { quotes: true } } } }), getDb().lead.count({ where })]);
    return { rows, count };
  },
  async client(headers: Headers, id: string) {
    await authenticate(headers);
    return getDb().lead.findUnique({ where: { id: z.uuid().parse(id) }, include: { project: true,
      conversation: { include: { messages: { orderBy: { createdAt: "desc" }, take: 100 } } },
      quotes: { orderBy: { createdAt: "desc" }, take: 100, include: { payments: { orderBy: { createdAt: "desc" }, take: 20 }, emails: { select: { status: true }, take: 1, orderBy: { createdAt: "desc" } } } },
    } });
  },
  async settings(headers: Headers) { await authenticate(headers); return getDb().commercialSettings.findUnique({ where: { id: "main" } }); },
  async saveSettings(headers: Headers, input: unknown) {
    await authenticate(headers); const data = settingsInput.parse(input);
    return getDb().$transaction(async (tx) => {
      const settings = await tx.commercialSettings.upsert({ where: { id: "main" }, create: { id: "main", ...data }, update: data });
      await tx.quote.updateMany({ where: { status: "SENT", reminderCount: { lt: 2 }, validUntil: { gt: new Date() } }, data: { nextReminderAt: data.reminderDays ? new Date(Date.now() + data.reminderDays * 86400000) : null } });
      return settings;
    });
  },
  async templates(headers: Headers) {
    await authenticate(headers);
    return { services: await getDb().serviceTemplate.findMany({ where: { active: true }, orderBy: { label: "asc" } }), messages: await getDb().messageTemplate.findMany({ where: { active: true }, orderBy: { label: "asc" } }) };
  },
  async saveTemplate(headers: Headers, input: unknown) {
    await authenticate(headers);
    const data = z.object({ kind: z.enum(["service", "message"]), label: z.string().trim().min(2).max(100), subject: z.string().trim().max(300).default(""), content: z.string().trim().min(2).max(2000), price: z.string().default("0"), taxBasisPoints: z.coerce.number().int().min(0).max(10000).default(0) }).parse(input);
    if (data.kind === "message") return getDb().messageTemplate.create({ data: { label: data.label, subject: data.subject || data.label, content: data.content } });
    const calculated = calculate([{ label: data.label, description: data.content, quantity: 1, unitPrice: data.price, taxBasisPoints: data.taxBasisPoints }]);
    return getDb().serviceTemplate.create({ data: { label: data.label, description: data.content, unitCents: calculated.lines[0].unitCents, taxBasisPoints: data.taxBasisPoints } });
  },
  async archiveTemplate(headers: Headers, id: string, kind: string) {
    await authenticate(headers); z.uuid().parse(id);
    if (kind === "service") await getDb().serviceTemplate.update({ where: { id }, data: { active: false } });
    else if (kind === "message") await getDb().messageTemplate.update({ where: { id }, data: { active: false } });
    else throw new CommercialError("INVALID_ACTION");
  },
  async message(headers: Headers, input: unknown) {
    const actor = await authenticate(headers); configured();
    const data = z.object({ leadId: z.uuid(), subject: z.string().trim().min(2).max(300), content: z.string().trim().min(2).max(20000), requestId: z.uuid() }).parse(input);
    return getDb().$transaction(async (tx) => {
      const lead = await tx.lead.findUniqueOrThrow({ where: { id: data.leadId } });
      if (!lead.emailVerifiedAt) throw new CommercialError("CLIENT_UNVERIFIED");
      const conversation = await tx.conversation.upsert({ where: { leadId: lead.id }, create: { leadId: lead.id, replyToken: randomBytes(24).toString("hex") }, update: {} });
      const existing = await tx.clientMessage.findUnique({ where: { id: data.requestId } });
      if (existing) {
        if (existing.conversationId !== conversation.id || existing.content !== data.content || existing.subject !== data.subject) throw new CommercialError("STALE_QUOTE");
        return existing;
      }
      const last = await tx.clientMessage.findFirst({ where: { conversationId: conversation.id, direction: "INBOUND" }, orderBy: { createdAt: "desc" } });
      const safeMessageId = last?.smtpMessageId && !/[\r\n]/.test(last.smtpMessageId) ? last.smtpMessageId : undefined;
      const message = await tx.clientMessage.create({ data: { id: data.requestId, conversationId: conversation.id, direction: "OUTBOUND", subject: data.subject, content: data.content, sender: sender() } });
      await tx.commercialEmail.create({ data: queueData({ from: sender(), to: [lead.email], subject: data.subject, text: data.content,
        reply_to: replyAddress(conversation.replyToken), ...(safeMessageId ? { headers: { "In-Reply-To": safeMessageId, References: safeMessageId } } : {}) }, "MESSAGE", { messageId: message.id }) });
      await tx.conversation.update({ where: { id: conversation.id }, data: { needsReply: false } });
      await tx.activityLog.create({ data: { actorId: actor.id, leadId: lead.id, action: "CLIENT_MESSAGE_QUEUED" } });
      return message;
    });
  },
  async createQuote(headers: Headers, input: unknown, id?: string, expectedUpdatedAt?: string) {
    const actor = await authenticate(headers), data = quoteInput.parse(input), totals = calculate(data.items);
    return getDb().$transaction(async (tx) => {
      const lead = await tx.lead.findUniqueOrThrow({ where: { id: data.leadId }, include: { project: true } });
      if (data.parentId) {
        const parent = await tx.quote.findUniqueOrThrow({ where: { id: data.parentId } });
        if (parent.leadId !== lead.id || ["ACCEPTED", "PAID", "COMPLETED"].includes(parent.status)) throw new CommercialError("IMMUTABLE_QUOTE");
      }
      const fields = { leadId: lead.id, projectId: lead.project?.id, title: data.title, billingAddress: data.billingAddress, billingName: data.billingName, billingRegistrationNumber: data.billingRegistrationNumber, billingVatNumber: data.billingVatNumber, deliveryTime: data.deliveryTime, terms: data.terms,
        items: totals.lines, subtotalCents: totals.subtotalCents, taxCents: totals.taxCents, totalCents: totals.totalCents,
        validUntil: new Date(Date.now() + data.validityDays * 86400000), parentId: data.parentId };
      if (id) {
        const updated = await tx.quote.updateMany({ where: { id: z.uuid().parse(id), status: "DRAFT", leadId: lead.id, updatedAt: new Date(z.iso.datetime().parse(expectedUpdatedAt)) }, data: fields });
        if (updated.count !== 1) throw new CommercialError("STALE_QUOTE");
        return id;
      }
      const counter = await tx.commercialSettings.upsert({ where: { id: "main" }, create: { id: "main", counter: 1 }, update: { counter: { increment: 1 } } });
      const quote = await tx.quote.create({ data: { ...fields, number: `DV-${new Date().getUTCFullYear()}-${String(counter.counter).padStart(6, "0")}` } });
      await tx.activityLog.create({ data: { actorId: actor.id, leadId: lead.id, action: "QUOTE_CREATED", after: quote.number } });
      return quote.id;
    });
  },
  async quote(headers: Headers, id: string) { await authenticate(headers); return getDb().quote.findUnique({ where: { id: z.uuid().parse(id) }, include: { lead: true, payments: { orderBy: { createdAt: "desc" }, take: 50 }, emails: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, status: true, lastError: true, kind: true, createdAt: true } } } }); },
  async quotes(headers: Headers) { await authenticate(headers); return getDb().quote.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { lead: { select: { businessName: true, fullName: true } } } }); },
  async sendQuote(headers: Headers, id: string) {
    const actor = await authenticate(headers); configured();
    const quote = await getDb().quote.findUniqueOrThrow({ where: { id: z.uuid().parse(id) }, include: { lead: true } });
    if (!quote.lead.emailVerifiedAt) throw new CommercialError("CLIENT_UNVERIFIED");
    if (quote.status !== "DRAFT" || quote.validUntil <= new Date()) throw new CommercialError("IMMUTABLE_QUOTE");
    const snapshot = await buildSnapshot(quote), pdf = await quotePdf(snapshot), token = randomBytes(32).toString("base64url");
    const link = `${publicOrigin()}/client/devis/${quote.id}#token=${token}`;
    await getDb().$transaction(async (tx) => {
      const changed = await tx.quote.updateMany({ where: { id, status: "DRAFT", updatedAt: quote.updatedAt }, data: { status: "SENT", snapshot, documentHash: digest(JSON.stringify(snapshot)), sentAt: new Date() } });
      if (changed.count !== 1) throw new CommercialError("STALE_QUOTE");
      if (quote.parentId) {
        await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${quote.parentId}::uuid FOR UPDATE`;
        const previous = await tx.quote.findUniqueOrThrow({ where: { id: quote.parentId } });
        if (["ACCEPTED", "PAID", "COMPLETED"].includes(previous.status)) throw new CommercialError("IMMUTABLE_QUOTE");
        await tx.quote.updateMany({ where: { id: previous.id, status: { in: ["SENT", "DRAFT", "DECLINED", "EXPIRED", "CANCELLED"] } }, data: { status: "SUPERSEDED", nextReminderAt: null } });
        await tx.quoteAccess.updateMany({ where: { quoteId: previous.id }, data: { revokedAt: new Date() } });
      }
      const settings = await tx.commercialSettings.findUniqueOrThrow({ where: { id: "main" } });
      await tx.quote.update({ where: { id }, data: { nextReminderAt: settings.reminderDays ? new Date(Date.now() + settings.reminderDays * 86400000) : null } });
      await tx.quoteAccess.create({ data: { quoteId: id, tokenHash: digest(token), tokenEncrypted: seal(token), expiresAt: new Date(Math.max(Date.now(), quote.validUntil.getTime()) + 90 * 86400000) } });
      const conversation = await tx.conversation.upsert({ where: { leadId: quote.leadId }, create: { leadId: quote.leadId, replyToken: randomBytes(24).toString("hex") }, update: {} });
      const text = `Bonjour ${quote.lead.fullName},\n\nVous trouverez votre devis complémentaire ${quote.number} en pièce jointe.\n\nConsulter, accepter et payer :\n${link}\n\nVous pouvez répondre à cet e-mail pour toute question.\n\n${snapshot.seller.legalName}`;
      const message = await tx.clientMessage.create({ data: { conversationId: conversation.id, direction: "OUTBOUND", subject: `Votre devis ${quote.number}`, content: `Devis ${quote.number} : ${quote.title}. PDF et lien privé d’acceptation/paiement joints à l’e-mail.`, sender: sender() } });
      await tx.commercialEmail.create({ data: queueData({ from: sender(), to: [quote.lead.email], subject: message.subject, text, reply_to: replyAddress(conversation.replyToken), attachments: [{ filename: `${quote.number}.pdf`, content: pdf.toString("base64") }] }, "QUOTE", { quoteId: id, messageId: message.id }) });
      await tx.activityLog.create({ data: { actorId: actor.id, leadId: quote.leadId, action: "QUOTE_QUEUED", after: quote.number } });
    });
  },
  async changeQuote(headers: Headers, id: string, operation: string) {
    const actor = await authenticate(headers); z.uuid().parse(id);
    await getDb().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${id}::uuid FOR UPDATE`;
      const quote = await tx.quote.findUniqueOrThrow({ where: { id } });
      if (operation === "complete" && quote.status === "PAID") await tx.quote.update({ where: { id }, data: { status: "COMPLETED" } });
      else if (operation === "cancel" && ["DRAFT", "SENT", "DECLINED", "EXPIRED"].includes(quote.status)) {
        await tx.quote.update({ where: { id }, data: { status: "CANCELLED", nextReminderAt: null } });
        await tx.quoteAccess.updateMany({ where: { quoteId: id }, data: { revokedAt: new Date() } });
      } else throw new CommercialError("INVALID_ACTION");
      await tx.activityLog.create({ data: { actorId: actor.id, leadId: quote.leadId, action: "QUOTE_" + operation.toUpperCase(), before: quote.status } });
    });
  },
  async localEmails(headers: Headers) {
    await authenticate(headers); if (!commercialLocal()) throw new CommercialError("INVALID_ACTION");
    const rows = await getDb().commercialEmail.findMany({ where: { status: "PENDING", payloadEncrypted: { not: null }, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 30 });
    return rows;
  },
  async inbox(headers: Headers, pendingOnly = true) {
    await authenticate(headers);
    return getDb().conversation.findMany({ where: pendingOnly ? { needsReply: true } : {}, orderBy: { updatedAt: "desc" }, take: 100, include: { lead: { select: { id: true, businessName: true, fullName: true, email: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } } });
  },
  async payments(headers: Headers) {
    await authenticate(headers);
    return getDb().paymentAttempt.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { quote: { select: { id: true, number: true, lead: { select: { businessName: true } } } } } });
  },
  async localReply(headers: Headers, input: unknown) {
    await authenticate(headers); if (!commercialLocal()) throw new CommercialError("INVALID_ACTION");
    const data = z.object({ leadId: z.uuid(), content: z.string().trim().min(2).max(20000), requestId: z.uuid() }).parse(input);
    await getDb().$transaction(async (tx) => {
      const lead = await tx.lead.findUniqueOrThrow({ where: { id: data.leadId } });
      const conversation = await tx.conversation.upsert({ where: { leadId: lead.id }, create: { leadId: lead.id, replyToken: randomBytes(24).toString("hex") }, update: {} });
      if (await tx.clientMessage.findUnique({ where: { id: data.requestId } })) return;
      await tx.clientMessage.create({ data: { id: data.requestId, conversationId: conversation.id, direction: "INBOUND", subject: "Réponse de test local", content: data.content, sender: lead.email, deliveryStatus: "RECEIVED_LOCAL" } });
      await tx.conversation.update({ where: { id: conversation.id }, data: { needsReply: true } });
    });
  },
};
