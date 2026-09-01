/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import { getClientHome, getDailyWeights, getSessionUser, getSignedUrls } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { checkins } = await getClientHome(session.user.id);
  const daily = (session.profile?.daily_weight_enabled ? await getDailyWeights(session.user.id) : []).map((d) => ({
    date: d.weigh_date as string,
    lbs: Number(d.weight_lbs),
  }));

  const points = [...checkins].reverse(); // oldest -> newest
  const goal = session.profile?.goal_weight_lbs != null ? Number(session.profile.goal_weight_lbs) : null;
  const start = session.profile?.start_weight_lbs != null ? Number(session.profile.start_weight_lbs) : null;

  if (points.length === 0 && daily.length === 0) {
    return (
      <main className="page-pad">
        <p className="eyebrow eyebrow--accent">Progress</p>
        <h1 className="mt-2" style={{ fontSize: "var(--text-2xl)" }}>
          The trend, not the day.
        </h1>
        <div className="card card--sunken mt-5" style={{ padding: "var(--space-8)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
            Your chart starts with your first Sunday check-in. One data point at a time. That&apos;s
            the whole game.
          </p>
        </div>
      </main>
    );
  }

  const weights = points.map((c) => Number(c.dry_weight_lbs));
  const checkinPts = points.map((c) => ({ t: new Date(c.submitted_at).getTime(), lbs: Number(c.dry_weight_lbs), id: c.id as string, week: c.iso_week as string }));
  const dailyPts = daily.map((d) => ({ t: new Date(d.date + "T12:00:00").getTime(), lbs: d.lbs }));
  const allPts = [...checkinPts, ...dailyPts];
  const allVals = [...allPts.map((p2) => p2.lbs), ...(goal != null ? [goal] : []), ...(start != null ? [start] : [])];
  const min = Math.min(...allVals) - 2;
  const max = Math.max(...allVals) + 2;
  const tMin = Math.min(...allPts.map((p2) => p2.t));
  const tMax = Math.max(...allPts.map((p2) => p2.t));
  const W = 320;
  const H = 140;
  const x = (t: number) => (tMax > tMin ? ((t - tMin) / (tMax - tMin)) * (W - 24) + 12 : W / 2);
  const y = (w: number) => H - 16 - ((w - min) / (max - min)) * (H - 32);
  const dailySorted = [...dailyPts].sort((a, b) => a.t - b.t);
  const dailyPath = dailySorted.map((d, i) => `${i === 0 ? "M" : "L"}${x(d.t)},${y(d.lbs)}`).join(" ");
  const checkinSorted = [...checkinPts].sort((a, b) => a.t - b.t);
  const path = checkinSorted.map((c, i) => `${i === 0 ? "M" : "L"}${x(c.t)},${y(c.lbs)}`).join(" ");

  const avgMeal = points.length ? (points.reduce((a, c) => a + c.meal_rating, 0) / points.length).toFixed(1) : "—";
  const avgFit = points.length ? (points.reduce((a, c) => a + c.fitness_rating, 0) / points.length).toFixed(1) : "—";

  return (
    <main className="page-pad">
      <p className="eyebrow eyebrow--accent">Progress</p>
      <h1 className="mt-2" style={{ fontSize: "var(--text-2xl)" }}>
        The trend, not the day.
      </h1>

      <section className="card mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow">Dry weight</h2>
          <span className="metric" style={{ fontSize: "var(--text-sm)", color: "var(--pink-700)" }}>
            {[...allPts].sort((a, b) => b.t - a.t)[0].lbs} lbs
          </span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-3 w-full"
          role="img"
          aria-label={`Weight trend: ${dailySorted.length} daily weigh-ins and ${points.length} check-ins.${goal != null ? ` Goal is ${goal} pounds.` : ""}`}
        >
          {goal != null && (
            <>
              <line x1="12" x2={W - 12} y1={y(goal)} y2={y(goal)} stroke="var(--yellow-deep)" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x={W - 12} y={y(goal) - 5} textAnchor="end" fontSize="9" fill="var(--yellow-deep)" fontFamily="var(--font-numeric)">
                goal {goal}
              </text>
            </>
          )}
          {dailySorted.length > 1 && (
            <path d={dailyPath} fill="none" stroke="var(--pink-300)" strokeWidth="1.5" strokeLinecap="round" />
          )}
          {dailySorted.map((d) => (
            <circle key={d.t} cx={x(d.t)} cy={y(d.lbs)} r="2" fill="var(--pink-300)" />
          ))}
          {checkinSorted.length > 1 && <path d={path} fill="none" stroke="var(--pink-500)" strokeWidth="2.5" strokeLinecap="round" />}
          {checkinSorted.map((c) => (
            <circle key={c.id} cx={x(c.t)} cy={y(c.lbs)} r="4.5" fill="var(--pink-500)" stroke="var(--white)" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="flex justify-between" style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
          <span className="metric">{new Date(tMin).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          {dailySorted.length > 0 && (
            <span style={{ color: "var(--pink-400, #FF6FA5)" }}>· daily weigh-ins · dots = check-ins ·</span>
          )}
          <span className="metric">{new Date(tMax).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Check-ins", value: `${checkins.length}`, sub: "logged" },
          { label: "Meals avg", value: avgMeal, sub: "of 5" },
          { label: "Training avg", value: avgFit, sub: "of 5" },
        ].map((s) => (
          <div key={s.label} className="card text-center" style={{ padding: "var(--space-4)" }}>
            <p className="metric" style={{ fontSize: "var(--text-xl)", color: "var(--pink-700)" }}>
              {s.value}
            </p>
            <p style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>{s.sub}</p>
            <p className="eyebrow mt-1" style={{ fontSize: 9 }}>
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {points.length > 0 && (
        <PhotoCompare
          firstId={points[0].id}
          latestId={points[points.length - 1].id}
          labels={[points[0], points[points.length - 1]].map((c) => ({ week: c.iso_week, weight: Number(c.dry_weight_lbs) }))}
        />
      )}
    </main>
  );
}

async function PhotoCompare({
  firstId,
  latestId,
  labels,
}: {
  firstId: string;
  latestId: string;
  labels: { week: string; weight: number }[];
}) {
  const supabase = await supabaseServer();
  const { data: photos } = await supabase
    .from("checkin_photos")
    .select("checkin_id, pose, storage_path")
    .in("checkin_id", firstId === latestId ? [firstId] : [firstId, latestId])
    .eq("pose", "front");
  const paths = (photos ?? []).map((p) => p.storage_path);
  const urls = await getSignedUrls("progress-photos", paths);
  const byCheckin = Object.fromEntries((photos ?? []).map((p) => [p.checkin_id, urls[p.storage_path]]));

  return (
    <section className="mt-6">
      <h2 className="eyebrow">Photo compare</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[firstId, latestId].map((id, i) => (
          <figure key={`${id}-${i}`} style={{ margin: 0 }}>
            {byCheckin[id] ? (
              <img
                src={byCheckin[id]}
                alt={`${i === 0 ? "First" : "Latest"} front progress photo`}
                style={{ aspectRatio: "3/4", width: "100%", objectFit: "cover", borderRadius: "var(--radius-media)" }}
              />
            ) : (
              <div
                className="flex items-center justify-center"
                style={{ aspectRatio: "3/4", borderRadius: "var(--radius-media)", background: "var(--surface-sunken)", border: "var(--rule-hairline)" }}
              >
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>No photo yet</span>
              </div>
            )}
            <figcaption className="mt-2 text-center" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              {i === 0 ? "First" : "Latest"} · {labels[i].week} · <span className="metric">{labels[i].weight} lbs</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
