import {
  decodeImportEnvelope,
  validateImport,
  type ImportPlan,
} from "./format";
export interface MealNutrients {
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  calories: number | null;
}
export interface MealImport {
  name: string;
  intro: string;
  schedule: string;
  targets: {
    mode: "grams" | "percent";
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    protein_pct: number | null;
    carbs_pct: number | null;
    fat_pct: number | null;
  };
  meals: {
    name: string;
    note: string;
    items: (MealNutrients & { name: string; portion: string })[];
    options: (MealNutrients & {
      text: string;
      tag: "zero_prep" | "rough_day" | null;
    })[];
  }[];
  coach_notes: { meal: number | null; text: string }[];
}
export interface CoachingImport {
  schema: "bbn.coaching-import.v1";
  plan_id: string;
  revision: number;
  created_on: string;
  name: string;
  client_name: string | null;
  kind: "workout" | "meal" | "both";
  workout: ImportPlan | null;
  meal: MealImport | null;
}
function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function fields(
  v: unknown,
  keys: string[],
  label: string,
): Record<string, unknown> {
  check(
    v !== null && typeof v === "object" && !Array.isArray(v),
    `${label}: expected an object.`,
  );
  check(
    Object.keys(v).length === keys.length &&
      keys.every((k) => Object.hasOwn(v, k)),
    `${label}: missing or unsupported fields. Use the current coaching skill.`,
  );
  return v as Record<string, unknown>;
}
function text(v: unknown, max: number, label: string, required = false) {
  check(
    typeof v === "string" &&
      v.length <= max &&
      (!required || v.trim().length > 0),
    `${label}: use ${required ? "nonempty " : ""}text up to ${max} characters.`,
  );
}
function list(v: unknown, min: number, max: number, label: string): unknown[] {
  check(
    Array.isArray(v) && v.length >= min && v.length <= max,
    `${label}: expected ${min}–${max} items.`,
  );
  return v;
}
function number(v: unknown, max: number, label: string) {
  check(
    v === null ||
      (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max),
    `${label}: use a nonnegative number up to ${max}, or null when unspecified.`,
  );
}
export function validateMeal(value: unknown): MealImport {
  const m = fields(
    value,
    ["name", "intro", "schedule", "targets", "meals", "coach_notes"],
    "Meal plan",
  );
  text(m.name, 160, "Meal plan name", true);
  text(m.intro, 5000, "Meal introduction");
  text(m.schedule, 2000, "Meal schedule");
  const t = fields(
    m.targets,
    [
      "mode",
      "calories",
      "protein_g",
      "carbs_g",
      "fat_g",
      "protein_pct",
      "carbs_pct",
      "fat_pct",
    ],
    "Daily targets",
  );
  check(
    t.mode === "grams" || t.mode === "percent",
    "Target mode must be grams or percent.",
  );
  for (const k of ["calories", "protein_g", "carbs_g", "fat_g"])
    number(t[k], k === "calories" ? 20000 : 5000, `Daily ${k}`);
  for (const k of ["protein_pct", "carbs_pct", "fat_pct"])
    number(t[k], 100, `Daily ${k}`);
  if (t.mode === "percent") {
    check(
      ["protein_pct", "carbs_pct", "fat_pct"].every((k) => t[k] !== null),
      "Percent targets require all three percentages.",
    );
    check(
      Math.abs(
        Number(t.protein_pct) + Number(t.carbs_pct) + Number(t.fat_pct) - 100,
      ) < 0.001,
      "Macro percentages must total 100.",
    );
  }
  const meals = list(m.meals, 1, 30, "Meals");
  meals.forEach((v, i) => {
    const meal = fields(
      v,
      ["name", "note", "items", "options"],
      `Meal ${i + 1}`,
    );
    text(meal.name, 160, "Meal name", true);
    text(meal.note, 2000, "Meal note");
    const items = list(meal.items, 0, 50, "Meal items"),
      options = list(meal.options, 0, 30, "Meal alternatives");
    check(
      items.length > 0 !== options.length > 0,
      "Choose either a food list or complete meal alternatives for each meal, so no foods are hidden.",
    );
    items.forEach((v) => {
      const item = fields(
        v,
        ["name", "portion", "protein", "carbs", "fats", "calories"],
        "Food",
      );
      text(item.name, 160, "Food name", true);
      text(item.portion, 500, "Portion", true);
      nutrients(item);
    });
    options.forEach((v) => {
      const option = fields(
        v,
        ["text", "tag", "protein", "carbs", "fats", "calories"],
        "Alternative",
      );
      text(option.text, 2000, "Alternative", true);
      check(
        option.tag === null ||
          option.tag === "zero_prep" ||
          option.tag === "rough_day",
        "Unknown alternative tag.",
      );
      nutrients(option);
    });
  });
  list(m.coach_notes, 0, 1000, "Private meal notes").forEach((v) => {
    const note = fields(v, ["meal", "text"], "Private meal note");
    check(
      note.meal === null ||
        (Number.isInteger(note.meal) &&
          Number(note.meal) >= 1 &&
          Number(note.meal) <= meals.length),
      "Private note refers to an unknown meal.",
    );
    text(note.text, 2000, "Private meal note", true);
  });
  return value as MealImport;
}
function nutrients(v: Record<string, unknown>) {
  for (const k of ["protein", "carbs", "fats", "calories"])
    number(v[k], k === "calories" ? 20000 : 5000, `Food ${k}`);
}
export function validateCoaching(value: unknown): CoachingImport {
  const p = fields(
    value,
    [
      "schema",
      "plan_id",
      "revision",
      "created_on",
      "name",
      "client_name",
      "kind",
      "workout",
      "meal",
    ],
    "Coaching plan",
  );
  check(p.schema === "bbn.coaching-import.v1", "Unsupported coaching format.");
  check(
    typeof p.plan_id === "string" &&
      /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(
        p.plan_id,
      ),
    "Invalid plan ID.",
  );
  check(
    Number.isSafeInteger(p.revision) &&
      Number(p.revision) > 0 &&
      Number(p.revision) <= 2147483647,
    "Invalid revision.",
  );
  check(
    typeof p.created_on === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(p.created_on) &&
      !Number.isNaN(Date.parse(p.created_on)) &&
      new Date(p.created_on).toISOString().slice(0, 10) === p.created_on,
    "Invalid creation date.",
  );
  text(p.name, 160, "Coaching plan name", true);
  if (p.client_name !== null) text(p.client_name, 160, "Client name", true);
  check(
    ["workout", "meal", "both"].includes(String(p.kind)),
    "Choose workout, meal, or both.",
  );
  check(
    (p.workout !== null) === (p.kind === "workout" || p.kind === "both") &&
      (p.meal !== null) === (p.kind === "meal" || p.kind === "both"),
    "The selected plan type must match the included plans.",
  );
  if (p.workout !== null) {
    const w = validateImport(p.workout);
    check(
      w.plan_id === p.plan_id &&
        w.revision === p.revision &&
        w.client_name === p.client_name &&
        w.created_on === p.created_on,
      "Workout identity must match its coaching package.",
    );
  }
  if (p.meal !== null) validateMeal(p.meal);
  return value as CoachingImport;
}
export async function parseCoachingText(text: string) {
  const e = await decodeImportEnvelope(text);
  let plan: CoachingImport;
  if ((e.value as { schema?: string })?.schema === "bbn.workout-import.v1") {
    const w = validateImport(e.value);
    plan = {
      schema: "bbn.coaching-import.v1",
      plan_id: w.plan_id,
      revision: w.revision,
      created_on: w.created_on,
      name: w.name,
      client_name: w.client_name,
      kind: "workout",
      workout: w,
      meal: null,
    };
  } else plan = validateCoaching(e.value);
  check(
    plan.plan_id.toLowerCase() === e.planId.toLowerCase() &&
      String(plan.revision) === e.revision,
    "The PDF header and data describe different revisions.",
  );
  return { plan, checksum: e.checksum, raw: e.raw };
}

/** Send only the checked envelope through the server action, keeping requests bounded. */
export function serverImportText(
  parsed: Awaited<ReturnType<typeof parseCoachingText>>,
): string {
  const bytes = new TextEncoder().encode(parsed.raw);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `BBN-COACHING-IMPORT-V1\nPlan-ID: ${parsed.plan.plan_id}\nRevision: ${parsed.plan.revision}\nSHA256: ${parsed.checksum}\nBEGIN-BBN-PAYLOAD\n${btoa(binary)}\nEND-BBN-PAYLOAD`;
}
