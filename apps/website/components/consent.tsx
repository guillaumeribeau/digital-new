"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { analyticsEnabled, analyticsLocation, hasAnalyticsConsent, isMeasuredPage, measurementId } from "@/lib/analytics";
let lastPage: string | undefined;
function activate() {
  if (!analyticsEnabled || !isMeasuredPage(window.location.pathname) || !hasAnalyticsConsent()) return;
  window[`ga-disable-${measurementId}`] = false;
  if (document.getElementById("zelyweb-ga")) return;
  window.dataLayer ??= [];
  // Google's command queue expects Arguments objects rather than event objects.
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function () { window.dataLayer!.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "granted", ad_storage: "denied",
    ad_user_data: "denied", ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("set", { page_location: analyticsLocation(), page_referrer: safeReferrer() });
  window.gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 31536000,
    cookie_update: false,
  });
  const script = document.createElement("script");
  script.id = "zelyweb-ga";
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  script.async = true;
  document.head.appendChild(script);
}
function safeReferrer() {
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin + "/";
  } catch { return ""; }
}
function pageView() {
  activate();
  if (!window.gtag || !hasAnalyticsConsent() || !isMeasuredPage(window.location.pathname)) return;
  const location = analyticsLocation();
  if (lastPage === location) return;
  window.gtag("set", { page_location: location, page_title: document.title, page_referrer: lastPage || safeReferrer() });
  window.gtag("event", "page_view", {
    send_to: measurementId,
    page_location: location,
    page_title: document.title,
    page_referrer: lastPage || safeReferrer(),
  });
  lastPage = location;
}
export function Consent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let consent: string | null = null;
    try { consent = localStorage.getItem("nova-consent"); } catch {}
    queueMicrotask(() => setVisible(analyticsEnabled && !consent && isMeasuredPage(window.location.pathname)));
    const show = () => setVisible(true);
    window.addEventListener("nova-open-consent", show);
    return () => window.removeEventListener("nova-open-consent", show);
  }, [pathname]);
  useEffect(() => {
    window[`ga-disable-${measurementId}`] = !isMeasuredPage(pathname) || !hasAnalyticsConsent();
    const frame = requestAnimationFrame(pageView);
    return () => {
      cancelAnimationFrame(frame);
      window[`ga-disable-${measurementId}`] = true;
    };
  }, [pathname]);
  function choose(value: string) {
    try { localStorage.setItem("nova-consent", value); } catch { return; }
    setVisible(false);
    if (value === "accepted") pageView();
    else {
      window[`ga-disable-${measurementId}`] = true;
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      if (document.getElementById("zelyweb-ga")) window.location.reload();
    }
  }
  return visible ? (
    <aside
      className="consent-panel"
      aria-label="Préférences de confidentialité"
    >
      <strong>Vos préférences, votre choix.</strong>
      <p>
        Avec votre accord, nous utilisons des outils de mesure pour comprendre
        les visites. Votre demande reste accessible quel que soit votre choix.
      </p>
      <Link href="/cookies">En savoir plus</Link>
      <div>
        <button onClick={() => choose("rejected")}>Refuser</button>
        <button onClick={() => choose("accepted")}>Accepter</button>
      </div>
    </aside>
  ) : null;
}
export function ConsentSettings() {
  return (
    <button
      className="button"
      onClick={() => window.dispatchEvent(new Event("nova-open-consent"))}
    >
      Gérer mes préférences
    </button>
  );
}
