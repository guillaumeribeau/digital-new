import { requireAdmin } from "../../lib/access";
import { Nav } from "../../components/nav";
export const dynamic = "force-dynamic";
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <div className="admin-shell"><Nav name={admin.user.name} /><div className="workspace"><header className="workspace-header"><span>Zelyweb <span className="header-divider">/</span> Administration</span><span className="private-tag">Espace privé</span></header><main id="main" className="workspace-main">{children}</main><footer className="workspace-footer">Zelyweb · Votre activité, vos projets, au même endroit.</footer></div></div>;
}
