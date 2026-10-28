import { type TadapoOrder } from "@nova/database";
import { ManualPaymentPanel } from "./manual-payment-panel";

export function TadapoPaymentPanels({ order: o }: { order: TadapoOrder }) {
  const domain = o.domainQuote as { initialExtraHtCents?: number } | null;
  return <>
    <ManualPaymentPanel id={o.id} kind="TADAPO_SUBSCRIPTION" title="Suivi manuel du paiement Tadapo" updatedAt={o.updatedAt}
      paid={!!o.paidAt && o.subscriptionStatus === "active" && !o.billingAlert} failed={o.billingAlert && o.subscriptionStatus === "past_due"} mode={o.mode} nextBillingAt={o.nextBillingAt} />
    {!!o.domainAcceptedAt && !!domain?.initialExtraHtCents && <ManualPaymentPanel id={o.id} kind="TADAPO_DOMAIN" title="Paiement du supplément de domaine" updatedAt={o.updatedAt} paid={!!o.domainPaidAt} mode={o.mode} />}
  </>;
}
