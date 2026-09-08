import Link from "next/link";
import { loadClientWorkout } from "@/lib/plans/workout-actions";
import { supabaseServer } from "@/lib/supabase/server";
import type { WorkoutSessionData } from "@/lib/plans/workout";
import { redirect } from "next/navigation";
import {
  currentWeek,
  getClientHome,
  getLastEntries,
  getProgramDay,
  getSessionUser,
} from "@/lib/data";
import { WorkoutDay, type DayData } from "@/components/WorkoutDay";

export const dynamic = "force-dynamic";

export default async function WorkoutDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ dayId: string }>;
  searchParams: Promise<{ week?: string; session?: string }>;
}) {
  const { dayId } = await params;
  const { week: weekParam, session: sessionParam } = await searchParams;
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const db = await supabaseServer();
  // Existing day links open the same week/day browser as the Fitness tab.
  if (!sessionParam) {
    const candidate = await getProgramDay(dayId);
    if (candidate) {
      const period = await loadClientWorkout(
        weekParam ? Number(weekParam) : undefined,
        candidate.day,
      );
      if (period.data && period.data.day.id === dayId)
        redirect(
          `/app/fitness?week=${period.data.selectedWeek}&day=${period.data.selectedDay}`,
        );
    }
  }

  let resumeQuery = db
    .from("workout_sessions")
    .select(
      "id,assignment_id,started_at,finished_at,program_week,prescription_snapshot,set_entries(block_exercise_id,exercise_id,set_index,reps,weight_lbs)",
    )
    .eq("client_id", session.user.id)
    .eq("day_id", dayId)
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1);
  if (sessionParam) resumeQuery = resumeQuery.eq("id", sessionParam);
  const { data: unfinished, error: resumeError } =
    await resumeQuery.maybeSingle();
  if (resumeError)
    return (
      <main className="page-pad">
        <p role="alert">
          Your workout could not be loaded. Please try again before logging
          sets.
        </p>
        <Link href="/app/fitness">Back to workouts</Link>
      </main>
    );
  if (unfinished?.prescription_snapshot) {
    const period = await loadClientWorkout(
      unfinished.program_week ?? undefined,
      unfinished.prescription_snapshot.day,
    );
    if (period.data && period.data.session?.id === unfinished.id)
      redirect(
        `/app/fitness?week=${period.data.selectedWeek}&day=${period.data.selectedDay}`,
      );
    const restored = {
      id: unfinished.id,
      day: unfinished.prescription_snapshot,
      week: unfinished.program_week,
      started_at: unfinished.started_at,
      finished_at: null,
      entries: unfinished.set_entries,
    } as WorkoutSessionData;
    return (
      <WorkoutDay
        day={restored.day}
        assignmentId={unfinished.assignment_id}
        lastEntries={[]}
        initialSession={restored}
        week={restored.week ?? 1}
        totalWeeks={restored.day.total_weeks ?? restored.week ?? 1}
      />
    );
  }
  const [day, home] = await Promise.all([
    getProgramDay(dayId),
    getClientHome(session.user.id),
  ]);
  const assignment = unfinished
    ? (
        await db
          .from("program_assignments")
          .select("id,start_date,version_id,program_versions(programs(weeks))")
          .eq("id", unfinished.assignment_id)
          .eq("client_id", session.user.id)
          .maybeSingle()
      ).data
    : home.assignment;
  if (!day || !assignment || day.version_id !== assignment.version_id) {
    return (
      <main className="page-pad">
        <p style={{ color: "var(--text-muted)" }}>
          Workout not found. Head back to Fitness.
        </p>
      </main>
    );
  }

  const exerciseIds = day.day_blocks.flatMap(
    (b: { block_exercises: { exercise_id: string }[] }) =>
      b.block_exercises.map((e) => e.exercise_id),
  );
  const lastEntries = await getLastEntries(session.user.id, exerciseIds);

  // Resolve this week's prescription: base exercise values overridden by
  // program_week_overrides for the current (or requested) week.
  const version = assignment.program_versions as unknown as {
    programs: { weeks: number } | null;
  } | null;
  const totalWeeks = version?.programs?.weeks ?? 1;
  const week = Math.min(
    Math.max(
      parseInt(weekParam ?? "", 10) ||
        currentWeek(assignment.start_date, totalWeeks),
      1,
    ),
    totalWeeks,
  );

  interface Ov {
    week: number;
    sets: number | null;
    rep_range: string | null;
    target_weight_lbs: number | null;
  }
  const resolved = {
    ...day,
    day_blocks: (
      day.day_blocks as unknown as {
        block_exercises: {
          sets: number;
          rep_range: string;
          target_weight_lbs: number | null;
          program_week_overrides?: Ov[];
        }[];
      }[]
    ).map((b) => ({
      ...b,
      block_exercises: b.block_exercises.map((e) => {
        const ov = (e.program_week_overrides ?? []).find(
          (o) => o.week === week,
        );
        return {
          ...e,
          sets: ov?.sets ?? e.sets,
          rep_range: ov?.rep_range ?? e.rep_range,
          target_weight_lbs: ov?.target_weight_lbs ?? e.target_weight_lbs,
        };
      }),
    })),
  };

  return (
    <WorkoutDay
      day={resolved as unknown as DayData}
      assignmentId={assignment.id}
      lastEntries={lastEntries}
      week={week}
      totalWeeks={totalWeeks}
      legacyPrescription={!!unfinished}
      initialSession={
        unfinished
          ? {
              id: unfinished.id,
              day: resolved as unknown as DayData,
              week: unfinished.program_week,
              started_at: unfinished.started_at,
              finished_at: null,
              entries: unfinished.set_entries as WorkoutSessionData["entries"],
            }
          : null
      }
    />
  );
}
