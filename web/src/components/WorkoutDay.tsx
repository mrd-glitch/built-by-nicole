"use client";

import {
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import Link from "next/link";
import {
  beginWorkout,
  saveWorkoutSet,
  completeWorkout,
} from "@/lib/plans/workout-actions";
import {
  actualSetError,
  setHeading,
  type SetType,
  type SetTarget,
} from "@/lib/plans/model";
import type {
  SavedSet,
  WorkoutAPI,
  WorkoutSessionData,
} from "@/lib/plans/workout";
import styles from "./plans/workout.module.css";

export interface DayData {
  id: string;
  week: number;
  day: number;
  title: string;
  total_weeks?: number;
  intro?: string;
  week_instructions?: string;
  instructions?: string;
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
      set_types?: SetType[];
      set_targets?: SetTarget[];
      rep_range: string;
      target_weight_lbs: number | null;
      optional: boolean;
      optional_note: string | null;
      position: number;
      directions?: string | null;
      exercises: {
        youtube_url: string | null;
        cue: string | null;
        thumb_path: string | null;
      } | null;
    }[];
  }[];
}

interface LastEntry {
  exercise_id: string;
  reps: number;
  weight_lbs: number;
  logged_at: string;
}

type LogKey = `${string}:${number}`;

const liveAPI: WorkoutAPI = {
  start: beginWorkout,
  save: saveWorkoutSet,
  finish: completeWorkout,
};
type SetInput = {
  reps: string;
  weight: string;
  saved?: boolean;
  saving?: boolean;
  error?: string;
};

export interface WorkoutHandle {
  flush(): Promise<boolean>;
}

