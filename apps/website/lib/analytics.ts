"use client";
export const measurementId = process.env.NEXT_PUBLIC_GA_ID || "G-TDLF1WPKD4";
export const analyticsEnabled = /^G-[A-Z0-9]+$/.test(measurementId);
export type AnalyticsEvent =
  | "cta_click"
  | "lead_form_start"
  | "lead_form_step"
  | "lead_form_submit"
  | "lead_form_success"
  | "contact_click";
declare global {
  interface Window {
    dataLayer?: (Record<string, unknown> | IArguments)[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}
export function hasAnalyticsConsent() {
  try {
    return localStorage.getItem("nova-consent") === "accepted";
  } catch {
    return false;
  }
}
export function isMeasuredPage(pathname: string) {
  return !["/confirmer-demande", "/emails-locaux"].includes(pathname) &&
    !pathname.startsWith("/exemples/");
}
// Never include fragments, arbitrary query parameters or form contents.
export function analyticsLocation() {
  const url = new URL(window.location.origin + window.location.pathname);
  const current = new URL(window.location.href);
  for (const name of ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_content", "utm_term"]) {
    const value = current.searchParams.get(name);
    if (value && /^[a-zA-Z0-9_. -]{1,100}$/.test(value)) url.searchParams.set(name, value);
  }
  return url.href;
}
// Only predefined, non-personal fields can leave the application.
export function track(
  event: AnalyticsEvent,
  params: { placement?: string; step?: number } = {},
) {
  if (
    typeof window === "undefined" ||
    !isMeasuredPage(window.location.pathname) ||
    !hasAnalyticsConsent()
  )
    return;
  window.gtag?.("event", event, {
    send_to: measurementId,
    page_location: analyticsLocation(),
    ...(params.placement ? { placement: params.placement } : {}),
    ...(params.step ? { step: params.step } : {}),
  });
}
