import { redirect } from "next/navigation";
import { currentWeek, getClientHome, getLastEntries, getProgramDay, getSessionUser } from "@/lib/data";
import { WorkoutDay, type DayData } from "@/components/WorkoutDay";

export const dynamic = "force-dynamic";

export default async function WorkoutDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ dayId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { dayId } = await params;
  const { week: weekParam } = await searchParams;
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [day, { assignment }] = await Promise.all([getProgramDay(dayId), getClientHome(session.user.id)]);
  if (!day || !assignment) {
    return (
      <main className="page-pad">
        <p style={{ color: "var(--text-muted)" }}>Workout not found. Head back to Fitness.</p>
      </main>
    );
  }

  const exerciseIds = day.day_blocks.flatMap((b: { block_exercises: { exercise_id: string }[] }) =>
    b.block_exercises.map((e) => e.exercise_id),
  );
  const lastEntries = await getLastEntries(session.user.id, exerciseIds);

  // Resolve this week's prescription: base exercise values overridden by
  // program_week_overrides for the current (or requested) week.
  const version = assignment.program_versions as unknown as { programs: { weeks: number } | null } | null;
  const totalWeeks = version?.programs?.weeks ?? 1;
  const week = Math.min(Math.max(parseInt(weekParam ?? "", 10) || currentWeek(assignment.start_date, totalWeeks), 1), totalWeeks);

  interface Ov { week: number; sets: number | null; rep_range: string | null; target_weight_lbs: number | null }
  const resolved = {
    ...day,
    day_blocks: (day.day_blocks as unknown as { block_exercises: ({ sets: number; rep_range: string; target_weight_lbs: number | null; program_week_overrides?: Ov[] })[] }[]).map((b) => ({
      ...b,
      block_exercises: b.block_exercises.map((e) => {
        const ov = (e.program_week_overrides ?? []).find((o) => o.week === week);
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
    />
  );
}
