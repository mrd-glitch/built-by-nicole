import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/data";
import { loadClientWorkout } from "@/lib/plans/workout-actions";
import { ClientProgram } from "@/components/plans/ClientProgram";
export const dynamic = "force-dynamic";
export default async function FitnessPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; day?: string }>;
}) {
  if (!(await getSessionUser())) redirect("/login");
  const params = await searchParams;
  const week = params.week ? Number(params.week) : undefined;
  const day = params.day ? Number(params.day) : 1;
  const result = await loadClientWorkout(week, day);
  if (result.error)
    return (
      <main className="page-pad">
        <h1>Your workouts</h1>
        <p role="alert" className="mt-4">
          Could not load your workout. {result.error}
        </p>
        <Link href="/app/fitness" className="btn btn--ghost mt-4">
          Try again
        </Link>
      </main>
    );
  if (!result.data)
    return (
      <main className="page-pad">
        <h1>Your workouts</h1>
        <p className="mt-4">
          No workout plan assigned yet. Nicole will let you know when it’s
          ready.
        </p>
      </main>
    );
  return (
    <main className="page-pad">
      <ClientProgram initial={result.data} />
    </main>
  );
}
