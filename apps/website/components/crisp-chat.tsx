"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    $crisp?: { push(command: unknown[]): unknown; is?(state: string): boolean };
  }
}

// Public workspace identifier supplied by the owner. This is not an API key.
const websiteId = "dd23e69b-7b5d-4e66-bb46-50da9ce26e4c";
const welcomeKey = "zelyweb-chat-welcomed";
const readyEvent = "zelyweb-crisp-ready";
const bootstrap = `
  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = ${JSON.stringify(websiteId)};
  window.CRISP_RUNTIME_CONFIG = { locale: "fr" };
  window.CRISP_READY_TRIGGER = function () {
    window.dispatchEvent(new Event(${JSON.stringify(readyEvent)}));
  };
  if (!document.getElementById("zelyweb-crisp-loader")) {
    var script = document.createElement("script");
    script.id = "zelyweb-crisp-loader";
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);
  }
`;

export function CrispChat() {
  const pathname = usePathname();
  const handled = useRef(false);
  // Verification URLs carry private, single-use tokens. No chat script is
  // initialized there. Demonstrations and admin are outside this layout.
  const enabled = pathname !== "/confirmer-demande";
  useEffect(() => {
    if (!enabled) {
      window.$crisp?.push(["do", "chat:hide"]);
      return;
    }
    window.$crisp ??= [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let opened = false;
    function alreadyHandled() {
      try { return handled.current || sessionStorage.getItem(welcomeKey) === "1"; }
      catch { return handled.current; }
    }
    function remember() {
      handled.current = true;
      try { sessionStorage.setItem(welcomeKey, "1"); } catch { /* In-memory fallback if storage is disabled. */ }
      clearTimeout(timer);
      timer = undefined;
    }
    function greet() {
      if (alreadyHandled()) return;
      remember();
      // Local operator message: never send a message on the visitor's behalf.
      if (window.$crisp?.is?.("session:ongoing")) return;
      const away = window.$crisp?.is?.("website:available") === false;
      window.$crisp?.push(["do", "message:show", ["text",
        "Une question sur votre futur site ? Écrivez-moi 👋" + (away
          ? " Je suis actuellement absent. Laissez votre message et votre e-mail, je vous répondrai dès que possible."
          : ""),
      ]]);
    }
    function onOpened() { opened = true; greet(); }
    function onClosed() { if (opened) remember(); }
    function schedule() {
      if (!window.$crisp?.is || alreadyHandled() || timer || document.hidden) return;
      if (window.$crisp.is("session:ongoing")) { remember(); return; }
      if (window.$crisp.is("chat:opened")) { onOpened(); return; }
      timer = setTimeout(() => {
        timer = undefined;
        if (alreadyHandled() || document.hidden) return;
        // A conversation may have started while the timer was running.
        if (window.$crisp?.is?.("session:ongoing")) { remember(); return; }
        greet();
        window.$crisp?.push(["do", "chat:open"]);
      }, 5000);
    }
    window.$crisp?.push(["on", "chat:opened", onOpened]);
    window.$crisp?.push(["on", "chat:closed", onClosed]);
    window.$crisp?.push(["do", "chat:show"]);
    window.addEventListener(readyEvent, schedule);
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      clearTimeout(timer);
      window.removeEventListener(readyEvent, schedule);
      document.removeEventListener("visibilitychange", schedule);
      window.$crisp?.push(["off", "chat:opened"]);
      window.$crisp?.push(["off", "chat:closed"]);
      window.$crisp?.push(["do", "chat:hide"]);
    };
  }, [enabled]);

  return enabled ? <Script id="zelyweb-crisp" strategy="afterInteractive" onReady={() => {
    window.$crisp?.push(["do", "chat:show"]);
  }}>{bootstrap}</Script> : null;
}
