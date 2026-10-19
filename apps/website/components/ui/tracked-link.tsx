"use client";
import NextLink from "next/link";
import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const Campaign = createContext("");
export function campaignQuery(search: string) {
  const source = new URLSearchParams(search), result = new URLSearchParams();
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_content", "utm_term"]) {
    const value = source.get(key);
    if (value && /^[a-zA-Z0-9_. -]{1,100}$/.test(value)) result.set(key, value);
  }
  return result.toString();
}
export function AttributionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  useEffect(() => {
    const next = campaignQuery(window.location.search);
    if (next) queueMicrotask(() => setQuery(next));
  }, [pathname]);
  return <Campaign.Provider value={query}>{children}</Campaign.Provider>;
}
export default function TrackedLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  const query = useContext(Campaign);
  if (query && typeof href === "string" && href.startsWith("/") && !href.startsWith("//")) {
    const url = new URL(href, "https://zelyweb.com");
    if (!/^\/(api|confirmer-demande|emails-locaux|exemples\/)/.test(url.pathname)) {
      for (const [key, value] of new URLSearchParams(query)) if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      href = url.pathname + url.search + url.hash;
    }
  }
  return <NextLink {...props} href={href} />;
}
