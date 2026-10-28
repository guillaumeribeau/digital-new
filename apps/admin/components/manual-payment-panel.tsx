import { headers } from "next/headers";
import { workspaceDb } from "../lib/brand-context";
import { type ManualPaymentKind, manualPaymentStatuses } from "../lib/manual-payment-types";
import { tadapoAnniversary } from "@nova/shared/tadapo";
import { ManualPaymentForm } from "./manual-payment-form";
import { date } from "./ui";

export async function ManualPaymentPanel({ id, kind, title, updatedAt, paid, failed = false, mode, nextBillingAt }: {
  id: string; kind: ManualPaymentKind; title: string; updatedAt: Date; paid: boolean; failed?: boolean; mode: string; nextBillingAt?: Date | null;
}) {
  const records = await workspaceDb(await headers()).manualPaymentReview.findMany({ where: { resourceId: id, kind }, orderBy: { createdAt: "desc" }, take: 10,
    include: { actor: { select: { user: { select: { name: true } } } } } });
  const status = failed ? "FAILED" : paid ? "PAID" : "PENDING";
  const latest = records[0];
  // A confirmed payment takes precedence over an earlier manual failure. An
  // unrelated workflow edit must not clear a recorded failure on an unpaid item.
  const displayedStatus = !paid && !failed && latest?.status === "FAILED" ? "FAILED" : status;
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const next = nextBillingAt && nextBillingAt.toISOString().slice(0, 10) > today ? nextBillingAt : tadapoAnniversary(now, 1);
  const paymentDate = (value: Date) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long" }).format(value);
  return <section className="panel" id={"manual-" + kind.toLowerCase()}><h2>{title}</h2>
    <p><strong>{manualPaymentStatuses[displayedStatus]}</strong> · {mode === "LIVE" ? "Encaissement réel" : mode === "LOCAL" ? "Simulation locale" : mode === "TEST" ? "Paiement de test" : "Vérification manuelle"}</p>
    <p className="info-line">Après vérification dans Stripe ou sur votre relevé bancaire, enregistrez le résultat ici. Cette action met à jour le dossier ; elle ne débite ni ne rembourse le client et n’envoie aucun e-mail.</p>
    <ManualPaymentForm key={updatedAt.toISOString()} id={id} kind={kind} expectedUpdatedAt={updatedAt.toISOString()} status={displayedStatus} today={today} paidOn={paid && latest?.paidAt ? latest.paidAt.toISOString().slice(0, 10) : today} nextBillingOn={next.toISOString().slice(0, 10)} />
    {records.length > 0 && <details className="section-gap"><summary>Historique des vérifications manuelles</summary>{records.map(r => <article className="note" key={r.id}>
      <strong>{manualPaymentStatuses[r.status]} · {date(r.createdAt)}</strong><p>{r.actor.user.name}{r.paidAt ? ` · Règlement du ${paymentDate(r.paidAt)}` : ""}{r.nextBillingAt ? ` · Prochaine échéance : ${paymentDate(r.nextBillingAt)}` : ""}</p>
      {r.reference && <p>Référence : {r.reference}</p>}{r.note && <p style={{ whiteSpace: "pre-wrap" }}>{r.note}</p>}
    </article>)}{records.length === 10 && <p className="info-line">Les dix vérifications les plus récentes sont affichées.</p>}</details>}
  </section>;
}
