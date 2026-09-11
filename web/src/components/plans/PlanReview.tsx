"use client";
import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ProgramBuilder,
  toWorkoutDay,
} from "@/components/builder/ProgramBuilder";
import { ClientProgram } from "./ClientProgram";
import { WorkoutHistory } from "./WorkoutHistory";
import { RemoveMealPlan } from "./RemoveMealPlan";
import {
  documentFromVersion,
  type BuilderAPI,
  type BuilderVersion,
  type Draft,
  type LibraryExercise,
  type PlanDocument,
} from "@/lib/plans/model";
import type {
  ClientWorkoutPeriod,
  HistorySession,
  WorkoutAPI,
  WorkoutSessionData,
} from "@/lib/plans/workout";

const key = "bbn-local-plan-review-v2";
const library: LibraryExercise[] = [
  {
    id: "20000000-0000-4000-8000-000000000004",
    name: "Strict pull-ups",
    youtube_url: null,
    cue: "Start from a controlled hang. Keep each rep smooth.",
  },
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "Goblet squat",
    youtube_url: null,
    cue: "Keep the whole foot grounded.",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    name: "Dumbbell row",
    youtube_url: null,
    cue: null,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    name: "Romanian deadlift",
    youtube_url: null,
    cue: null,
  },
];
const version: BuilderVersion = {
  id: "40000000-0000-4000-8000-000000000001",
  programs: {
    id: "30000000-0000-4000-8000-000000000001",
    name: "Strength for a full life",
    description:
      "Four days of steady strength work. Focus on comfortable technique and tell me how each set feels.",
    weeks: 6,
    is_template: false,
  },
  program_assignments: [
    {
      id: "80000000-0000-4000-8000-000000000001",
      active: true,
      client_id: "10000000-0000-4000-8000-000000000002",
      profiles: {
        id: "10000000-0000-4000-8000-000000000002",
        full_name: "Alex · local example",
      },
    },
  ],
  program_days: Array.from({ length: 4 }, (_, i) => ({
    id: `50000000-0000-4000-8000-00000000000${i + 1}`,
    title: ["Pull-up practice", "Lower body", "Upper body", "Full body"][i],
    day: i + 1,
    position: i,
    day_blocks: [
      {
        id: `60000000-0000-4000-8000-00000000000${i + 1}`,
        label: "",
        rest_note: "90 seconds",
        position: 0,
        block_exercises: [
          {
            id: `70000000-0000-4000-8000-00000000000${i + 1}`,
            exercise_id: library[i].id,
            exercise_name: library[i].name,
            sets: i === 0 ? 7 : 4,
            set_types: i === 0 ? [] : ["warmup", "warmup", "working", "working"],
            rep_range: i === 0 ? "7" : "5–7",
            target_weight_lbs: i === 0 ? 0 : null,
            optional: false,
            optional_note: null,
            directions:
              "Move with control. Choose a weight that lets you keep good form.",
            position: 0,
            program_week_overrides:
              i === 0
                ? []
                : [
                    {
                      week: 2,
                      sets: 4,
                      rep_range: "6–8",
                      target_weight_lbs: null,
                    },
                  ],
          },
        ],
      },
    ],
  })),
};
interface Store {
  draft: Draft;
  applied: PlanDocument;
  sessions: WorkoutSessionData[];
  selection: { week: number; day: number };
  meal: boolean;
}
function fresh(): Store {
  const document = documentFromVersion(version);
  const pastDay = toWorkoutDay(document, 0, 1, library);
  const past: WorkoutSessionData = {
    id: crypto.randomUUID(),
    day: pastDay,
    week: 1,
    started_at: "2026-09-01T17:00:00.000Z",
    finished_at: "2026-09-01T17:30:00.000Z",
    entries: [7, 7, 7, 7, 7, 5, 4].map((reps, set_index) => ({
      block_exercise_id: pastDay.day_blocks[0].block_exercises[0].id,
      exercise_id: library[0].id,
      set_index,
      reps,
      weight_lbs: 0,
    })),
  };
  return {
    draft: {
      id: crypto.randomUUID(),
      revision: 1,
      document,
      sourceAssignmentId: version.program_assignments[0].id,
    },
    applied: structuredClone(document),
    sessions: [past],
    selection: { week: 2, day: 1 },
    meal: true,
  };
}
function read(): Store {
  const raw = localStorage.getItem(key);
  return raw ? { selection: { week: 2, day: 1 }, ...JSON.parse(raw) } : fresh();
}
function write(s: Store) {
  localStorage.setItem(key, JSON.stringify(s));
}
const subscribe = () => () => {};
export function PlanReview() {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [view, setView] = useState<"editor" | "client" | "coach">(() =>
      typeof window === "undefined"
        ? "editor"
        : (localStorage.getItem(`${key}:view`) as
            "editor" | "client" | "coach") || "editor",
    ),
    [reset, setReset] = useState(0),
    [fail, setFail] = useState(false),
    [removed, setRemoved] = useState(false);
  const failure = useRef(false);
  const api = useMemo<BuilderAPI>(
    () => ({
      async open() {
        const s = read();
        write(s);
        return { data: structuredClone(s.draft) };
      },
      async save(id, revision, document) {
        await new Promise((r) => setTimeout(r, 200));
        if (failure.current)
          return {
            error:
              "Simulated save failure. Your edits are still here. Turn off the failure switch and retry.",
          };
        const s = read();
        if (s.draft.id !== id || s.draft.revision !== revision)
          return {
            error:
              "This draft changed in another window. Reload before applying.",
          };
        s.draft.document = document;
        s.draft.revision++;
        write(s);
        return { data: { revision: s.draft.revision } };
      },
      async apply(id, revision) {
        const s = read();
        if (s.draft.id !== id || s.draft.revision !== revision)
          return { error: "Draft changed. Reload before applying." };
        if (failure.current)
          return {
            error: "Simulated apply failure. Your current plan is unchanged.",
          };
        s.applied = structuredClone(s.draft.document);
        write(s);
        return {
          data: {
            versionId: version.id,
            clientId: version.program_assignments[0].client_id,
          },
        };
      },
      async discard() {
        const s = read();
        s.draft = {
          ...s.draft,
          revision: s.draft.revision + 1,
          document: structuredClone(s.applied),
        };
        write(s);
        return { data: null };
      },
    }),
    [],
  );
  const workoutAPI = useMemo<WorkoutAPI>(
    () => ({
      async start(dayId, _assignment, week) {
        const s = read();
        let session = s.sessions.find(
          (x) => x.day.id === dayId && x.week === week,
        );
        if (!session) {
          const index = s.applied.days.findIndex((d) => d.id === dayId);
          if (index < 0)
            return { error: "Workout has changed. Open the current plan." };
          session = {
            id: crypto.randomUUID(),
            day: toWorkoutDay(s.applied, index, week, library),
            week,
            started_at: new Date().toISOString(),
            finished_at: null,
            entries: [],
          };
          s.sessions.unshift(session);
          write(s);
        }
        return { data: session };
      },
      async save(id, entry) {
        if (failure.current)
          return { error: "Simulated connection loss. Retry this set." };
        const s = read(),
          session = s.sessions.find((x) => x.id === id);
        if (!session || session.finished_at)
          return { error: "Session unavailable or already completed" };
        session.entries = session.entries.filter(
          (e) =>
            e.block_exercise_id !== entry.block_exercise_id ||
            e.set_index !== entry.set_index,
        );
        session.entries.push(entry);
        write(s);
        return { data: null };
      },
      async finish(id, entries) {
        if (failure.current)
          return {
            error: "Simulated finish failure. Your workout is still open.",
          };
        const s = read(),
          session = s.sessions.find((x) => x.id === id);
        if (!session) return { error: "Session not found" };
        session.entries = entries;
        session.finished_at = new Date().toISOString();
        write(s);
        return { data: null };
      },
    }),
    [],
  );
  if (!ready) return <p>Opening local review…</p>;
  const state = read();
  const history: HistorySession[] = [...state.sessions]
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .map((s) => ({
      id: s.id,
      started_at: s.started_at,
      finished_at: s.finished_at,
      program_week: s.week,
      prescription_snapshot: s.day,
      set_entries: s.entries,
      program_days: { title: s.day.title },
    }));
  return (
    <div
      style={{
        maxWidth: 1360,
        margin: "0 auto",
        padding: "24px clamp(16px,3vw,48px)",
      }}
    >
      <Link href="/dev/import-review">Review the workout + meal PDF importer</Link>
      <div
        style={{
          borderBottom: "1px solid var(--grey-300)",
          paddingBottom: 20,
          marginBottom: 28,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600 }}>
          Local review · example client only
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
          Changes stay in this browser. No production accounts, plans, or
          workout logs are changed.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {(["editor", "client", "coach"] as const).map((v) => (
            <button
              key={v}
              className={
                view === v
                  ? "btn btn--primary btn--sm"
                  : "btn btn--ghost btn--sm"
              }
              onClick={() => {
                localStorage.setItem(`${key}:view`, v);
                setView(v);
              }}
            >
              {v === "editor"
                ? "Build plan"
                : v === "client"
                  ? "Client workout"
                  : "Nicole’s review"}
            </button>
          ))}
          <button
            className="btn btn--quiet btn--sm"
            onClick={() => {
              localStorage.removeItem(key);
              setReset((x) => x + 1);
              setRemoved(false);
            }}
          >
            Reset examples
          </button>
        </div>
        <label className="flex gap-2 mt-3" style={{ fontSize: 13 }}>
          <input
            type="checkbox"
            checked={fail}
            onChange={(e) => {
              failure.current = e.target.checked;
              setFail(e.target.checked);
            }}
          />
          Simulate a save failure
        </label>
      </div>
      {view === "editor" && (
        <ProgramBuilder
          key={reset}
          version={version}
          exercises={library}
          clients={[]}
          api={api}
        />
      )}
      {view === "client" && (
        <ClientProgram
          key={reset}
          initial={localPeriod(state.selection.week, state.selection.day)}
          api={workoutAPI}
          updateUrl={false}
          load={async (week = 2, day = 1) => {
            const s = read();
            s.selection = { week, day };
            write(s);
            return { data: localPeriod(week, day) };
          }}
        />
      )}
      {view === "coach" && (
        <div style={{ maxWidth: 880 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 24 }}>
            Alex · local example
          </h1>
          <WorkoutHistory
            key={`${reset}:${JSON.stringify(history)}`}
            clientId={version.program_assignments[0].client_id}
            initialSessions={history}
            load={async (_client, cursor) => {
              const start = cursor
                ? history.findIndex(
                    (s) => `${s.started_at}|${s.id}` === cursor,
                  ) + 1
                : 0;
              return { data: history.slice(start, start + 11) };
            }}
          />
          <section className="card mt-4">
            <h2 style={{ fontWeight: 700 }}>Meal plan</h2>
            {state.meal && !removed ? (
              <>
                <p className="mt-2">Simple weekday meals</p>
                <RemoveMealPlan
                  clientId={version.program_assignments[0].client_id}
                  assignmentId="local-meals"
                  clientName="Alex"
                  planName="Simple weekday meals"
                  onRemoved={() => setRemoved(true)}
                  remove={async () => {
                    if (failure.current)
                      return {
                        error:
                          "Simulated removal failure. The plan is still assigned.",
                      };
                    const s = read();
                    s.meal = false;
                    write(s);
                    return { data: null };
                  }}
                />
              </>
            ) : (
              <p className="mt-2">No meal plan assigned.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function localPeriod(week: number, day: number): ClientWorkoutPeriod {
  const s = read();
  const index = Math.min(day - 1, s.applied.days.length - 1);
  const session =
    s.sessions.find((x) => x.week === week && x.day.day === day) ?? null;
  return {
    name: s.applied.name,
    weeks: Number(s.applied.weeks),
    currentWeek: 2,
    selectedWeek: week,
    selectedDay: index + 1,
    assignmentId: version.program_assignments[0].id,
    days: s.applied.days.map((d, i) => ({ day: i + 1, title: d.title })),
    progress: s.sessions.map((x) => ({
      week: x.week!,
      day: x.day.day,
      completed: !!x.finished_at,
    })),
    day: session?.day ?? toWorkoutDay(s.applied, index, week, library),
    session,
  };
}
