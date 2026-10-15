import { business } from "@nova/shared/business";
import { requireAdmin } from "../../../../lib/access";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { commercialService } from "../../../../lib/commercial";
import { PageTitle } from "../../../../components/ui";
import { QuoteEditor, type QuoteEditorInitial } from "../../../../components/quote-editor";
import { snapshotSchema } from "../../../../lib/commercial-core";
export default async function NewQuote({ searchParams }: { searchParams: Promise<{ client?: string; modifier?: string; revision?: string }> }) {
  await requireAdmin();
  const query = await searchParams, h = await headers(); if (!z.uuid().safeParse(query.client).success) notFound();
  const client = await commercialService.client(h, query.client!); if (!client) notFound();
  const [settings, templates] = await Promise.all([commercialService.settings(h), commercialService.templates(h)]);
  let initial: QuoteEditorInitial = { title: "", billingName: client.businessName, billingAddress: "", billingRegistrationNumber: "", billingVatNumber: "", deliveryTime: "", terms: settings?.terms || "", validityDays: settings?.validityDays || 30, items: [{ label: "", description: "", quantity: 1, unitPrice: "", taxBasisPoints: business.taxBasisPoints }] };
  const previousId = query.modifier || query.revision;
  if (previousId) {
    if (!z.uuid().safeParse(previousId).success) notFound();
    const previous = await commercialService.quote(h, previousId); if (!previous || previous.leadId !== client.id || (query.modifier && previous.status !== "DRAFT") || (query.revision && ["ACCEPTED", "PAID", "COMPLETED"].includes(previous.status))) notFound();
    const lines = snapshotSchema.shape.items.parse(previous.items);
    initial = { ...initial, title: previous.title, billingName: previous.billingName, billingAddress: previous.billingAddress, billingRegistrationNumber: previous.billingRegistrationNumber, billingVatNumber: previous.billingVatNumber, deliveryTime: previous.deliveryTime, terms: previous.terms,
      items: lines.map((line) => ({ label: line.label, description: line.description, quantity: line.quantity, unitPrice: (line.unitCents / 100).toFixed(2), taxBasisPoints: line.taxBasisPoints })),
      ...(query.modifier ? { quoteId: previous.id, expectedUpdatedAt: previous.updatedAt.toISOString(), parentId: previous.parentId || undefined } : { parentId: previous.id }) };
  }
  return <><Link className="back-link" href={`/clients/${client.id}`}>← {client.businessName}</Link><PageTitle eyebrow="PRESTATION COMPLÉMENTAIRE" title={query.modifier ? "Modifier le brouillon" : query.revision ? "Nouvelle version du devis" : "Préparer un devis"} description="Vérifiez les coordonnées de facturation, les prestations, la TVA et les conditions avant l’envoi." />{!settings?.legalName && <p className="notice section-gap">Renseignez votre entreprise dans <Link href="/parametres/commercial">les paramètres commerciaux</Link> avant d’envoyer ce devis.</p>}<section className="panel section-gap"><QuoteEditor leadId={client.id} initial={initial} services={templates.services} /></section></>;
}
