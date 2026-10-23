import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { OrderFollowup } from "@tadapo/components/order-followup";
import { TadapoHeader } from "@tadapo/components/header";
import { TadapoFooter } from "@tadapo/components/footer";
export const metadata: Metadata = { title: "Votre suivi Tadapo", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Followup({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!z.uuid().safeParse(id).success) notFound();
  return <><TadapoHeader /><main className="t-container t-section"><OrderFollowup id={id} /></main><TadapoFooter /></>;
}
