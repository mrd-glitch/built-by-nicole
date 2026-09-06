import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { getSessionUser } from "@/lib/data";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Coach HQ is admin-only. A client account that lands here (bookmark, typed
  // URL) goes to their own portal instead of an empty dashboard.
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") redirect("/app");

  return (
    <div className="admin-shell">
      <AdminNav />
      <div className="admin-main">{children}</div>
    </div>
  );
}
