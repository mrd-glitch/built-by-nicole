import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getClientHome, getSessionUser } from "@/lib/data";

export const dynamic = "force-dynamic";

interface DayRow {
  id: string;
  week: number;
  day: number;
  title: string;
  position: number;
}

export default async function FitnessPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { assignment } = await getClientHome(session.user.id);
  const version = assignment?.program_versions as unknown as
    | { programs: { name: string } | null; program_days: DayRow[] }
    | null;
  const days = (version?.program_days ?? []).sort((a, b) => a.position - b.position || a.week - b.week || a.day - b.day);

  return (
    <main className="page-pad">
      <div className="overflow-hidden" style={{ borderRadius: "var(--radius-xl)", position: "relative", boxShadow: "var(--shadow-2)" }}>
        <Image src="/cards/workout-strength.jpg" alt="" width={900} height={675} className="h-36 w-full object-cover" priority />
        <div className="absolute inset-0 flex flex-col justify-end" style={{ background: "linear-gradient(180deg, transparent 25%, rgb(13 13 15 / 0.7) 100%)", padding: "var(--space-4)" }}>
          <p className="eyebrow" style={{ color: "var(--pink-300)" }}>
            Your program
          </p>
          <h1 style={{ fontSize: "var(--text-xl)", color: "var(--paper-50)" }}>{version?.programs?.name ?? "No program yet"}</h1>
        </div>
      </div>
      <p className="mt-3" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
        {days.length > 0 ? "Tap a day to train and log your sets." : "Nicole is building it. You'll get a message when it's live."}
      </p>

      <div className="mt-5 grid gap-3">
        {days.map((d, idx) => (
          <Link
            key={d.id}
            href={`/app/fitness/${d.id}`}
            className="card flex items-center justify-between gap-3"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="flex items-center gap-4">
              <span
                className="metric flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: idx === 0 ? "var(--pink-500)" : "var(--surface-sunken)",
                  color: idx === 0 ? "var(--white)" : "var(--text-strong)",
                  fontSize: "var(--text-lg)",
                }}
              >
                {idx + 1}
              </span>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-extrabold)", color: "var(--text-strong)" }}>
                  Week {d.week} · Day {d.day}
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{d.title}</p>
              </div>
            </div>
            <span className="badge badge--grey">Open</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
