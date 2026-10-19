import Link from "next/link";
import { requireAdmin } from "../../lib/access";
import { TwoFactor } from "../../components/two-factor";
export const dynamic = "force-dynamic";
export default async function Security() { const admin = await requireAdmin(); return <main className="quote-portal"><Link href="/">← Administration</Link><h1>Sécurité du compte</h1><TwoFactor enabled={admin.user.twoFactorEnabled} /></main>; }
