"use client";
import Link from "@/components/ui/tracked-link";
import { track } from "@/lib/analytics";
export function CTA({
  children = "Découvrir mon futur site",
  placement = "page",
  className = "",
  href = "/demander-mon-site",
}: {
  children?: React.ReactNode;
  placement?: string;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      className={"button " + className}
      href={href}
      onClick={() => track("cta_click", { placement })}
    >
      {children}
      <span className="button-spark" aria-hidden="true">
        ✳︎
      </span>
    </Link>
  );
}