export function WorkoutDay({
  ref,
  embedded = false,
  navigationBusy = false,
  onSessionStatus,
  day,
  assignmentId,
  lastEntries,
  week = 1,
  totalWeeks = 1,
  readOnly = false,
  legacyPrescription = false,
  initialSession = null,
  api = liveAPI,
}: {
  ref?: Ref<WorkoutHandle>;
  embedded?: boolean;
  navigationBusy?: boolean;
  onSessionStatus?: (completed: boolean) => void;
  day: DayData;
  assignmentId: string;
  lastEntries: LastEntry[];
  week?: number;
  totalWeeks?: number;
  readOnly?: boolean;
  legacyPrescription?: boolean;
  initialSession?: WorkoutSessionData | null;
  api?: WorkoutAPI;
}) {
  const [sessionId, setSessionId] = useState<string | null>(
    initialSession?.id ?? null,
  );
  const [logs, setLogs] = useState<Record<LogKey, SetInput>>(() =>
    Object.fromEntries(
      (initialSession?.entries ?? []).map((e) => [
        `${e.block_exercise_id}:${e.set_index}`,
        { reps: String(e.reps), weight: String(e.weight_lbs), saved: true },
      ]),
    ),
  );
  const latest = useRef(logs);
  const persistedKeys = useRef(new Set(Object.keys(logs)));
  const sessionRef = useRef(sessionId);
  const starting = useRef<Promise<string | null> | null>(null);
  const saves = useRef<Record<string, Promise<boolean>>>({});
  const [trainedAt, setTrainedAt] = useState(
    initialSession?.started_at ?? null,
  );
  const [weightedExercises, setWeightedExercises] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      (initialSession?.entries ?? [])
        .filter((e) => e.weight_lbs > 0)
        .map((e) => [e.block_exercise_id, true]),
    ),
  );
  const [video, setVideo] = useState<string | null>(null);
  const [finished, setFinished] = useState(!!initialSession?.finished_at);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);
  function patch(key: LogKey, value: Partial<SetInput>) {
    latest.current = {
      ...latest.current,
      [key]: { ...(latest.current[key] ?? { reps: "", weight: "" }), ...value },
    };
    setLogs(latest.current);
  }
  const blocks = useMemo(
    () =>
      [...day.day_blocks]
        .sort((a, b) => a.position - b.position)
        .map((b) => ({
          ...b,
          block_exercises: [...b.block_exercises].sort(
            (x, y) => x.position - y.position,
          ),
        })),
    [day],
  );

  const lastFor = (exId: string) =>
    lastEntries.find((s) => s.exercise_id === exId);
  const bestFor = (exId: string) => {
    const mine = lastEntries.filter((s) => s.exercise_id === exId);
    if (!mine.length) return null;
    return Math.max(...mine.map((s) => Number(s.weight_lbs)));
  };

  const totalSets = blocks.reduce(
    (a, b) => a + b.block_exercises.reduce((x, e) => x + e.sets, 0),
    0,
  );
  const doneSets = Object.values(logs).filter((l) => l.saved).length;

  async function ensureSession(): Promise<string | null> {
    if (readOnly) return null;
    if (sessionRef.current) return sessionRef.current;
    if (!starting.current)
      starting.current = api
        .start(day.id, assignmentId, week)
        .then((res) => {
          if (res.error || !res.data) {
            setError(res.error ?? "Couldn't start the workout.");
            return null;
          }
          sessionRef.current = res.data.id;
          setSessionId(res.data.id);
          setTrainedAt(res.data.started_at);
          onSessionStatus?.(!!res.data.finished_at);
          if (res.data.finished_at) {
            setFinished(true);
            onSessionStatus?.(true);
            setError(
              "This workout is already completed. Reopen this day to view its saved results.",
            );
            return null;
          }
          return res.data.id;
        })
        .catch(() => {
          setError("Connection lost. Try saving again.");
          return null;
        })
        .finally(() => {
          starting.current = null;
        });
    return starting.current;
  }
  function entry(
    be: DayData["day_blocks"][number]["block_exercises"][number],
    si: number,
    log: SetInput,
  ): SavedSet {
    return {
      block_exercise_id: be.id,
      exercise_id: be.exercise_id,
      set_index: si,
      reps: Number(log.reps),
      weight_lbs: Number(log.weight),
    };
  }
  async function saveSet(
    be: DayData["day_blocks"][number]["block_exercises"][number],
    si: number,
  ) {
    if (readOnly || finished) return true;
    const key: LogKey = `${be.id}:${si}`;
    const run = async () => {
      const log = latest.current[key];
      if (
        !log ||
        (log.reps === "" &&
          log.weight === "" &&
          !persistedKeys.current.has(key)) ||
        log.saved
      )
        return true;
      const problem = actualSetError(log.reps, log.weight);
      if (problem) {
        patch(key, { error: problem });
        return false;
      }
      const value = { ...log };
      patch(key, { saving: true, error: undefined });
      try {
        const sid = await ensureSession();
        if (!sid) {
          patch(key, {
            saving: false,
            error: "Could not start. Retry this set.",
          });
          return false;
        }
        const res = await api.save(sid, entry(be, si, value));
        if (res.error) {
          patch(key, { saving: false, error: res.error });
          return false;
        }
        persistedKeys.current.add(key);
        const unchanged =
          latest.current[key].reps === value.reps &&
          latest.current[key].weight === value.weight;
        patch(key, { saving: false, saved: unchanged, error: undefined });
        return true;
      } catch {
        patch(key, {
          saving: false,
          error: "Not saved. Check your connection and retry.",
        });
        return false;
      }
    };
    saves.current[key] = (saves.current[key] ?? Promise.resolve(true)).then(
      run,
      run,
    );
    return saves.current[key];
  }
  async function finish(allowIncomplete = false) {
    if (readOnly || finished) return;
    setBusy(true);
    setError(null);
    try {
      await Promise.all(Object.values(saves.current));
      const entries: SavedSet[] = [];
      for (const block of blocks)
        for (const be of block.block_exercises)
          for (let i = 0; i < be.sets; i++) {
            const key: LogKey = `${be.id}:${i}`,
              log = latest.current[key];
            if (
              !log ||
              (!log.reps && !log.weight && !persistedKeys.current.has(key))
            )
              continue;
            const issue = actualSetError(log.reps, log.weight);
            if (issue) {
              patch(key, { error: issue });
              setError("Correct the highlighted set before finishing.");
              return;
            }
            entries.push(entry(be, i, log));
          }
      if (entries.length < totalSets && !allowIncomplete) {
        setConfirmIncomplete(true);
        return;
      }
      const sid = await ensureSession();
      if (!sid) return;
      const result = await api.finish(sid, entries);
      if (result.error) {
        setError(result.error);
        return;
      }
      for (const e of entries)
        patch(`${e.block_exercise_id}:${e.set_index}`, {
          saved: true,
          saving: false,
          error: undefined,
        });
      setFinished(true);
      onSessionStatus?.(true);
    } catch {
      setError(
        "Workout could not be finished. Your entries are still here; try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  useImperativeHandle(ref, () => ({
    async flush() {
      if (readOnly || finished) return true;
      const results = await Promise.all(
        blocks.flatMap((b) =>
          b.block_exercises.flatMap((be) =>
            Array.from({ length: be.sets }, (_, i) => saveSet(be, i)),
          ),
        ),
      );
      return results.every(Boolean);
    },
  }));

  return (
    <section className={embedded ? styles.workout : "page-pad"}>
      {legacyPrescription && (
        <p role="note" className={styles.notice}>
          This workout started before detailed targets were recorded. Your saved
          results are intact; the targets below are the plan’s available
          reference, not a record of its original prescription.
        </p>
      )}
      {!readOnly && !embedded && (
        <Link
          href="/app/fitness"
          style={{ fontSize: "var(--text-sm)", color: "var(--text-accent)" }}
        >
          ← All days
        </Link>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div>
          {!embedded && (
            <p className={styles.periodStatus}>
              {legacyPrescription
                ? "Earlier workout"
                : `Week ${week} of ${totalWeeks}`}{" "}
              · Day {day.day}
            </p>
          )}
          <h2 className={styles.workoutTitle}>{day.title}</h2>
        </div>
        <span
          className="metric"
          style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}
        >
          {doneSets}/{totalSets} sets
        </span>
      </div>

      {trainedAt && (
        <p className={styles.date}>
          Date trained{" "}
          <strong>
            {new Date(trainedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </strong>
        </p>
      )}
      {(day.intro || day.week_instructions || day.instructions) && (
        <details className={styles.instructions} open>
          <summary>Nicole’s notes for this workout</summary>
          {day.intro && <p>{day.intro}</p>}
          {day.week_instructions && (
            <p>
              <strong>Week {week}: </strong>
              {day.week_instructions}
            </p>
          )}
          {day.instructions && <p>{day.instructions}</p>}
        </details>
      )}
      {finished && (
        <p className={styles.complete} role="status">
          Workout completed · {doneSets} of {totalSets} sets logged. Saved
          results are shown below.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-3"
          style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}
        >
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4">
        {blocks.map((block) => (
          <section key={block.id} className={styles.exerciseBlock}>
            <div className="flex items-center justify-between">
              {block.label && (
                <h2
                  style={{
                    color: "var(--text-strong)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {block.label}
                </h2>
              )}
            </div>

            {block.block_exercises.map((be) => {
              const bodyweight =
                (be.set_targets?.length
                  ? be.set_targets.every((t) => t.weight === "0")
                  : be.target_weight_lbs === 0) && !weightedExercises[be.id];
              const last = lastFor(be.exercise_id);
              const pb = bestFor(be.exercise_id);
              const yt = be.exercises?.youtube_url ?? null;
              return (
                <div key={be.id} className={styles.exercise}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      {be.exercises?.thumb_path && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={be.exercises.thumb_path}
                          alt=""
                          width={48}
                          height={48}
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 14,
                            flexShrink: 0,
                            boxShadow: "0 4px 10px rgb(13 13 15 / 0.12)",
                            border: "1.5px solid rgb(255 255 255 / 0.9)",
                          }}
                        />
                      )}
                      <div>
                        <p
                          style={{
                            fontFamily: "var(--font-numeric)",
                            fontWeight: 700,
                            letterSpacing: "-0.01em",
                            color: "var(--text-strong)",
                          }}
                        >
                          {be.exercise_name}
                          {be.optional && (
                            <span
                              className="chip chip--ghost ml-2"
                              style={{ padding: "2px 8px" }}
                            >
                              Optional
                            </span>
                          )}
                        </p>
                        <p className={styles.prescription}>
                          {be.sets} sets
                          {be.set_targets?.length
                            ? " · Targets shown with each set"
                            : ` × ${be.rep_range} reps`}
                          {block.rest_note ? ` · ${block.rest_note} rest` : ""}
                        </p>
                        {!be.set_targets?.length &&
                          be.target_weight_lbs != null && (
                            <p className={styles.targetWeight}>
                              Target weight: {be.target_weight_lbs} lb
                              {(
                                be.set_targets?.length
                                  ? be.set_targets.every(
                                      (t) => t.weight === "0",
                                    )
                                  : be.target_weight_lbs === 0
                              )
                                ? " · Bodyweight"
                                : ""}
                            </p>
                          )}
                        {(last || pb) && (
                          <p
                            className="metric mt-1"
                            style={{
                              fontSize: "var(--text-2xs)",
                              color: "var(--grey-400)",
                            }}
                          >
                            {last
                              ? `Last: ${last.weight_lbs} lbs × ${last.reps}`
                              : ""}
                            {last && pb ? " · " : ""}
                            {pb ? `Best: ${pb} lbs` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    {yt && (
                      <button
                        type="button"
                        className="btn btn--quiet btn--sm"
                        onClick={() => setVideo(video === yt ? null : yt)}
                        aria-expanded={video === yt}
                      >
                        {video === yt ? "Hide" : "Watch"}
                      </button>
                    )}
                  </div>

                  {be.optional_note && (
                    <p
                      className="mt-2"
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      {be.optional_note}
                    </p>
                  )}
                  {(be.directions || be.exercises?.cue) && (
                    <details className={styles.instructions}>
                      <summary>How to do it</summary>
                      {be.directions && <p>{be.directions}</p>}
                      {be.exercises?.cue && (
                        <p>Nicole’s cue: {be.exercises.cue}</p>
                      )}
                    </details>
                  )}

                  {video === yt && yt && (
                    <div
                      className="mt-3 overflow-hidden"
                      style={{
                        borderRadius: "var(--radius-media)",
                        aspectRatio: "16/9",
                      }}
                    >
                      <iframe
                        src={yt}
                        title={`${be.exercise_name} demo`}
                        className="h-full w-full"
                        allow="accelerometer; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {bodyweight && (
                    <p className={styles.bodyweightHint}>
                      Actual reps for each set · bodyweight (0 lb)
                      {!readOnly && !finished && (
                        <button
                          type="button"
                          disabled={busy || navigationBusy}
                          onClick={() =>
                            setWeightedExercises((s) => ({
                              ...s,
                              [be.id]: true,
                            }))
                          }
                        >
                          Log added weight
                        </button>
                      )}
                    </p>
                  )}
                  <div
                    className={`${styles.sets} ${bodyweight ? styles.bodyweight : ""}`}
                  >
                    {Array.from({ length: be.sets }).map((_, si) => {
                      const key: LogKey = `${be.id}:${si}`;
                      const log = logs[key] ?? { reps: "", weight: "" };
                      return (
                        <fieldset
                          key={si}
                          className={styles.setBox}
                          data-saved={!!log.saved}
                        >
                          <legend>{setHeading(si, be.set_types)}</legend>
                          {!!be.set_targets?.[si] && (
                            <div className={styles.targetWeight}>
                              Target: {be.set_targets[si].reps} reps
                              {be.set_targets[si].weight !== "" &&
                                ` · ${be.set_targets[si].weight} lb`}
                              {be.set_targets[si].rest !== "" &&
                                ` · ${be.set_targets[si].rest}s rest`}
                              {be.set_targets[si].instructions && (
                                <p>{be.set_targets[si].instructions}</p>
                              )}
                            </div>
                          )}
                          <div
                            className={`${styles.setRow} ${bodyweight ? styles.repsOnly : ""}`}
                          >
                            {!bodyweight && (
                              <label>
                                <span>Weight (lb)</span>
                                <input
                                  className="input metric"
                                  inputMode="decimal"
                                  placeholder="0"
                                  disabled={
                                    readOnly ||
                                    busy ||
                                    finished ||
                                    navigationBusy
                                  }
                                  aria-label={`${be.exercise_name} set ${si + 1} weight in pounds`}
                                  aria-invalid={!!log.error}
                                  value={log.weight}
                                  onChange={(e) =>
                                    patch(key, {
                                      weight: e.target.value,
                                      saved: false,
                                      error: undefined,
                                    })
                                  }
                                  onBlur={() => void saveSet(be, si)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      e.currentTarget.blur();
                                  }}
                                />
                              </label>
                            )}
                            <label>
                              <span
                                className={bodyweight ? "sr-only" : undefined}
                              >
                                Actual reps
                              </span>
                              <input
                                className="input metric"
                                inputMode="numeric"
                                placeholder="Reps"
                                disabled={
                                  readOnly || busy || finished || navigationBusy
                                }
                                aria-label={`${be.exercise_name} set ${si + 1} actual reps`}
                                aria-invalid={!!log.error}
                                value={log.reps}
                                onChange={(e) =>
                                  patch(key, {
                                    reps: e.target.value,
                                    ...(bodyweight ? { weight: "0" } : {}),
                                    saved: false,
                                    error: undefined,
                                  })
                                }
                                onBlur={() => void saveSet(be, si)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") e.currentTarget.blur();
                                }}
                              />
                            </label>
                          </div>
                          {!readOnly && (
                            <div
                              className={styles.setStatus}
                              aria-live="polite"
                            >
                              {log.saving ? (
                                "Saving…"
                              ) : log.error ? (
                                <>
                                  <span role="alert">{log.error}</span>
                                  <button
                                    className="btn btn--quiet btn--sm"
                                    disabled={busy || navigationBusy}
                                    onClick={() => void saveSet(be, si)}
                                  >
                                    Retry set {si + 1}
                                  </button>
                                </>
                              ) : log.saved ? (
                                "Saved"
                              ) : log.reps || log.weight ? (
                                "Not saved yet"
                              ) : (
                                "Not logged"
                              )}
                            </div>
                          )}
                        </fieldset>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      {!readOnly && !finished && (
        <div
          className="sticky mt-6"
          style={{
            bottom: embedded
              ? "var(--workout-bottom, calc(84px + env(safe-area-inset-bottom)))"
              : "calc(84px + env(safe-area-inset-bottom))",
            margin: "0 calc(-1 * var(--space-4))",
            padding: "var(--space-3) var(--space-4)",
            background:
              "linear-gradient(180deg, transparent, rgb(250 250 248 / 0.9) 30%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <button
            type="button"
            className="btn btn--primary w-full"
            onClick={() => void finish()}
            disabled={busy || navigationBusy}
          >
            {busy
              ? "Saving..."
              : `Finish workout · ${doneSets}/${totalSets} sets`}
          </button>
          {confirmIncomplete && (
            <div className={styles.incomplete} role="alert">
              <p>
                Some sets are not logged. Finish with those sets left
                incomplete?
              </p>
              <button
                className="btn btn--ghost"
                disabled={busy || navigationBusy}
                onClick={() => setConfirmIncomplete(false)}
              >
                Keep logging
              </button>
              <button
                className="btn btn--primary"
                disabled={busy || navigationBusy}
                onClick={() => void finish(true)}
              >
                Finish incomplete workout
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
