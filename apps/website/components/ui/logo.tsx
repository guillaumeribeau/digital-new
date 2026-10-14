import { brand } from "@/config/brand.config";
export function Logo() {
  return (
    <span className="logo">
      <svg
        width="29"
        height="32"
        viewBox="0 0 29 32"
        fill="none"
        aria-hidden="true"
      >
        <path d="M2 28V4h6l13 17V4h6v24h-6L8 11v17H2Z" fill="currentColor" />
        <path d="m19 0 10 0-10 10V0Z" fill="var(--blue)" />
      </svg>
      {brand.name}
      <span className="logo-dot">®</span>
    </span>
  );
}
