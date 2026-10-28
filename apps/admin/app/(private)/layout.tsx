import { headers } from "next/headers";
import { adminBrand } from "../../lib/brand-context";
import { requireAdmin } from "../../lib/access";
import { Nav } from "../../components/nav";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const name = adminBrand(await headers()) === "tadapo" ? "Tadapo" : "Zelyweb";
  return { title: { absolute: `Administration ${name}`, template: `%s | ${name}` } };
}
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const brand = adminBrand(await headers()), name = brand === "tadapo" ? "Tadapo" : "Zelyweb";
  return <div className="admin-shell"><Nav name={admin.user.name} brand={brand} /><div className="workspace"><header className="workspace-header"><span>{name} <span className="header-divider">/</span> Administration</span><span className="private-tag">Espace privé</span></header><main id="main" className="workspace-main">{children}</main><footer className="workspace-footer">{name} - Dossiers de cette marque uniquement.</footer></div></div>;
}
