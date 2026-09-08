export interface Prescription {
  sets: string;
  reps: string;
  weight: string;
}
export interface PlanExercise extends Prescription {
  id: string;
  exerciseId: string;
  name: string;
  instructions: string;
  optional: boolean;
  optionalNote: string;
  overrides: Record<string, Prescription>;
}
export interface PlanBlock {
  id: string;
  label: string;
  rest: string;
  exercises: PlanExercise[];
}
export interface PlanDay {
  id: string;
  title: string;
  blocks: PlanBlock[];
}
export interface PlanDocument {
  name: string;
  description: string;
  weeks: string;
  days: PlanDay[];
}
export interface LibraryExercise {
  id: string;
  name: string;
  youtube_url: string | null;
  cue: string | null;
  thumb_path?: string | null;
}
export interface BuilderVersion {
  id: string;
  programs: {
    id: string;
    name: string;
    description: string | null;
    weeks: number;
    is_template: boolean;
  };
  program_assignments: {
    id: string;
    active: boolean;
    client_id: string;
    profiles: { id: string; full_name: string } | null;
  }[];
  program_days: {
    id: string;
    title: string;
    position: number;
    day: number;
    day_blocks: {
      id: string;
      label: string;
      rest_note: string | null;
      position: number;
      block_exercises: {
        id: string;
        exercise_id: string;
        exercise_name: string;
        sets: number;
        rep_range: string;
        target_weight_lbs: number | null;
        optional: boolean;
        optional_note: string | null;
        directions: string | null;
        position: number;
        program_week_overrides?: {
          week: number;
          sets: number | null;
          rep_range: string | null;
          target_weight_lbs: number | null;
        }[];
      }[];
    }[];
  }[];
}
export interface Draft {
  id: string;
  revision: number;
  document: PlanDocument;
  sourceAssignmentId: string | null;
}
export type Result<T> =
  { data: T; error?: never } | { data?: never; error: string };
export interface BuilderAPI {
  open(versionId: string): Promise<Result<Draft>>;
  save(
    id: string,
    revision: number,
    document: PlanDocument,
  ): Promise<Result<{ revision: number }>>;
  apply(
    id: string,
    revision: number,
    clientId: string | null,
  ): Promise<Result<{ versionId: string; clientId: string | null }>>;
  discard(id: string, revision: number): Promise<Result<null>>;
}
export function documentFromVersion(v: BuilderVersion): PlanDocument {
  return {
    name: v.programs.name,
    description: v.programs.description ?? "",
    weeks: String(v.programs.weeks),
    days: [...v.program_days]
      .sort((a, b) => a.position - b.position || a.day - b.day)
      .map((d) => ({
        id: d.id,
        title: d.title,
        blocks: [...d.day_blocks]
          .sort((a, b) => a.position - b.position)
          .map((b) => ({
            id: b.id,
            label: b.label,
            rest: b.rest_note ?? "",
            exercises: [...b.block_exercises]
              .sort((a, b) => a.position - b.position)
              .map((e) => ({
                id: e.id,
                exerciseId: e.exercise_id,
                name: e.exercise_name,
                sets: String(e.sets),
                reps: e.rep_range,
                weight:
                  e.target_weight_lbs == null
                    ? ""
                    : String(e.target_weight_lbs),
                instructions: e.directions ?? "",
                optional: e.optional,
                optionalNote: e.optional_note ?? "",
                overrides: Object.fromEntries(
                  (e.program_week_overrides ?? []).map((o) => [
                    String(o.week),
                    {
                      sets: o.sets == null ? "" : String(o.sets),
                      reps: o.rep_range ?? "",
                      weight:
                        o.target_weight_lbs == null
                          ? ""
                          : String(o.target_weight_lbs),
                    },
                  ]),
                ),
              })),
          })),
      })),
  };
}
export function resolvePrescription(
  e: PlanExercise,
  week: number,
): Prescription {
  const o = e.overrides[String(week)];
  return {
    sets: o?.sets || e.sets,
    reps: o?.reps || e.reps,
    weight: o?.weight || e.weight,
  };
}
export function prescriptionError(
  p: Prescription,
  optional = false,
): string | null {
  if (
    (!optional || p.sets !== "") &&
    (!/^\d+$/.test(p.sets) || Number(p.sets) < 1 || Number(p.sets) > 30)
  )
    return "Sets must be a whole number from 1 to 30.";
  if ((!optional || p.reps !== "") && (!p.reps.trim() || p.reps.length > 60))
    return "Enter a rep target, such as 5–7 (up to 60 characters).";
  if (
    p.weight !== "" &&
    (!/^\d+(\.\d+)?$/.test(p.weight) || Number(p.weight) > 3000)
  )
    return "Weight must be 0–3000 lb, or blank.";
  return null;
}
export function documentError(d: PlanDocument): string | null {
  if (!d.name.trim() || d.name.length > 160)
    return "Enter a plan name (up to 160 characters).";
  if (!/^\d+$/.test(d.weeks) || Number(d.weeks) < 1 || Number(d.weeks) > 52)
    return "Program length must be 1–52 weeks.";
  if (d.description.length > 5000 || d.days.length < 1 || d.days.length > 14)
    return "Use 1–14 workout days and a description under 5,000 characters.";
  const ids = new Set<string>();
  for (const day of d.days) {
    if (!day.title.trim() || day.title.length > 160)
      return "Every day needs a name (up to 160 characters).";
    if (day.blocks.length > 100) return "Use no more than 100 blocks per day.";
    for (const block of day.blocks) {
      if (!block.exercises.length || block.exercises.length > 30)
        return "Each block needs 1–30 exercises.";
      for (const e of block.exercises) {
        if (ids.has(e.id)) return "Exercise row IDs must be unique.";
        ids.add(e.id);
        if (!e.name.trim() || e.name.length > 160 || !e.exerciseId)
          return "Each exercise needs a name and library selection.";
        if (e.instructions.length > 2000 || e.optionalNote.length > 2000)
          return "Exercise notes must be under 2,000 characters.";
        const error = prescriptionError(e);
        if (error) return `${e.name}: ${error}`;
        for (const [week, p] of Object.entries(e.overrides)) {
          if (!/^\d+$/.test(week) || Number(week) < 2 || Number(week) > 52)
            return "Weekly overrides must use weeks 2–52.";
          const err = prescriptionError(p, true);
          if (err) return `${e.name}, week ${week}: ${err}`;
        }
      }
    }
  }
  return null;
}
export function actualSetError(reps: string, weight: string): string | null {
  if (!/^\d+$/.test(reps) || Number(reps) > 1000)
    return "Enter actual reps as a whole number from 0 to 1000.";
  if (!/^\d+(\.\d+)?$/.test(weight) || Number(weight) > 3000)
    return "Enter a weight from 0 to 3000 lb. Use 0 for bodyweight.";
  return null;
}
