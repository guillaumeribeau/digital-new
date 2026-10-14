import { notFound } from "next/navigation";
import { z } from "zod";
import { QuotePortal } from "../../../../components/quote-portal";
export const metadata = { title: "Votre devis", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function ClientQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!z.uuid().safeParse(id).success) notFound();
  return <QuotePortal id={id} />;
}
