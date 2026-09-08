/* eslint-disable @next/next/no-img-element */
import { WorkoutHistory } from "@/components/plans/WorkoutHistory";
import { loadWorkoutHistory } from "@/lib/plans/workout-actions";
import Link from "next/link";
import { getClientDetail, getDailyWeights, getSignedUrls } from "@/lib/data";
import { AssignPlans } from "@/components/AssignPlans";
import { ClientToggles } from "@/components/ClientToggles";
import { ReplyBox } from "@/components/ReplyBox";
import { MediaBubble } from "@/components/MessageMedia";
import { ReopenCheckin } from "@/components/ReopenCheckin";
import { isoWeekOfDate } from "@/lib/checkin-window";

export const dynamic = "force-dynamic";

export default async function ClientDetail({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const {
    profile,
    checkins,
    messages,
    programAssignment,
    mealAssignment,
    programTemplates,
    mealTemplates,
  } = await getClientDetail(clientId);

  if (!profile) {
    return (
      <main>
        <Link href="/admin/clients">← All clients</Link>
        <p className="mt-4" style={{ color: "var(--text-muted)" }}>
          Client not found.
        </p>
      </main>
    );
  }

  const previousWeek = new Date();
  previousWeek.setDate(previousWeek.getDate() - 7);
  const latest = checkins[0];
  const history = await loadWorkoutHistory(clientId);

  return (
    <main style={{ maxWidth: 980 }}>
      <Link href="/admin/clients" style={{ fontSize: "var(--text-sm)" }}>
        ← All clients
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 style={{ fontSize: "var(--text-2xl)" }}>
          {profile.full_name || profile.email}
        </h1>
        <span className="badge badge--green">{profile.status}</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          <WorkoutHistory
            clientId={clientId}
            initialSessions={history.data ?? []}
            initialError={history.error}
          />
          {/* Latest check-in */}
          <section className="card">
            {latest ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="eyebrow">
                    Latest check-in · {latest.iso_week}
                  </h2>
                  <span className="metric" style={{ color: "var(--pink-700)" }}>
                    {latest.dry_weight_lbs} lbs
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div
                    className="card--sunken card"
                    style={{ padding: "var(--space-3)" }}
                  >
                    <p className="eyebrow" style={{ fontSize: 9 }}>
                      Meals {latest.meal_rating}/5
                    </p>
                    <p className="mt-1" style={{ fontSize: "var(--text-sm)" }}>
                      {latest.meal_note}
                    </p>
                  </div>
                  <div
                    className="card--sunken card"
                    style={{ padding: "var(--space-3)" }}
                  >
                    <p className="eyebrow" style={{ fontSize: 9 }}>
                      Training {latest.fitness_rating}/5
                    </p>
                    <p className="mt-1" style={{ fontSize: "var(--text-sm)" }}>
                      {latest.fitness_note}
                    </p>
                  </div>
                </div>
                {latest.comments && (
                  <p
                    className="mt-3"
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--text-muted)",
                    }}
                  >
                    &ldquo;{latest.comments}&rdquo;
                  </p>
                )}
                <CheckinPhotos
                  photos={
                    (latest.checkin_photos ?? []) as {
                      pose: string;
                      storage_path: string;
                    }[]
                  }
                />
              </>
            ) : (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "var(--text-sm)",
                }}
              >
                No check-ins yet. First one lands Sunday.
              </p>
            )}
          </section>

          {/* Thread */}
          <section className="card">
            <h2 className="eyebrow">Messages</h2>
            <div
              className="mt-3 grid gap-2"
              style={{ maxHeight: 320, overflowY: "auto" }}
            >
              {messages.length === 0 && (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  No messages yet.
                </p>
              )}
              {messages.map((m) => (
                <div key={m.id} style={{ fontSize: "var(--text-sm)" }}>
                  <strong
                    style={{
                      color:
                        m.sender_id !== profile.id
                          ? "var(--pink-700)"
                          : "var(--text-strong)",
                    }}
                  >
                    {m.sender_id !== profile.id
                      ? "You"
                      : profile.first_name || "Client"}
                    :
                  </strong>{" "}
                  {m.kind === "voice" || m.kind === "video" ? (
                    m.media_path ? (
                      <MediaBubble path={m.media_path} kind={m.kind} />
                    ) : (
                      "(media)"
                    )
                  ) : (
                    m.body
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <ReplyBox
                clientId={profile.id}
                placeholder={`Reply to ${profile.first_name || "client"}`}
              />
            </div>
          </section>

          {/* Check-in history */}
          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="eyebrow">Check-in history</h2>
              <ReopenCheckin
                clientId={profile.id}
                week={isoWeekOfDate(
                  previousWeek,
                  profile.timezone ?? "America/Edmonton",
                )}
              />
            </div>
            <div className="mt-3 grid gap-2">
              {checkins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between"
                  style={{
                    borderTop: "var(--rule-hairline)",
                    paddingTop: "var(--space-2)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-sm)" }}>
                    {c.iso_week}
                  </span>
                  <span
                    className="metric"
                    style={{ fontSize: "var(--text-sm)" }}
                  >
                    {c.dry_weight_lbs} lbs · M{c.meal_rating} · T
                    {c.fitness_rating}
                  </span>
                </div>
              ))}
              {checkins.length === 0 && (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Nothing yet.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="grid content-start gap-4">
          <ClientToggles client={profile} />
          <section className="card">
            <h2 className="eyebrow">Weight</h2>
            <p className="metric mt-2" style={{ fontSize: "var(--text-lg)" }}>
              {profile.start_weight_lbs ?? "—"} →{" "}
              {latest?.dry_weight_lbs ?? "—"}
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {" "}
                / goal {profile.goal_weight_lbs ?? "—"}
              </span>
            </p>
            <AdminWeightGraph clientId={profile.id} />
          </section>
          <AssignPlans
            clientId={profile.id}
            clientName={profile.full_name || profile.email}
            program={(() => {
              const v = programAssignment?.program_versions as unknown as {
                id: string;
                programs: {
                  name: string;
                  description: string | null;
                  weeks: number;
                  days_per_week: number;
                };
              } | null;
              return v
                ? {
                    versionId: v.id,
                    name: v.programs.name,
                    description: v.programs.description,
                    weeks: v.programs.weeks,
                    daysPerWeek: v.programs.days_per_week,
                  }
                : null;
            })()}
            meal={(() => {
              const v = mealAssignment?.meal_plan_versions as unknown as {
                id: string;
                meal_plans: { name: string; target_calories: number | null };
              } | null;
              return v
                ? {
                    assignmentId: mealAssignment!.id,
                    versionId: v.id,
                    name: v.meal_plans.name,
                    calories: v.meal_plans.target_calories,
                  }
                : null;
            })()}
            programTemplates={programTemplates as never}
            mealTemplates={mealTemplates as never}
          />
        </aside>
      </div>
    </main>
  );
}

async function CheckinPhotos({
  photos,
}: {
  photos: { pose: string; storage_path: string }[];
}) {
  if (photos.length === 0) return null;
  const order = { front: 0, side: 1, back: 2 } as Record<string, number>;
  const sorted = [...photos].sort(
    (a, b) => (order[a.pose] ?? 9) - (order[b.pose] ?? 9),
  );
  const urls = await getSignedUrls(
    "progress-photos",
    sorted.map((p) => p.storage_path),
  );
  return (
    <div className="mt-3 flex gap-2">
      {sorted.map((p) =>
        urls[p.storage_path] ? (
          <img
            key={p.pose}
            src={urls[p.storage_path]}
            alt={`${p.pose} progress photo`}
            style={{
              aspectRatio: "3/4",
              width: "32%",
              objectFit: "cover",
              borderRadius: "var(--radius-media)",
            }}
          />
        ) : (
          <div
            key={p.pose}
            className="flex flex-1 items-center justify-center"
            style={{
              aspectRatio: "3/4",
              background: "var(--surface-sunken)",
              borderRadius: "var(--radius-media)",
              fontSize: "var(--text-xs)",
              color: "var(--text-faint)",
              textTransform: "capitalize",
            }}
          >
            {p.pose}
          </div>
        ),
      )}
    </div>
  );
}

async function AdminWeightGraph({ clientId }: { clientId: string }) {
  const daily = await getDailyWeights(clientId);
  if (daily.length < 2) return null;
  const pts = daily.map((d) => ({
    t: new Date(d.weigh_date + "T12:00:00").getTime(),
    lbs: Number(d.weight_lbs),
  }));
  const min = Math.min(...pts.map((p) => p.lbs)) - 1;
  const max = Math.max(...pts.map((p) => p.lbs)) + 1;
  const tMin = pts[0].t;
  const tMax = pts[pts.length - 1].t;
  const W = 280;
  const H = 80;
  const x = (t: number) =>
    tMax > tMin ? ((t - tMin) / (tMax - tMin)) * (W - 16) + 8 : W / 2;
  const y = (w: number) => H - 10 - ((w - min) / (max - min)) * (H - 20);
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t)},${y(p.lbs)}`)
    .join(" ");
  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${daily.length} daily weigh-ins`}
      >
        <path
          d={path}
          fill="none"
          stroke="var(--pink-500)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {pts.map((p) => (
          <circle
            key={p.t}
            cx={x(p.t)}
            cy={y(p.lbs)}
            r="2.2"
            fill="var(--pink-500)"
          />
        ))}
      </svg>
      <p style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
        Daily weigh-ins · last {daily.length} days · latest{" "}
        <span className="metric">{pts[pts.length - 1].lbs} lbs</span>
      </p>
    </div>
  );
}
