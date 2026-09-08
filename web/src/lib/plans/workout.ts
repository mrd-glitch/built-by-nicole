import type { DayData } from "@/components/WorkoutDay";
import type { Result } from "./model";
export interface SavedSet {
  block_exercise_id: string;
  exercise_id: string;
  set_index: number;
  reps: number;
  weight_lbs: number;
  exercises?: { name: string } | null;
}
export interface WorkoutSessionData {
  id: string;
  day: DayData;
  week: number | null;
  started_at: string;
  finished_at: string | null;
  entries: SavedSet[];
}
export interface WorkoutAPI {
  start(
    dayId: string,
    assignmentId: string,
    week: number,
  ): Promise<Result<WorkoutSessionData>>;
  save(sessionId: string, entry: SavedSet): Promise<Result<null>>;
  finish(sessionId: string, entries: SavedSet[]): Promise<Result<null>>;
}
export interface HistorySession {
  id: string;
  started_at: string;
  finished_at: string | null;
  program_week: number | null;
  prescription_snapshot: DayData | null;
  set_entries: SavedSet[];
  program_days: { title: string } | null;
}

export interface ClientWorkoutPeriod {
  legacySessions?: { id: string; dayId: string; startedAt: string }[];
  name: string;
  weeks: number;
  currentWeek: number;
  selectedWeek: number;
  selectedDay: number;
  days: { day: number; title: string }[];
  progress: { week: number; day: number; completed: boolean }[];
  assignmentId: string;
  day: DayData;
  session: WorkoutSessionData | null;
}
export type LoadWorkoutPeriod = (
  week?: number,
  day?: number,
) => Promise<Result<ClientWorkoutPeriod | null>>;
