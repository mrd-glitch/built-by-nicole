import type {
  PlanDocument,
  PlanDay,
  PlanBlock,
  LibraryExercise,
  SetType,
} from "../model";
export const MAX_PAYLOAD_BYTES = 400_000;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export interface ImportSet {
  number: number;
  type: SetType;
  target_reps: string;
  target_weight_lb: number | null;
  rest_seconds: number | null;
  instructions: string;
}
export interface ImportExercise {
  key: string;
  name: string;
  library_id: string | null;
  superset_group: string | null;
  optional: boolean;
  instructions: string;
  sets: ImportSet[];
}
export interface CoachNote {
  scope: "client" | "plan" | "week" | "day" | "exercise";
  week: number | null;
  day: number | null;
  exercise_key: string | null;
  text: string;
}
export interface ImportPlan {
  schema: "bbn.workout-import.v1";
  plan_id: string;
  revision: number;
  created_on: string;
  name: string;
  client_name: string | null;
  unit: "lb";
  intro: string;
  coach_notes: CoachNote[];
  weeks: {
    number: number;
    instructions: string;
    days: {
      number: number;
      name: string;
      instructions: string;
      exercises: ImportExercise[];
    }[];
  }[];
}
export interface ParsedImport {
  plan: ImportPlan;
  checksum: string;
  raw: string;
}
const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function object(
  v: unknown,
  keys: string[],
  where: string,
): Record<string, unknown> {
  assert(
    v !== null && typeof v === "object" && !Array.isArray(v),
    `${where}: expected an object.`,
  );
  const r = v as Record<string, unknown>;
  assert(
    Object.keys(r).length === keys.length &&
      keys.every((k) => Object.hasOwn(r, k)),
    `${where}: missing or unsupported fields. Regenerate using Nicole's current workout skill.`,
  );
  return r;
}
function str(v: unknown, max: number, where: string, required = false) {
  assert(
    typeof v === "string" &&
      v.length <= max &&
      (!required || v.trim().length > 0),
    `${where}: ${required ? "enter text" : "use text"} up to ${max} characters.`,
  );
}
function integer(v: unknown, min: number, max: number, where: string) {
  assert(
    typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max,
    `${where}: expected a whole number from ${min} to ${max}.`,
  );
}
function array(v: unknown, min: number, max: number, where: string): unknown[] {
  assert(
    Array.isArray(v) && v.length >= min && v.length <= max,
    `${where}: expected ${min}–${max} items.`,
  );
  return v;
}
export function validateImport(value: unknown): ImportPlan {
  const p = object(
    value,
    [
      "schema",
      "plan_id",
      "revision",
      "created_on",
      "name",
      "client_name",
      "unit",
      "intro",
      "coach_notes",
      "weeks",
    ],
    "Plan",
  );
  assert(
    p.schema === "bbn.workout-import.v1",
    "This workout format is not supported. Use Nicole’s workout assistant admin-upload PDF.",
  );
  assert(
    typeof p.plan_id === "string" && uuid.test(p.plan_id),
    "Invalid plan ID.",
  );
  integer(p.revision, 1, 2147483647, "Revision");
  assert(
    typeof p.created_on === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(p.created_on) &&
      !Number.isNaN(Date.parse(p.created_on)) &&
      new Date(p.created_on).toISOString().slice(0, 10) === p.created_on,
    "Invalid creation date.",
  );
  assert(
    p.unit === "lb",
    "This importer uses pounds. Confirm conversions with Nicole before exporting.",
  );
  str(p.name, 160, "Plan name", true);
  str(p.intro, 5000, "Introduction");
  if (p.client_name !== null) str(p.client_name, 160, "Client name", true);
  const keys = new Map<string, [number, number]>();
  const weeks = array(p.weeks, 1, 52, "Weeks");
  weeks.forEach((wv, wi) => {
    const w = object(wv, ["number", "instructions", "days"], `Week ${wi + 1}`);
    assert(w.number === wi + 1, "Weeks must be numbered consecutively.");
    str(w.instructions, 2000, "Week notes");
    array(w.days, 1, 14, "Workout days").forEach((dv, di) => {
      const d = object(
        dv,
        ["number", "name", "instructions", "exercises"],
        "Day",
      );
      assert(
        d.number === di + 1,
        "Days must be numbered consecutively within each week.",
      );
      str(d.name, 160, "Day name", true);
      str(d.instructions, 2000, "Day notes");
      const closedGroups = new Set<string>();
      let currentGroup: string | null = null;
      array(d.exercises, 1, 100, "Exercises per day").forEach((ev) => {
        const e = object(
          ev,
          [
            "key",
            "name",
            "library_id",
            "superset_group",
            "optional",
            "instructions",
            "sets",
          ],
          "Exercise",
        );
        str(e.key, 160, "Exercise key", true);
        assert(!keys.has(e.key as string), "Exercise keys must be unique.");
        keys.set(e.key as string, [wi + 1, di + 1]);
        str(e.name, 160, "Exercise name", true);
        str(e.instructions, 2000, "Exercise instructions");
        assert(
          typeof e.optional === "boolean",
          "Optional must be true or false.",
        );
        assert(
          e.library_id === null ||
            (typeof e.library_id === "string" && uuid.test(e.library_id)),
          "Invalid library exercise ID.",
        );
        if (e.superset_group !== null)
          str(e.superset_group, 80, "Superset group", true);
        if (currentGroup !== e.superset_group) {
          if (currentGroup) closedGroups.add(currentGroup);
          assert(
            !closedGroups.has(e.superset_group as string),
            "Exercises in each superset must stay together.",
          );
          currentGroup = e.superset_group as string | null;
        }
        array(e.sets, 1, 30, "Exercise sets").forEach((sv, si) => {
          const s = object(
            sv,
            [
              "number",
              "type",
              "target_reps",
              "target_weight_lb",
              "rest_seconds",
              "instructions",
            ],
            "Set",
          );
          assert(s.number === si + 1, "Sets must be numbered consecutively.");
          assert(
            s.type === "warmup" || s.type === "working",
            "Each set must be Warm-up or Working set.",
          );
          str(s.target_reps, 60, "Target reps", true);
          str(s.instructions, 2000, "Set notes");
          assert(
            s.target_weight_lb === null ||
              (typeof s.target_weight_lb === "number" &&
                Number.isFinite(s.target_weight_lb) &&
                s.target_weight_lb >= 0 &&
                s.target_weight_lb <= 3000),
            "Target weight must be blank or 0–3000 lb.",
          );
          if (s.rest_seconds !== null)
            integer(s.rest_seconds, 0, 86400, "Rest seconds");
        });
      });
    });
  });
  array(p.coach_notes, 0, 1000, "Private notes").forEach((nv) => {
    const n = object(
      nv,
      ["scope", "week", "day", "exercise_key", "text"],
      "Private note",
    );
    str(n.text, 2000, "Private note", true);
    assert(
      ["client", "plan", "week", "day", "exercise"].includes(n.scope as string),
      "Invalid private note scope.",
    );
    if (n.scope === "client" || n.scope === "plan")
      assert(
        n.week === null && n.day === null && n.exercise_key === null,
        "Client/plan notes cannot target a particular workout.",
      );
    else {
      integer(n.week, 1, weeks.length, "Private note week");
      const w = weeks[(n.week as number) - 1] as ImportPlan["weeks"][number];
      if (n.scope === "week")
        assert(
          n.day === null && n.exercise_key === null,
          "Week notes cannot target an exercise.",
        );
      else {
        integer(n.day, 1, w.days.length, "Private note day");
        if (n.scope === "day")
          assert(
            n.exercise_key === null,
            "Day notes cannot target an exercise.",
          );
        else {
          const target = keys.get(n.exercise_key as string);
          assert(
            target && target[0] === n.week && target[1] === n.day,
            "Private note refers to an unknown exercise.",
          );
        }
      }
    }
  });
  return value as ImportPlan;
}
export async function decodeImportEnvelope(text: string) {
  assert(
    typeof text === "string" && text.length <= 900_000,
    "This PDF has too much text. Split it into smaller programs.",
  );
  const start = "BEGIN-BBN-PAYLOAD",
    end = "END-BBN-PAYLOAD";
  assert(
    text.split(start).length === 2 && text.split(end).length === 2,
    "No unique plan data section was found. Upload the admin-upload PDF from Nicole’s skill, not the client PDF or a scan.",
  );
  const a = text.indexOf(start),
    b = text.indexOf(end);
  assert(b > a, "The workout data section is incomplete.");
  const header = text.slice(0, a);
  const marker = Math.max(
    header.lastIndexOf("BBN-WORKOUT-IMPORT-V1"),
    header.lastIndexOf("BBN-COACHING-IMPORT-V1"),
  );
  assert(marker >= 0, "Missing coaching format marker.");
  const metadata = header.slice(marker);
  const planId = metadata.match(/Plan-ID:\s*([a-f\d-]{36})/i)?.[1];
  const revision = metadata.match(/Revision:\s*(\d+)/)?.[1];
  const checksum = metadata
    .match(/SHA256:\s*([a-f\d]{64})/i)?.[1]
    ?.toLowerCase();
  assert(
    planId && revision && checksum,
    "Missing plan ID, revision, or checksum. Regenerate the admin PDF.",
  );
  const encoded = text.slice(a + start.length, b).replace(/\s/g, "");
  assert(
    encoded.length <= Math.ceil(MAX_PAYLOAD_BYTES / 3) * 4 &&
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        encoded,
      ),
    "The PDF data is damaged or too large. Regenerate it with the skill.",
  );
  const binary = atob(encoded);
  assert(btoa(binary) === encoded, "Invalid base64 encoding.");
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  assert(
    bytes.length <= MAX_PAYLOAD_BYTES,
    "Workout data exceeds 400 KB. Split the plan into smaller programs.",
  );
  const actual = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  assert(
    actual === checksum,
    "The PDF data does not match its checksum. Regenerate both PDFs from the same revision.",
  );
  let raw: string, value: unknown;
  try {
    raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "The workout data is not valid JSON. Regenerate the admin PDF.",
    );
  }
  return { value, checksum, raw, planId, revision };
}
export function exerciseGroups(plan: ImportPlan) {
  const groups = new Map<
    string,
    {
      key: string;
      name: string;
      libraryId: string | null;
      exerciseKeys: string[];
    }
  >();
  for (const w of plan.weeks)
    for (const d of w.days)
      for (const e of d.exercises) {
        const key = JSON.stringify([e.name.trim().toLowerCase(), e.library_id]);
        const group = groups.get(key) ?? {
          key,
          name: e.name,
          libraryId: e.library_id,
          exerciseKeys: [],
        };
        group.exerciseKeys.push(e.key);
        groups.set(key, group);
      }
  return [...groups.values()];
}
export function initialMatches(plan: ImportPlan, library: LibraryExercise[]) {
  return Object.fromEntries(
    exerciseGroups(plan).map((g) => {
      const exact = g.libraryId
        ? library.filter((e) => e.id === g.libraryId)
        : library.filter(
            (e) => e.name.trim().toLowerCase() === g.name.trim().toLowerCase(),
          );
      return [g.key, exact.length === 1 ? exact[0].id : ""];
    }),
  );
}
export function importDocument(
  plan: ImportPlan,
  matches: Record<string, string>,
  library: LibraryExercise[],
): PlanDocument {
  const chosen = new Map<string, string>();
  for (const group of exerciseGroups(plan)) {
    const id = matches[group.key];
    assert(
      library.some((e) => e.id === id),
      `Choose a library exercise for ${group.name}.`,
    );
    for (const key of group.exerciseKeys) chosen.set(key, id);
  }
  const days: PlanDay[] = [];
  for (const w of plan.weeks)
    for (const d of w.days) {
      const blocks: PlanBlock[] = [];
      let previous: string | null = null;
      for (const e of d.exercises) {
        if (!e.superset_group || e.superset_group !== previous)
          blocks.push({
            id: crypto.randomUUID(),
            label: e.superset_group ?? "",
            rest: "",
            exercises: [],
          });
        blocks
          .at(-1)!
          .exercises.push({
            id: crypto.randomUUID(),
            exerciseId: chosen.get(e.key)!,
            name: e.name,
            sets: String(e.sets.length),
            reps: e.sets[0].target_reps,
            weight:
              e.sets[0].target_weight_lb === null
                ? ""
                : String(e.sets[0].target_weight_lb),
            setTypes: e.sets.map((s) => s.type),
            setTargets: e.sets.map((s) => ({
              reps: s.target_reps,
              weight:
                s.target_weight_lb === null ? "" : String(s.target_weight_lb),
              rest: s.rest_seconds === null ? "" : String(s.rest_seconds),
              instructions: s.instructions,
            })),
            instructions: e.instructions,
            optional: e.optional,
            optionalNote: "",
            overrides: {},
          });
        previous = e.superset_group;
      }
      days.push({
        id: crypto.randomUUID(),
        week: w.number,
        title: d.name,
        instructions: d.instructions,
        blocks,
      });
    }
  return {
    name: plan.name,
    description: plan.intro,
    weeks: String(plan.weeks.length),
    explicitWeeks: true,
    weekNotes: Object.fromEntries(
      plan.weeks.map((w) => [String(w.number), w.instructions]),
    ),
    coachNotes: plan.coach_notes.map((n) => ({
      ...n,
      exerciseName: n.exercise_key
        ? plan.weeks
            .flatMap((w) => w.days.flatMap((d) => d.exercises))
            .find((e) => e.key === n.exercise_key)?.name
        : undefined,
    })),
    days,
  };
}

export async function parseImportText(text: string): Promise<ParsedImport> {
  const e = await decodeImportEnvelope(text);
  const plan = validateImport(e.value);
  if (
    plan.plan_id.toLowerCase() !== e.planId.toLowerCase() ||
    String(plan.revision) !== e.revision
  )
    throw new Error(
      "The PDF header and workout data describe different revisions.",
    );
  return { plan, checksum: e.checksum, raw: e.raw };
}
