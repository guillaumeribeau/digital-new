"use client";
export type AnalyticsEvent =
  | "cta_click"
  | "lead_form_start"
  | "lead_form_step"
  | "lead_form_submit"
  | "lead_form_success"
  | "contact_click";
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
// Only predefined, non-personal fields can leave the application.
export function track(
  event: AnalyticsEvent,
  params: { placement?: string; step?: number } = {},
) {
  if (
    typeof window === "undefined" ||
    window.location.pathname === "/confirmer-demande" ||
    localStorage.getItem("nova-consent") !== "accepted"
  )
    return;
  window.dataLayer ??= [];
  window.dataLayer.push({
    event,
    ...(params.placement ? { placement: params.placement } : {}),
    ...(params.step ? { step: params.step } : {}),
  });
}
