import { tadapoBriefSchema } from "@nova/validation/tadapo";
import { tadapoOffer } from "@nova/shared/tadapo";
/** Prices and entitlements always originate from the shared catalogue. */
export function prepareTadapoOrder(input: unknown) {
  const brief = tadapoBriefSchema.parse(input);
  return { brand: "tadapo" as const, status: "draft" as const, brief, offerSnapshot: tadapoOffer(brief.plan, brief.term) };
}
