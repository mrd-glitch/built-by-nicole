import { redirect } from "next/navigation";
import { getClientHome, getLastEntries, getProgramDay, getSessionUser } from "@/lib/data";
import { WorkoutDay, type DayData } from "@/components/WorkoutDay";

export const dynamic = "force-dynamic";

export default async function WorkoutDayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
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

  return (
    <WorkoutDay
      day={day as unknown as DayData}
      assignmentId={assignment.id}
      lastEntries={lastEntries}
    />
  );
}
