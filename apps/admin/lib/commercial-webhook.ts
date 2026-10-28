import { getDb } from "@nova/database";
import { Resend } from "resend";
import { z } from "zod";
import { CommercialError } from "./commercial-core";
import { applySiteInbound, receivingApiKey } from "./site-inbound";
import { applyTadapoInbound } from "./tadapo-inbound";

export async function boundedText(request: Pick<Request, "headers" | "body">, max = 1000000) {
  if (Number(request.headers.get("content-length") || 0) > max) throw new CommercialError("INVALID_ACTION");
  const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  if (reader) while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length; if (size > max) { await reader.cancel(); throw new CommercialError("INVALID_ACTION"); }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
const inboundSchema = z.object({ id: z.uuid(), to: z.array(z.string().max(500)).max(100), from: z.string().max(300), subject: z.string().max(300),
  text: z.string().nullable().optional(), html: z.string().nullable().optional(), message_id: z.string().max(500).optional(),
  attachments: z.array(z.object({ id: z.string().max(200), filename: z.string().max(200).nullable().optional(), content_type: z.string().max(100).optional() }).passthrough()).max(100).default([]),
});
function address(value: string) { return (value.match(/<([^<>]+)>/)?.[1] || value).trim().toLowerCase(); }
export async function applyResendEvent(key: string, payload: ReturnType<Resend["webhooks"]["verify"]>) {
  const db = getDb(); if (await db.commercialWebhook.findUnique({ where: { key } })) return;
  if (payload.type === "email.received") {
    const emailId = z.uuid().parse(payload.data.email_id);
    if (!receivingApiKey()) throw new CommercialError("CONFIGURATION_REQUIRED");
    const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, { headers: { Authorization: "Bearer " + receivingApiKey() }, signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!response.ok) throw new CommercialError("CONFIGURATION_REQUIRED");
    const email = inboundSchema.parse(JSON.parse(await boundedText(response)));
    if (email.id !== emailId) throw new CommercialError("INVALID_ACTION");
    if (await applyTadapoInbound(email) || await applySiteInbound(email)) {
      await db.commercialWebhook.upsert({ where: { key }, create: { key, provider: "RESEND" }, update: {} });
      return;
    }
    let target: string | undefined, targetDomain: string | undefined;
    for (const recipient of email.to) {
      const match = address(recipient).match(/^r-([a-f0-9]{48})@(.+)$/);
      if (match && [process.env.COMMERCIAL_REPLY_DOMAIN, process.env.TADAPO_REPLY_DOMAIN].filter(Boolean).some(d => match[2] === d!.toLowerCase())) { target = match[1]; targetDomain = match[2]; break; }
    }
    const conversation = target ? await db.conversation.findUnique({ where: { replyToken: target }, include: { lead: { select: { email: true, brand: true } } } }) : null;
    const text = email.text || (email.html || "").slice(0, 200000).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ");
    await db.$transaction(async (tx) => {
      if (await tx.commercialWebhook.findUnique({ where: { key } })) return;
      if (conversation && targetDomain === (conversation.lead.brand === "tadapo" ? process.env.TADAPO_REPLY_DOMAIN : process.env.COMMERCIAL_REPLY_DOMAIN)?.toLowerCase()) {
        const inserted = await tx.clientMessage.createMany({ skipDuplicates: true, data: [{ conversationId: conversation.id, direction: "INBOUND", subject: email.subject || "Réponse client", content: text.slice(0, 20000) || "Message sans contenu texte. Consultez les pièces jointes.",
          sender: email.from, providerId: email.id, smtpMessageId: email.message_id,
          attachments: email.attachments.map((file) => ({ id: file.id, filename: file.filename || "Pièce jointe", contentType: file.content_type || "application/octet-stream" })),
          deliveryStatus: address(email.from) === conversation.lead.email.toLowerCase() ? "RECEIVED" : "UNVERIFIED_SENDER" }] });
        if (inserted.count) await tx.conversation.update({ where: { id: conversation.id }, data: { needsReply: true } });
      }
      await tx.commercialWebhook.create({ data: { key, provider: "RESEND" } });
    });
  } else if (["email.delivered", "email.bounced", "email.complained", "email.failed"].includes(payload.type) && "email_id" in payload.data) {
    const providerId = z.string().max(200).parse(payload.data.email_id);
    const status = ({ "email.delivered": "DELIVERED", "email.bounced": "BOUNCED", "email.complained": "COMPLAINED", "email.failed": "DEAD" } as Record<string, string>)[payload.type];
    await db.$transaction(async (tx) => {
      if (await tx.commercialWebhook.findUnique({ where: { key } })) return;
      const terminal = ["BOUNCED", "COMPLAINED", "DEAD"];
      await tx.commercialEmail.updateMany({ where: { providerMessageId: providerId, deliveryStatus: { notIn: terminal } }, data: { deliveryStatus: status } });
      await tx.commercialEmail.updateMany({ where: { providerMessageId: providerId, deliveryStatus: null }, data: { deliveryStatus: status } });
      await tx.clientMessage.updateMany({ where: { providerId, deliveryStatus: { notIn: terminal } }, data: { deliveryStatus: status } });
      await tx.commercialWebhook.create({ data: { key, provider: "RESEND", emailId: providerId, deliveryStatus: status } });
    });
  }
}
