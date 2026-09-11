import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Ring } from "@/components/Ring";
import { ConsistencyCalendar } from "@/components/ConsistencyCalendar";
import { getClientHome, getDailyWeights, getSessionUser } from "@/lib/data";
import { DailyWeightEntry } from "@/components/DailyWeightEntry";

export const dynamic = "force-dynamic";

interface DayRow {
  id: string;
  week: number;
  day: number;
  title: string;
  position: number;
}

export default async function ClientHome() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { checkins, assignment, sessions } = await getClientHome(session.user.id);
  const weighEnabled = session.profile?.daily_weight_enabled ?? false;
  const dailyWeights = weighEnabled ? await getDailyWeights(session.user.id, 2) : [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayWeight = dailyWeights.find((w) => w.weigh_date === todayStr)?.weight_lbs ?? null;

  const latest = checkins[0];
  const start = session.profile?.start_weight_lbs != null ? Number(session.profile.start_weight_lbs) : null;
  const goal = session.profile?.goal_weight_lbs != null ? Number(session.profile.goal_weight_lbs) : null;
  const lost = start != null && latest ? start - Number(latest.dry_weight_lbs) : null;
  const goalProgress = start != null && goal != null && lost != null && start !== goal ? lost / (start - goal) : 0;

  const version = assignment?.program_versions as unknown as
    | { programs: { name: string } | null; program_days: DayRow[] }
    | null;
  const days = (version?.program_days ?? []).sort((a, b) => a.position - b.position || a.week - b.week || a.day - b.day);
  const doneDayIds = new Set(sessions.filter((s) => s.finished_at).map((s) => s.day_id));
  const nextDay = days.find((d) => !doneDayIds.has(d.id)) ?? days[0];
  const lifetimeWorkouts = sessions.filter((s) => s.finished_at).length;

  return (
    <main className="page-pad">
      {/* Coach note with real photo */}
      <section className="glass flex items-start gap-4" style={{ padding: "var(--space-5)", position: "relative", overflow: "hidden" }}>
        <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "linear-gradient(180deg, var(--pink-400, #FF6FA5), var(--pink-600, #E01860))" }} />
        <Image
          src="/photos/coach-portrait-arms-crossed.jpeg"
          alt="Nicole"
          width={96}
          height={96}
          className="object-cover"
          style={{ width: 54, height: 54, borderRadius: "50%", border: "2.5px solid var(--pink-500)", boxShadow: "0 4px 12px rgb(255 31 107 / 0.25)", objectPosition: "top", flexShrink: 0 }}
        />
        <div>
          <p className="eyebrow eyebrow--accent">From Nicole</p>
          <p className="mt-1" style={{ fontSize: "var(--text-base)", lineHeight: "var(--leading-body)", color: "var(--text-strong)" }}>
            Show up with what you can. I&apos;m watching the trend with you.
          </p>
        </div>
      </section>

      {weighEnabled && <DailyWeightEntry todayValue={todayWeight != null ? Number(todayWeight) : null} />}

      {/* Stat tiles */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="tile tile--pink flex flex-col items-center gap-1 text-center">
          <Ring value={goalProgress} size={88} color="var(--pink-600)">
            <span className="metric" style={{ fontSize: "var(--text-lg)", color: "var(--pink-900)" }}>
              {lost != null ? lost.toFixed(1) : "—"}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--pink-700)" }}>lbs down</span>
          </Ring>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--pink-700)" }}>
            {latest ? `${latest.dry_weight_lbs} now` : "first weigh-in Sunday"}
            {goal != null ? ` · goal ${goal}` : ""}
          </span>
        </div>
        <div className="grid gap-3">
          <div className="tile tile--yellow flex items-center justify-between">
            <div>
              <p className="metric" style={{ fontSize: "var(--text-xl)", color: "var(--ink-900)" }}>
                {checkins.length}
              </p>
              <p style={{ fontSize: "var(--text-2xs)", color: "var(--ink-700)" }}>check-in streak</p>
            </div>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--deep-yellow, #E8C400)" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M9 11l3 3 8-8" stroke="#B99C00" />
            </svg>
          </div>
          <div className="tile tile--grey flex items-center justify-between">
            <div>
              <p className="metric" style={{ fontSize: "var(--text-xl)", color: "var(--ink-900)" }}>
                {lifetimeWorkouts}
              </p>
              <p style={{ fontSize: "var(--text-2xs)", color: "var(--grey-500)" }}>workouts done</p>
            </div>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--grey-500)" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M3 12h2m14 0h2M7 8v8m10-8v8M7 12h10" />
            </svg>
          </div>
        </div>
      </section>

      {/* Next workout — photo card with glass caption bar */}
      {nextDay && (
        <Link href={`/app/fitness/${nextDay.id}`} className="photocard mt-4">
          <Image src="/cards/workout-power.jpg" alt="" width={900} height={675} className="h-44 w-full object-cover" />
          <div className="photocard__bar">
            <div>
              <p className="eyebrow" style={{ color: "var(--pink-300)", fontSize: 9 }}>
                Next workout
              </p>
              <p style={{ fontFamily: "var(--font-numeric)", fontWeight: 700, fontSize: "var(--text-base)", letterSpacing: "-0.01em" }}>
                Week {nextDay.week} · Day {nextDay.day} · {nextDay.title}
              </p>
            </div>
            <span className="btn btn--highlight btn--sm" style={{ minHeight: 34 }}>
              Start
            </span>
          </div>
        </Link>
      )}

      {/* Check-in card */}
      <Link href="/app/checkin" className="photocard mt-3">
        <Image src="/cards/checkin-ritual.jpg" alt="" width={900} height={675} className="h-32 w-full object-cover" />
        <div className="photocard__bar">
          <div>
            <p className="eyebrow" style={{ color: "var(--pink-300)", fontSize: 9 }}>
              Sunday check-in
            </p>
            <p style={{ fontSize: "var(--text-sm)" }}>
              {latest ? `Last one: ${latest.iso_week}` : "Your first one starts the trend."}
            </p>
          </div>
          <span className="chip chip--yellow">Due Sun</span>
        </div>
      </Link>

      {/* Consistency calendar */}
      <div className="mt-4">
        <ConsistencyCalendar
          workoutDates={sessions.filter((s) => s.finished_at).map((s) => s.started_at)}
          checkinDates={checkins.map((c) => c.submitted_at)}
          timezone={session.profile?.timezone ?? "America/Edmonton"}
        />
      </div>

      <p className="mt-6 text-center" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
        <Link href="/set-password" style={{ color: "var(--text-muted)" }}>
          Change password
        </Link>
      </p>

      {/* Last week ratings */}
      {latest && (
        <section className="card mt-4" style={{ padding: "var(--space-4)" }}>
          <h2 className="eyebrow">Last check-in</h2>
          <div className="mt-2 flex items-center justify-between">
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Meal plan</span>
            <span className="metric" style={{ color: "var(--pink-700)" }}>{latest.meal_rating}/5</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Fitness plan</span>
            <span className="metric" style={{ color: "var(--pink-700)" }}>{latest.fitness_rating}/5</span>
          </div>
        </section>
      )}
    </main>
  );
}
