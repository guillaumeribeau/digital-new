import Link from "next/link";
export function TadapoLogo({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`t-logo${light ? " t-logo-light" : ""}`} aria-label="Tadapo, accueil">tadap<span className="logo-o">o</span><span className="logo-dot">.</span></Link>;
}
export function Spark({ className = "" }: { className?: string }) {
  return <svg className={`t-spark ${className}`} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="m50 0 8 32 24-23-14 31 32 10-32 10 14 31-24-23-8 32-8-32-24 23 14-31L0 50l32-10L18 9l24 23z" /></svg>;
}
