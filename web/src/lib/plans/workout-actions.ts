"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { actualSetError, type Result } from "./model";
import type {
  SavedSet,
  WorkoutSessionData,
  HistorySession,
  ClientWorkoutPeriod,
} from "./workout";
async function signedIn() {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  return { db, user };
}
function issue(e: unknown) {
  return e instanceof Error ? e.message : "Connection lost. Please retry.";
}
export async function beginWorkout(
  dayId: string,
  assignmentId: string,
  week: number,
): Promise<Result<WorkoutSessionData>> {
  try {
    const { db } = await signedIn();
    const { data, error } = await db.rpc("bbn_begin_workout", {
      p_day_id: dayId,
      p_assignment_id: assignmentId,
      p_week: week,
    });
    return error ? { error: error.message } : { data };
  } catch (e) {
    return { error: issue(e) };
  }
}
export async function saveWorkoutSet(
  sessionId: string,
  entry: SavedSet,
): Promise<Result<null>> {
  try {
    const problem = actualSetError(
      String(entry.reps),
      String(entry.weight_lbs),
    );
    if (problem) return { error: problem };
    const { db } = await signedIn();
    const { error } = await db.rpc("bbn_save_workout_sets", {
      p_session_id: sessionId,
      p_entries: [entry],
      p_finish: false,
    });
    if (error) return { error: error.message };
    return { data: null };
  } catch (e) {
    return { error: issue(e) };
  }
}
export async function completeWorkout(
  sessionId: string,
  entries: SavedSet[],
): Promise<Result<null>> {
  try {
    for (const e of entries) {
      const problem = actualSetError(String(e.reps), String(e.weight_lbs));
      if (problem) return { error: problem };
    }
    const { db } = await signedIn();
    const { error } = await db.rpc("bbn_save_workout_sets", {
      p_session_id: sessionId,
      p_entries: entries,
      p_finish: true,
    });
    if (error) return { error: error.message };
    revalidatePath("/app");
    revalidatePath("/app/fitness");
    return { data: null };
  } catch (e) {
    return { error: issue(e) };
  }
}
export async function loadWorkoutHistory(
  clientId: string,
  before?: string,
): Promise<Result<HistorySession[]>> {
  try {
    const { db, user } = await signedIn();
    const { data: role } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return { error: "Only Nicole can review client workouts." };
    let q = db
      .from("workout_sessions")
      .select(
        "id,started_at,finished_at,program_week,prescription_snapshot,program_days(title),set_entries(block_exercise_id,exercise_id,set_index,reps,weight_lbs,exercises(name))",
      )
      .eq("client_id", clientId)
      .order("started_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(11);
    if (before) {
      const [time, id] = before.split("|");
      if (
        !/^\d{4}-\d{2}-\d{2}T[\d:.+-]+Z?$/.test(time) ||
        !/^[a-f\d-]{36}$/.test(id)
      )
        return { error: "Invalid history cursor." };
      q = q.or(`started_at.lt.${time},and(started_at.eq.${time},id.lt.${id})`);
    }
    const { data, error } = await q;
    return error
      ? { error: error.message }
      : { data: data as unknown as HistorySession[] };
  } catch (e) {
    return { error: issue(e) };
  }
}

export async function loadClientWorkout(
  week?: number,
  day = 1,
): Promise<Result<ClientWorkoutPeriod | null>> {
  try {
    const { db } = await signedIn();
    const { data, error } = await db.rpc("bbn_client_workout", {
      p_week: week ?? null,
      p_day: day,
    });
    return error ? { error: error.message } : { data };
  } catch (e) {
    return { error: issue(e) };
  }
}
