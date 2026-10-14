"use client";
import { track } from "@/lib/analytics";
export function ContactLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={() => track("contact_click", { placement: "footer" })}
    >
      {children}
    </a>
  );
}
