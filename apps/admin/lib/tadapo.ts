import { z } from "zod";
import { getDb } from "@nova/database";
import { tadapoStages, type TadapoOffer } from "@nova/shared/tadapo";
import { prepareDomainQuote, type TadapoDomainQuote } from "@nova/shared/tadapo-domain";
import { queueTadapoEmail, TadapoError, tadapoMode } from "@nova/shared/tadapo-server";
import { seal } from "@nova/shared/secure-payload";
import { authenticate } from "./access";
import { checkUpload } from "./project-workflow";

export async function updateTadapo(h: Headers, input: unknown) {
  const actor = await authenticate(h);
  const d = z.object({ id: z.uuid(), action: z.enum(["stage", "email", "domain", "domain-purchased", "domain-ready"]),
    stage: z.string().optional(), expectedStage: z.string().optional(), subject: z.string().trim().max(200).optional(), message: z.string().trim().max(10000).optional(), requestId: z.uuid().optional(),
    domain: z.string().optional(), kind: z.enum(["new", "existing"]).optional(), initialHtCents: z.coerce.number().optional(), renewalHtCents: z.coerce.number().optional(),
  }).parse(input);
  await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "TadapoOrder" WHERE "id" = ${d.id}::uuid FOR UPDATE`;
    const o = await tx.tadapoOrder.findUniqueOrThrow({ where: { id: d.id }, include: { project: true } });
    if (!o.paidAt || !o.projectId || o.mode !== tadapoMode()) throw new TadapoError("INVALID_ACTION");
    if (d.action === "stage") {
      if (o.stage !== d.expectedStage || !d.stage || !Object.hasOwn(tadapoStages, d.stage)) throw new TadapoError("STALE_STAGE");
      const allowed: Record<string, string[]> = { CONTENT_PREPARATION: ["CREATION"], CREATION: ["PREVIEW_SENT"], PREVIEW_SENT: ["REVIEW"], REVIEW: ["PREVIEW_SENT"], APPROVED: ["REVIEW", "PUBLISHED"], PUBLISHED: ["REVIEW"] };
      if (!allowed[o.stage]?.includes(d.stage)) throw new TadapoError("INVALID_ACTION");
      const consent = o.consentSnapshot as { earlyStart?: boolean };
      if (d.stage === "CREATION" && !consent.earlyStart && o.paidAt.getTime() + 14 * 86400000 > Date.now()) throw new TadapoError("EARLY_START_NOT_ACCEPTED");
      if (d.stage === "PREVIEW_SENT" && !o.project?.previewUrl) throw new TadapoError("PREVIEW_REQUIRED");
      if (d.stage === "PUBLISHED" && (!o.approvedAt || o.approvedVersion !== o.reviewVersion || !o.domainReadyAt || !o.project?.websiteUrl || o.billingAlert || o.subscriptionStatus !== "active")) throw new TadapoError("NOT_READY");
      await tx.tadapoOrder.update({ where: { id: o.id }, data: { stage: d.stage,
        ...(d.stage === "CREATION" ? { contentCompleteAt: o.contentCompleteAt || new Date() } : {}),
        ...(d.stage === "REVIEW" || o.stage === "REVIEW" && d.stage === "PREVIEW_SENT" ? { reviewVersion: { increment: 1 }, approvedAt: null, approvedVersion: null, approvedName: null } : {}) } });
      await tx.project.update({ where: { id: o.projectId }, data: { stage: d.stage as "CREATION" | "PREVIEW_SENT" | "REVIEW" | "PUBLISHED" } });
      if (d.stage === "PUBLISHED") await tx.lead.update({ where: { id: o.project!.leadId }, data: { status: "PUBLISHED" } });
    } else if (d.action === "email") {
      if (!d.subject || !d.message || !d.requestId) throw new TadapoError("INVALID_ACTION");
      if (await tx.commercialEmail.findUnique({ where: { manualRequestId: d.requestId } })) return;
      await queueTadapoEmail(tx, o, "TADAPO_MANUAL", d.subject, d.message, d.requestId);
    } else if (d.action === "domain") {
      if (o.domainAcceptedAt || o.domainSessionId || o.domainPurchasedAt) throw new TadapoError("DOMAIN_IMMUTABLE");
      const quote = prepareDomainQuote(d, o.offerSnapshot as unknown as TadapoOffer);
      await tx.tadapoOrder.update({ where: { id: o.id }, data: { domainQuote: quote, domainVersion: { increment: 1 } } });
    } else {
      const q = o.domainQuote as TadapoDomainQuote | null;
      if (!q || !o.domainAcceptedAt || q.initialExtraHtCents > 0 && !o.domainPaidAt) throw new TadapoError("DOMAIN_NOT_APPROVED_OR_PAID");
      if (d.action === "domain-purchased") {
        if (q.kind !== "new") throw new TadapoError("INVALID_ACTION");
        await tx.tadapoOrder.update({ where: { id: o.id }, data: { domainPurchasedAt: o.domainPurchasedAt || new Date() } });
      } else {
        if (q.kind === "new" && !o.domainPurchasedAt || !o.project?.websiteUrl || new URL(o.project.websiteUrl).hostname.replace(/^www\./, "") !== q.domain.replace(/^www\./, "")) throw new TadapoError("DOMAIN_NOT_READY");
        await tx.tadapoOrder.update({ where: { id: o.id }, data: { domainReadyAt: new Date() } });
      }
    }
    await tx.activityLog.create({ data: { actorId: actor.id, projectId: o.projectId, action: `TADAPO_${d.action.toUpperCase().replaceAll("-", "_")}`, before: o.stage, after: d.stage } });
  });
}
export async function attachTadapoFile(h: Headers, id: string, filename: string, bytes: Buffer) {
  const actor = await authenticate(h); z.uuid().parse(id);
  const file = checkUpload(filename, bytes);
  await getDb().$transaction(async tx => {
    const o = await tx.tadapoOrder.findUniqueOrThrow({ where: { id } });
    if (!o.projectId) throw new TadapoError("INVALID_ACTION");
    await tx.tadapoFile.create({ data: { orderId: id, filename: file.filename, mimeType: file.mime, sizeBytes: bytes.length, encrypted: seal(bytes.toString("base64")) } });
    await tx.activityLog.create({ data: { actorId: actor.id, projectId: o.projectId, action: "TADAPO_FILE_ATTACHED" } });
  });
}
