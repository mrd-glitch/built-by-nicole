"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { LibraryExercise, Result } from "@/lib/plans/model";
import { exerciseGroups, initialMatches } from "@/lib/plans/import/format";
import {
  parseCoachingText,
  serverImportText,
} from "@/lib/plans/import/coaching";
import { MealImportPreview } from "./MealImportPreview";
type ParsedImport = Awaited<ReturnType<typeof parseCoachingText>>;
import { readWorkoutPdf } from "@/lib/plans/import/read-pdf";
import {
  createImportedDraft,
  type ImportResult,
} from "@/lib/plans/import/actions";
import styles from "../plans.module.css";
export function WorkoutImporter({
  library,
  create = createImportedDraft,
  onCreated,
}: {
  library: LibraryExercise[];
  create?: (
    text: string,
    matches: Record<string, string>,
  ) => Promise<Result<ImportResult>>;
  onCreated?: (result: ImportResult) => void;
}) {
  const [parsed, setParsed] = useState<ParsedImport | null>(null),
    [text, setText] = useState(""),
    [matches, setMatches] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [result, setResult] = useState<ImportResult | null>(null);
  const sequence = useRef(0),
    submitting = useRef(false);
  async function read(file?: File) {
    const seq = ++sequence.current;
    setParsed(null);
    setResult(null);
    setError("");
    setText("");
    if (!file) return;
    setBusy(true);
    setStatus("Reading and checking the PDF…");
    try {
      const content = await readWorkoutPdf(file),
        checked = await parseCoachingText(content);
      if (seq !== sequence.current) return;
      setText(serverImportText(checked));
      setParsed(checked);
      setMatches(
        checked.plan.workout
          ? initialMatches(checked.plan.workout, library)
          : {},
      );
      setStatus("PDF checked. Review the plans below.");
    } catch (e) {
      if (seq === sequence.current) {
        setError(
          e instanceof Error
            ? e.message
            : "Could not read this PDF. Try another export.",
        );
        setStatus("PDF needs attention");
      }
    } finally {
      if (seq === sequence.current) setBusy(false);
    }
  }
  async function submit() {
    if (!parsed || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    setStatus("Creating private draft…");
    try {
      const r = await create(text, matches);
      if (r.error || !r.data)
        throw new Error(r.error ?? "The draft could not be created. Retry.");
      setResult(r.data);
      setStatus(
        r.data.reused
          ? "This revision is already in the portal."
          : "Private draft created. No client assignment has changed.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection lost. Retry creating the draft.",
      );
      setStatus(
        "Draft not confirmed. Retry safely; duplicate uploads reuse the same draft.",
      );
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }
  const workout = parsed?.plan.workout;
  const groups = workout ? exerciseGroups(workout) : [];
  const unresolved = groups.filter(
    (g) => !library.some((e) => e.id === matches[g.key]),
  ).length;
  return (
    <section className={styles.editor} aria-label="Coaching PDF importer">
      <h1>Import a coaching PDF.</h1>
      <p className={styles.hint}>
        Use the admin-upload PDF from Nicole’s Coaching Assistant. Choose a
        workout, meal plan, or combined admin PDF. Review it before assigning
        anything to a client.
      </p>
      <label className={styles.importFile}>
        Admin-upload PDF · up to 10 MB
        <input
          className="input"
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => void read(e.target.files?.[0])}
        />
      </label>
      <p className={styles.hint}>
        Client PDFs and scanned workouts don’t contain the required import data.
        The file is read on this device; its checked plan data is saved when you
        create the draft.
      </p>
      <p role="status" className={styles.saveStatus}>
        {status}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {parsed && (
        <>
          <div className={styles.importSummary}>
            <h2>{parsed.plan.name}</h2>
            <p>
              {parsed.plan.kind === "both"
                ? "Workout + meal plan"
                : parsed.plan.kind === "meal"
                  ? "Meal plan"
                  : "Workout"}{" "}
              · Revision {parsed.plan.revision}
            </p>
            {workout && (
              <p>
                {workout.weeks.length} weeks · {workout.weeks[0].days.length}{" "}
                {workout.weeks[0].days.length === 1 ? "workout" : "workouts"} in
                week 1
              </p>
            )}
            {parsed.plan.client_name && (
              <p>
                Client named in the PDF: {parsed.plan.client_name}. Choose the
                actual client after reviewing the draft.
              </p>
            )}
            <p>Private notes for Nicole: {(workout?.coach_notes.length ?? 0) + (parsed.plan.meal?.coach_notes.length ?? 0)}. These stay out of the client view.</p>
          </div>
          {workout && (
            <>
              <h2 className={styles.importHeading}>
                Match the exercise library
              </h2>
              <p className={styles.hint}>
                Exact, unique matches are selected for you. Choosing a library
                movement keeps the PDF’s exercise label and instructions.
              </p>
              <fieldset className={styles.fields} disabled={busy || !!result}>
                <div className={styles.importMatches}>
                  {groups.map((g) => (
                    <label key={g.key}>
                      {g.name}
                      <select
                        className="input"
                        value={matches[g.key] ?? ""}
                        onChange={(e) =>
                          setMatches((m) => ({ ...m, [g.key]: e.target.value }))
                        }
                      >
                        <option value="">Choose a library movement</option>
                        {library.map((e) => (
                          <option value={e.id} key={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className={styles.hint}>
                {unresolved
                  ? `${unresolved} exercise matches still needed.`
                  : "All exercise matches selected."}{" "}
                Missing a movement?{" "}
                <Link href="/admin/exercises" target="_blank" rel="noreferrer">
                  Add it to the library
                </Link>
                , then reload and choose the PDF again.
              </p>
              <details className={styles.description}>
                <summary>Check the weekly schedule and notes</summary>
                {workout.weeks.map((w) => (
                  <div key={w.number} className={styles.importWeek}>
                    <h3>Week {w.number}</h3>
                    {w.instructions && <p>{w.instructions}</p>}
                    <ul>
                      {w.days.map((d) => (
                        <li key={d.number}>
                          Day {d.number}: {d.name} · {d.exercises.length}{" "}
                          exercises{d.instructions && <p>{d.instructions}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
              {(workout?.coach_notes ?? []).length > 0 && (
                <details className={styles.description}>
                  <summary>
                    Private notes for Nicole · never shown to clients
                  </summary>
                  {(workout?.coach_notes ?? []).map((n, i) => (
                    <p className={styles.hint} key={i}>
                      {n.scope}
                      {n.week ? ` · Week ${n.week}` : ""}
                      {n.day ? ` · Day ${n.day}` : ""}: {n.text}
                    </p>
                  ))}
                </details>
              )}
            </>
          )}
          {parsed.plan.meal && (
            <MealImportPreview meal={parsed.plan.meal} privateNotes />
          )}
          <div className={styles.finishBar}>
            {result ? (
              onCreated ? (
                <button
                  className="btn btn--primary"
                  onClick={() => onCreated(result)}
                >
                  Review imported plans
                </button>
              ) : (
                <>
                  {result.versionId && (
                    <Link
                      className="btn btn--primary"
                      href={`/admin/programs/${result.versionId}`}
                    >
                      Review workout
                    </Link>
                  )}
                  {result.mealVersionId && (
                    <Link
                      className="btn btn--primary"
                      href={`/admin/meal-plans/${result.mealVersionId}`}
                    >
                      Review meal plan
                    </Link>
                  )}
                </>
              )
            ) : (
              <button
                className="btn btn--primary"
                disabled={busy || unresolved > 0}
                onClick={() => void submit()}
              >
                {busy
                  ? "Creating plans…"
                  : error
                    ? "Retry import"
                    : "Create plans for review"}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
