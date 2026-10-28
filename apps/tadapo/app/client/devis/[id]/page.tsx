import { notFound } from "next/navigation";
import { z } from "zod";
import { QuotePortal } from "../../../../../admin/components/quote-portal";
import "../../../../styles/quotes.css";
export const metadata = { title: "Votre devis Tadapo", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!z.uuid().safeParse(id).success) notFound();
  return <QuotePortal id={id} brand="tadapo" />;
}
