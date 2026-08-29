import Link from "next/link";
import { getClients } from "@/lib/data";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, string> = {
  active: "badge--green",
  paused: "badge--yellow",
  archived: "badge--grey",
};

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <main style={{ maxWidth: 860 }}>
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Clients</h1>
        <span className="badge badge--pink">{clients.filter((c) => c.status === "active").length} active</span>
      </div>

      <div className="mt-6 grid gap-3">
        {clients.length === 0 && (
          <div className="glass text-center" style={{ padding: "var(--space-10)" }}>
            <p style={{ color: "var(--text-muted)" }}>
              No clients yet. Approve an application and they show up here.
            </p>
          </div>
        )}
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${c.id}`}
            className="glass flex flex-wrap items-center justify-between gap-3"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="flex items-center gap-4">
              <span
                className="flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--pink-100)",
                  color: "var(--pink-700)",
                  fontFamily: "var(--font-display)",
                  fontWeight: "var(--weight-extrabold)",
                }}
                aria-hidden
              >
                {(c.first_name || c.full_name || "?")[0]}
              </span>
              <div>
                <p style={{ fontWeight: 600, color: "var(--text-strong)" }}>{c.full_name || c.email}</p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{c.email}</p>
              </div>
            </div>
            <span className={`badge ${statusBadge[c.status] ?? "badge--grey"}`}>{c.status}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
