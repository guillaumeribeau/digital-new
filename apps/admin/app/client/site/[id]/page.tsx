import { notFound } from "next/navigation";
import { z } from "zod";
import { SitePortal } from "../../../../components/site-portal";
export const metadata = { title: "Votre site | Zelyweb", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return <SitePortal id={id} />;
}
