import { getApplications } from "@/lib/data";
import { ApplicationCard } from "@/components/ApplicationCard";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const { fresh, decided } = await getApplications();

  return (
    <main style={{ maxWidth: 860 }}>
      <h1 style={{ fontSize: "var(--text-2xl)" }}>Applications</h1>
      <p className="mt-2" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
        Approve sends the account invite and moves them to Clients. Declined applications delete after 90 days.
      </p>

      <div className="mt-6 grid gap-4">
        {fresh.length === 0 && (
          <div className="card card--sunken text-center" style={{ padding: "var(--space-10)" }}>
            <p style={{ color: "var(--text-muted)" }}>No new applications. They land here from the site.</p>
          </div>
        )}
        {fresh.map((a) => (
          <ApplicationCard key={a.id} app={a} />
        ))}
      </div>

      {decided.length > 0 && (
        <section className="mt-8">
          <h2 className="eyebrow">Recently decided</h2>
          <div className="mt-3 grid gap-2">
            {decided.map((a) => (
              <div key={a.id} className="card flex items-center justify-between gap-3" style={{ padding: "var(--space-3) var(--space-4)" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)" }}>
                    {(a.answers as Record<string, string>)?.firstName} {(a.answers as Record<string, string>)?.lastName}
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{a.email}</p>
                </div>
                <span className={`badge ${a.status === "approved" ? "badge--green" : "badge--grey"}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
