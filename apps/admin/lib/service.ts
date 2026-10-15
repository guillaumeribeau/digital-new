import { getDb, Prisma } from "@nova/database";
import { leadTransitions, leadStatusForStage, nextProjectStages, type LeadStatusCode, type ProjectStageCode } from "@nova/shared";
import { z } from "zod";
import { authenticate } from "./access";

export class BusinessError extends Error {}
const uuid = z.uuid();
const leadSelect = { id: true, businessName: true, fullName: true, email: true, phone: true,
  businessSector: true, services: true, city: true, status: true, createdAt: true } satisfies Prisma.LeadSelect;
export const querySchema = z.object({ q: z.string().trim().max(200).default(""),
  view: z.enum(["active", "trash"]).default("active"),
  status: z.string().max(40).default(""), sort: z.enum(["desc", "asc"]).default("desc"),
  page: z.coerce.number().int().min(1).max(100000).default(1) });
const urlSchema = z.string().trim().max(1000).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
  catch { return false; }
}, "Utilisez une URL HTTPS complète, sans identifiants.");
const audit = (actorId: string, action: string, entity: { leadId?: string; projectId?: string }, before?: string, after?: string) =>
  ({ actorId, action, ...entity, before, after });

export const adminService = {
  async dashboard(headers: Headers) {
    await authenticate(headers);
    const db = getDb();
    const [leadGroups, projectGroups, latest] = await db.$transaction(async (tx) => Promise.all([
      tx.lead.groupBy({ where: { deletedAt: null }, by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
      tx.project.groupBy({ by: ["stage"], orderBy: { stage: "asc" }, _count: { _all: true } }),
      tx.lead.findMany({ where: { deletedAt: null }, take: 6, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: leadSelect }),
    ]));
    const leadCounts = Object.fromEntries(leadGroups.map((row) => [row.status, row._count._all]));
    const projectCounts = Object.fromEntries(projectGroups.map((row) => [row.stage, row._count._all]));
    return { latest, total: leadGroups.reduce((n, row) => n + row._count._all, 0),
      newLeads: leadCounts.NEW || 0, toQualify: leadCounts.TO_QUALIFY || 0,
      pendingVerification: leadCounts.PENDING_VERIFICATION || 0,
      inCreation: ["ACCEPTED", "CONTENT_PREPARATION", "CREATION", "REVIEW", "PREVIEW_READY"].reduce((n, stage) => n + (projectCounts[stage] || 0), 0),
      proposals: (projectCounts.PREVIEW_SENT || 0) + (projectCounts.AWAITING_APPROVAL || 0),
      approved: ["APPROVED", "AWAITING_PAYMENT", "PAID", "PUBLISHING", "PUBLISHED"].reduce((n, stage) => n + (projectCounts[stage] || 0), 0),
      completed: projectCounts.PUBLISHED || 0 };
  },
  async leads(headers: Headers, input: unknown) {
    await authenticate(headers);
    const query = querySchema.parse(input);
    if (query.status && !Object.hasOwn(leadTransitions, query.status)) throw new BusinessError("INVALID_FILTER");
    const where: Prisma.LeadWhereInput = {
      deletedAt: query.view === "trash" ? { not: null } : null,
      ...(query.status ? { status: query.status as LeadStatusCode } : {}),
      ...(query.q ? { OR: ["businessName", "fullName", "email", "businessSector", "services", "city"].map((field) =>
        ({ [field]: { contains: query.q, mode: "insensitive" } })) } : {}),
    };
    const [total, rows, trashedTotal] = await getDb().$transaction([getDb().lead.count({ where }),
      getDb().lead.findMany({ where, select: leadSelect, take: 20, skip: (query.page - 1) * 20,
        orderBy: [{ createdAt: query.sort }, { id: query.sort }] }),
      getDb().lead.count({ where: { deletedAt: { not: null } } })]);
    return { query, total, rows, trashedTotal, pages: Math.max(1, Math.ceil(total / 20)) };
  },
  async lead(headers: Headers, id: string) {
    await authenticate(headers);
    return getDb().lead.findUnique({ where: { id: uuid.parse(id) }, include: {
      project: true, files: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
      conversation: { select: { id: true } }, _count: { select: { quotes: true } },
      internalNotes: { orderBy: { createdAt: "desc" }, take: 100, include: { author: { select: { user: { select: { name: true } } } } } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { user: { select: { name: true } } } } } },
    } });
  },
  async setLeadDeleted(headers: Headers, input: unknown) {
    const actor = await authenticate(headers);
    const data = z.object({ id: uuid, expectedUpdatedAt: z.iso.datetime(), deleted: z.boolean(), confirmed: z.literal(true) }).parse(input);
    await getDb().$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${data.id}::uuid::text, 0))`;
      await tx.$queryRaw`SELECT "id" FROM "Lead" WHERE "id" = ${data.id}::uuid FOR UPDATE`;
      const lead = await tx.lead.findUnique({ where: { id: data.id }, include: {
        project: { select: { id: true } }, conversation: { select: { id: true } }, _count: { select: { quotes: true } },
      } });
      if (!lead || lead.updatedAt.toISOString() !== data.expectedUpdatedAt || Boolean(lead.deletedAt) === data.deleted) throw new BusinessError("STALE_STATUS");
      if (data.deleted && (lead.project || lead.conversation || lead._count.quotes)) throw new BusinessError("LEAD_HAS_RELATED_RECORDS");
      await tx.lead.update({ where: { id: data.id }, data: { deletedAt: data.deleted ? new Date() : null } });
      await tx.activityLog.create({ data: audit(actor.id, data.deleted ? "LEAD_TRASHED" : "LEAD_RESTORED", { leadId: data.id }) });
    });
  },
  async changeLeadStatus(headers: Headers, input: unknown) {
    const actor = await authenticate(headers);
    const data = z.object({ id: uuid, expected: z.string(), status: z.string() }).parse(input);
    await getDb().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Lead" WHERE "id" = ${data.id}::uuid FOR UPDATE`;
      const lead = await tx.lead.findUnique({ where: { id: data.id }, include: { project: { select: { id: true } } } });
      if (!lead || lead.status !== data.expected) throw new BusinessError("STALE_STATUS");
      if (lead.deletedAt) throw new BusinessError("LEAD_IN_TRASH");
      if (lead.project) throw new BusinessError("USE_PROJECT_STATUS");
      if (!lead.emailVerifiedAt || !leadTransitions[lead.status].includes(data.status as LeadStatusCode)) throw new BusinessError("INVALID_TRANSITION");
      await tx.lead.update({ where: { id: lead.id }, data: { status: data.status as LeadStatusCode } });
      await tx.activityLog.create({ data: audit(actor.id, "LEAD_STATUS_CHANGED", { leadId: lead.id }, lead.status, data.status) });
    });
  },
  async note(headers: Headers, input: unknown) {
    const actor = await authenticate(headers);
    const data = z.object({ id: uuid, kind: z.enum(["lead", "project"]), content: z.string().trim().min(2).max(5000) }).parse(input);
    const relation = data.kind === "lead" ? { leadId: data.id } : { projectId: data.id };
    await getDb().$transaction(async (tx) => {
      if (data.kind === "lead") {
        await tx.$queryRaw`SELECT "id" FROM "Lead" WHERE "id" = ${data.id}::uuid FOR UPDATE`;
        const lead = await tx.lead.findUnique({ where: { id: data.id }, select: { deletedAt: true } });
        if (!lead || lead.deletedAt) throw new BusinessError("LEAD_IN_TRASH");
      }
      await tx.internalNote.create({ data: { ...relation, authorId: actor.id, content: data.content } });
      await tx.activityLog.create({ data: audit(actor.id, "NOTE_ADDED", relation) });
    });
  },
  async convert(headers: Headers, id: string) {
    const actor = await authenticate(headers);
    uuid.parse(id);
    return getDb().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Lead" WHERE "id" = ${id}::uuid FOR UPDATE`;
      const existing = await tx.project.findUnique({ where: { leadId: id } });
      if (existing) return existing.id;
      const lead = await tx.lead.findUnique({ where: { id } });
      if (!lead || lead.deletedAt || lead.status !== "QUALIFIED" || !lead.emailVerifiedAt) throw new BusinessError("NOT_QUALIFIED");
      const project = await tx.project.create({ data: { leadId: id, stage: "ACCEPTED" } });
      await tx.lead.update({ where: { id }, data: { status: "IN_PROGRESS" } });
      await tx.activityLog.create({ data: audit(actor.id, "PROJECT_CREATED", { leadId: id, projectId: project.id }, "QUALIFIED", "IN_PROGRESS") });
      return project.id;
    });
  },
  async projects(headers: Headers, input: unknown) {
    await authenticate(headers);
    const query = querySchema.parse(input);
    const stages = ["ACCEPTED", "CONTENT_PREPARATION", "CREATION", "REVIEW", "PREVIEW_READY", "PREVIEW_SENT", "AWAITING_APPROVAL", "APPROVED", "AWAITING_PAYMENT", "PAID", "PUBLISHING", "PUBLISHED", "CANCELLED"];
    if (query.status && !stages.includes(query.status)) throw new BusinessError("INVALID_FILTER");
    const where: Prisma.ProjectWhereInput = { ...(query.status ? { stage: query.status as ProjectStageCode } : {}),
      ...(query.q ? { lead: { OR: ["businessName", "fullName", "email"].map((field) => ({ [field]: { contains: query.q, mode: "insensitive" } })) } } : {}) };
    const [total, rows] = await getDb().$transaction([getDb().project.count({ where }), getDb().project.findMany({ where,
      include: { lead: { select: leadSelect } }, take: 20, skip: (query.page - 1) * 20,
      orderBy: [{ createdAt: query.sort }, { id: query.sort }] })]);
    return { query, total, rows, pages: Math.max(1, Math.ceil(total / 20)) };
  },
  async project(headers: Headers, id: string) {
    await authenticate(headers);
    return getDb().project.findUnique({ where: { id: uuid.parse(id) }, include: { lead: { select: leadSelect },
      notes: { take: 100, orderBy: { createdAt: "desc" }, include: { author: { select: { user: { select: { name: true } } } } } },
      activityLogs: { take: 100, orderBy: { createdAt: "desc" }, include: { actor: { select: { user: { select: { name: true } } } } } },
    } });
  },
  async changeProjectStage(headers: Headers, input: unknown) {
    const actor = await authenticate(headers);
    const data = z.object({ id: uuid, expected: z.string(), stage: z.string() }).parse(input);
    await getDb().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id" = ${data.id}::uuid FOR UPDATE`;
      const project = await tx.project.findUnique({ where: { id: data.id } });
      if (!project || project.stage !== data.expected) throw new BusinessError("STALE_STATUS");
      if (!nextProjectStages(project.stage).includes(data.stage as ProjectStageCode)) throw new BusinessError("INVALID_TRANSITION");
      if (data.stage === "PUBLISHED" && !project.websiteUrl) throw new BusinessError("WEBSITE_URL_REQUIRED");
      if (["PREVIEW_SENT", "AWAITING_APPROVAL"].includes(data.stage) && !project.previewUrl) throw new BusinessError("PREVIEW_URL_REQUIRED");
      await tx.project.update({ where: { id: project.id }, data: { stage: data.stage as ProjectStageCode } });
      await tx.lead.update({ where: { id: project.leadId }, data: { status: leadStatusForStage(data.stage as ProjectStageCode) } });
      await tx.activityLog.create({ data: audit(actor.id, "PROJECT_STAGE_CHANGED", { leadId: project.leadId, projectId: project.id }, project.stage, data.stage) });
    });
  },
  async projectLinks(headers: Headers, input: unknown) {
    const actor = await authenticate(headers);
    const data = z.object({ id: uuid, expectedUpdatedAt: z.iso.datetime(), previewUrl: urlSchema, websiteUrl: urlSchema }).parse(input);
    await getDb().$transaction(async (tx) => {
      const count = await tx.project.updateMany({ where: { id: data.id, updatedAt: new Date(data.expectedUpdatedAt) },
        data: { previewUrl: data.previewUrl || null, websiteUrl: data.websiteUrl || null } });
      if (count.count !== 1) throw new BusinessError("STALE_STATUS");
      await tx.activityLog.create({ data: audit(actor.id, "PROJECT_LINKS_UPDATED", { projectId: data.id }) });
    });
  },
};
