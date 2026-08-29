import Link from "next/link";
import { getNotifications } from "@/lib/data";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

const kindMeta = {
  checkin: {
    label: "Check-in",
    chip: "chip--pink",
    icon: "M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9",
  },
  message: {
    label: "Message",
    chip: "chip--yellow",
    icon: "M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5Z",
  },
  application: {
    label: "Application",
    chip: "chip--ink",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6",
  },
} as const;

export default async function AdminFeed() {
  const feed = await getNotifications();

  return (
    <main style={{ maxWidth: 760 }}>
      <p className="eyebrow eyebrow--accent">Coach HQ</p>
      <h1 className="mt-2" style={{ fontSize: "var(--text-2xl)" }}>
        What needs you.
      </h1>

      <div className="mt-6 grid gap-3">
        {feed.length === 0 && (
          <div className="glass text-center" style={{ padding: "var(--space-10)" }}>
            <p style={{ color: "var(--text-muted)" }}>
              All caught up. Check-ins, messages, and applications land here.
            </p>
          </div>
        )}
        {feed.map((n) => {
          const meta = kindMeta[n.kind as keyof typeof kindMeta] ?? kindMeta.message;
          const target =
            n.kind === "application" ? "/admin/applications" : n.client_id ? `/admin/clients/${n.client_id}` : "/admin/clients";
          return (
            <Link
              key={n.id}
              href={target}
              className="glass flex items-center gap-3"
              style={{ padding: "var(--space-4)", textDecoration: "none", color: "inherit", borderBottom: "none" }}
            >
              <span
                className="flex items-center justify-center"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "var(--radius-pill)",
                  flexShrink: 0,
                  background: n.kind === "application" ? "var(--ink-900)" : n.kind === "message" ? "rgb(255 243 176 / 0.9)" : "rgb(255 209 227 / 0.9)",
                  color: n.kind === "application" ? "var(--paper-50)" : n.kind === "message" ? "#6B5D00" : "var(--pink-900)",
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={meta.icon} />
                </svg>
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="flex items-baseline justify-between gap-2">
                  <p style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: "var(--text-base)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.title}
                  </p>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-faint)", flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                </div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {n.body}
                </p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--grey-400)" strokeWidth="2.2" strokeLinecap="round" aria-hidden style={{ flexShrink: 0 }}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
