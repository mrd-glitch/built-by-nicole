"use client";
import { useState } from "react";
import { loadWorkoutHistory } from "@/lib/plans/workout-actions";
import type { HistorySession } from "@/lib/plans/workout";
import type { Result } from "@/lib/plans/model";
import styles from "./plans.module.css";
export function WorkoutHistory({
  clientId,
  initialSessions,
  initialError,
  load = loadWorkoutHistory,
}: {
  clientId: string;
  initialSessions: HistorySession[];
  initialError?: string;
  load?: (
    clientId: string,
    before?: string,
  ) => Promise<Result<HistorySession[]>>;
}) {
  const [sessions, setSessions] = useState(initialSessions.slice(0, 10));
  const [more, setMore] = useState(initialSessions.length > 10);
  const [error, setError] = useState(initialError ?? "");
  const [busy, setBusy] = useState(false);
  async function older() {
    setBusy(true);
    try {
      const last = sessions.at(-1);
      const result = await load(
        clientId,
        last ? `${last.started_at}|${last.id}` : undefined,
      );
      if (result.error || !result.data) {
        setError(result.error ?? "Could not load workouts.");
        return;
      }
      setSessions((s) => [...s, ...result.data!.slice(0, 10)]);
      setMore(result.data.length > 10);
      setError("");
    } catch {
      setError("Could not load workouts. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={`card ${styles.history}`}>
      <h2>Workout history</h2>
      <p>Prescribed targets and the actual result of every set.</p>
      {error && (
        <div role="alert" className={styles.error}>
          {error}
          <button
            className="btn btn--quiet"
            disabled={busy}
            onClick={() => void older()}
          >
            Retry
          </button>
        </div>
      )}
      {!sessions.length && !error && (
        <p className="mt-4">No workouts logged yet.</p>
      )}
      {sessions.map((s, index) => (
        <details key={s.id} open={index === 0 ? true : undefined}>
          <summary>
            {s.prescription_snapshot?.title ??
              s.program_days?.title ??
              "Workout"}{" "}
            ·{" "}
            {new Date(s.started_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            <br />
            <span>
              {s.finished_at ? "Completed" : "In progress"}
              {s.program_week ? ` · Week ${s.program_week}` : ""}
            </span>
          </summary>
          {s.prescription_snapshot ? (
            s.prescription_snapshot.day_blocks
              .flatMap((b) => b.block_exercises)
              .map((e) => (
                <div key={e.id}>
                  <h3>{e.exercise_name}</h3>
                  {e.target_weight_lbs != null && (
                    <p>Target weight: {e.target_weight_lbs} lb</p>
                  )}
                  <table>
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Target reps</th>
                        <th>Weight (lb)</th>
                        <th>Actual reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: e.sets }, (_, i) => {
                        const entry = s.set_entries.find(
                          (x) =>
                            x.block_exercise_id === e.id && x.set_index === i,
                        );
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{e.rep_range}</td>
                            <td>{entry ? entry.weight_lbs : "Not logged"}</td>
                            <td>{entry ? entry.reps : "Not logged"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
          ) : (
            <>
              <p className="mt-3">
                Older workout: the original prescription was not captured. Saved
                results are shown without inferred targets.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Set</th>
                    <th>Weight (lb)</th>
                    <th>Actual reps</th>
                  </tr>
                </thead>
                <tbody>
                  {s.set_entries.map((e) => (
                    <tr key={`${e.block_exercise_id}:${e.set_index}`}>
                      <td>
                        {e.exercises?.name ??
                          "Exercise (original label unavailable)"}
                      </td>
                      <td>{e.set_index + 1}</td>
                      <td>{e.weight_lbs}</td>
                      <td>{e.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </details>
      ))}
      {more && (
        <button
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => void older()}
        >
          {busy ? "Loading…" : "Load older"}
        </button>
      )}
    </section>
  );
}
