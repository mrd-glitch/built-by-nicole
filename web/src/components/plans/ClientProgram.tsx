"use client";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { WorkoutDay, type WorkoutHandle } from "@/components/WorkoutDay";
import { loadClientWorkout } from "@/lib/plans/workout-actions";
import type {
  ClientWorkoutPeriod,
  LoadWorkoutPeriod,
  WorkoutAPI,
} from "@/lib/plans/workout";
import styles from "./workout.module.css";

export function ClientProgram({
  initial,
  load = loadClientWorkout,
  api,
  updateUrl = true,
}: {
  initial: ClientWorkoutPeriod;
  load?: LoadWorkoutPeriod;
  api?: WorkoutAPI;
  updateUrl?: boolean;
}) {
  const [period, setPeriod] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const workout = useRef<WorkoutHandle>(null);
  const moving = useRef(false);
  async function navigate(week: number, day: number) {
    if (moving.current) return;
    moving.current = true;
    setBusy(true);
    setError("");
    try {
      if (workout.current && !(await workout.current.flush())) {
        setError(
          "Save or correct the highlighted set before switching workouts. Your entries are still here.",
        );
        return;
      }
      const result = await load(week, day);
      if (result.error || !result.data) {
        setError(
          result.error ??
            "Your plan has changed. Reload to open your current workouts.",
        );
        return;
      }
      setPeriod(result.data);
      if (updateUrl)
        window.history.replaceState(
          null,
          "",
          `/app/fitness?week=${week}&day=${day}`,
        );
    } catch {
      setError(
        "Could not load that workout. Your current workout is still open; try the tab again.",
      );
    } finally {
      moving.current = false;
      setBusy(false);
    }
  }
  return (
    <div
      className={styles.program}
      style={
        {
          "--workout-bottom": updateUrl
            ? "calc(84px + env(safe-area-inset-bottom))"
            : "env(safe-area-inset-bottom)",
        } as CSSProperties
      }
    >
      <header className={styles.programHeader}>
        <h1>{period.name}</h1>
        <p>
          {period.weeks} weeks · {period.days.length} workouts per week
        </p>
      </header>
      <nav aria-label="Workout weeks" className={styles.weeks}>
        {Array.from({ length: period.weeks }, (_, i) => i + 1).map((week) => (
          <button
            key={week}
            type="button"
            aria-pressed={week === period.selectedWeek}
            disabled={busy}
            onClick={() => void navigate(week, period.selectedDay)}
          >
            Week {week}
            {week === period.currentWeek && <span>Current week</span>}
          </button>
        ))}
      </nav>
      <nav aria-label="Workout days" className={styles.days}>
        {period.days.map((day) => {
          const result = period.progress.find(
            (p) => p.week === period.selectedWeek && p.day === day.day,
          );
          return (
            <button
              key={day.day}
              type="button"
              aria-pressed={day.day === period.selectedDay}
              disabled={busy}
              onClick={() => void navigate(period.selectedWeek, day.day)}
            >
              <strong>Day {day.day}</strong>
              <span>{day.title}</span>
              {result && (
                <small>{result.completed ? "Completed" : "In progress"}</small>
              )}
            </button>
          );
        })}
      </nav>
      <p className={styles.periodStatus} role="status">
        {busy
          ? "Saving and opening workout…"
          : `Week ${period.selectedWeek} of ${period.weeks} · Day ${period.selectedDay}`}
      </p>
      {error && (
        <p className={styles.notice} role="alert">
          {error}
        </p>
      )}
      {!!period.legacySessions?.length && (
        <details className={styles.notice}>
          <summary>Earlier unfinished workouts</summary>
          <p>These older workouts do not have a recorded week.</p>
          {period.legacySessions.map((s) => (
            <Link
              key={s.id}
              className="btn btn--quiet mt-2"
              href={`/app/fitness/${s.dayId}?session=${s.id}`}
            >
              Resume {new Date(s.startedAt).toLocaleDateString()}
            </Link>
          ))}
        </details>
      )}
      <WorkoutDay
        key={`${period.assignmentId}:${period.selectedWeek}:${period.selectedDay}:${period.session?.id ?? "new"}`}
        ref={workout}
        day={period.day}
        assignmentId={period.assignmentId}
        initialSession={period.session}
        lastEntries={[]}
        week={period.selectedWeek}
        totalWeeks={period.weeks}
        api={api}
        onSessionStatus={(completed) =>
          setPeriod((p) => ({
            ...p,
            progress: [
              { week: p.selectedWeek, day: p.selectedDay, completed },
              ...p.progress.filter(
                (x) => x.week !== p.selectedWeek || x.day !== p.selectedDay,
              ),
            ],
          }))
        }
        embedded
        navigationBusy={busy}
      />
    </div>
  );
}
