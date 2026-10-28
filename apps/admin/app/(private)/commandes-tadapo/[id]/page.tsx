import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { type TadapoOffer, tadapoMoney } from "@nova/shared/tadapo";
import { requireAdmin } from "../../../../lib/access";
import { workspaceDb } from "../../../../lib/brand-context";
import { PageTitle, DetailFields } from "../../../../components/ui";
import { TadapoPaymentPanels } from "../../../../components/tadapo-payment-panels";

export default async function TadapoOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await workspaceDb(await headers()).tadapoOrder.findUnique({ where: { id } });
  if (!order) notFound();
  const brief = order.brief as Record<string, string>, offer = order.offerSnapshot as unknown as TadapoOffer;
  return <><Link className="back-link" href="/commandes-tadapo">← Commandes Tadapo</Link>
    <PageTitle eyebrow="TADAPO" title={brief.company || "Commande Tadapo"} description={`${offer.name} · ${tadapoMoney(offer.ttcCents, 2)} € TTC/mois`} />
    <section className="panel"><h2>Le client</h2><DetailFields rows={[["Contact", brief.fullName], ["E-mail", brief.email], ["Téléphone", brief.phone]]} />
      {order.projectId ? <Link className="button secondary" href={`/projets/${order.projectId}`}>Ouvrir le projet</Link> : <p className="info-line">La confirmation du premier règlement créera le dossier client et son projet Tadapo.</p>}
    </section><div className="section-gap"><TadapoPaymentPanels order={order} /></div></>;
}
