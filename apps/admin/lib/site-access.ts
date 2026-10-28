import { getDb } from "@nova/database";
import { NextRequest } from "next/server";
import { z } from "zod";
import { CommercialError, digest } from "./commercial-core";
export const siteCookie = (id: string) => "zelyweb-site-" + id;
export async function clientSite(request: NextRequest, id: string) {
  z.uuid().parse(id);
  const token = request.cookies.get(siteCookie(id))?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new CommercialError("CLIENT_ACCESS_DENIED");
  const order = await getDb().siteOrder.findFirst({ where: { id, tokenHash: digest(token), status: { in: ["SENT", "PAID"] } }, include: { project: { include: { lead: true } }, invoices: { orderBy: { createdAt: "desc" }, take: 50 } } });
  if (!order || order.project.lead.brand !== "zelyweb" || order.project.lead.deletedAt || order.project.stage === "CANCELLED") throw new CommercialError("CLIENT_ACCESS_DENIED");
  return order;
}
