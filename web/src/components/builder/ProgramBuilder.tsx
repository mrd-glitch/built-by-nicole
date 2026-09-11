"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  openPlanDraft,
  savePlanDraft,
  applyPlanDraft,
  discardPlanDraft,
} from "@/lib/plans/actions";
import {
  documentError,
  documentFromVersion,
  resolvePrescription,
  resolveSetTypes,
  type BuilderAPI,
  type BuilderVersion,
  type Draft,
  type LibraryExercise,
  type PlanDocument,
  type PlanExercise,
} from "@/lib/plans/model";
import { WorkoutDay, type DayData } from "@/components/WorkoutDay";
import { SetTypeEditor } from "@/components/plans/SetTypeEditor";
import styles from "@/components/plans/plans.module.css";

const liveAPI: BuilderAPI = {
  open: openPlanDraft,
  save: savePlanDraft,
  apply: applyPlanDraft,
  discard: discardPlanDraft,
};
export function ProgramBuilder({
  version,
  exercises,
  clients,
  api = liveAPI,
}: {
  version: BuilderVersion;
  exercises: LibraryExercise[];
  clients: { id: string; full_name: string }[];
  api?: BuilderAPI;
}) {
  const router = useRouter();
  const [document, setDocument] = useState(() => documentFromVersion(version));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [week, setWeek] = useState(1);
  const [status, setStatus] = useState("Opening draft…");
  const [savedDocument, setSavedDocument] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [recipient, setRecipient] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const latest = useRef(document),
    currentDraft = useRef<Draft | null>(null),
    saved = useRef(""),
    chain = useRef(Promise.resolve(true));
  const mounted = useRef(true);
  const assigned = version.program_assignments.find((a) => a.active);
  const problem = documentError(document);
  const dirty = JSON.stringify(document) !== savedDocument;
  const day = document.days[activeDay] ?? document.days[0];
  const visibleDays = document.days
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => !document.explicitWeeks || d.week === week);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    api
      .open(version.id)
      .then((result) => {
        if (cancelled) return;
        if (result.error) {
          setError(result.error);
          setStatus("Draft unavailable");
          return;
        }
        if (!result.data) return;
        currentDraft.current = result.data;
        latest.current = result.data.document;
        saved.current = JSON.stringify(result.data.document);
        setSavedDocument(saved.current);
        setDraft(result.data);
        setDocument(result.data.document);
        setStatus("Draft saved");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not open the draft. Reload to try again.");
          setStatus("Draft unavailable");
        }
      });
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [api, version.id]);
  const persist = useCallback(() => {
    const work = async () => {
      const d = currentDraft.current;
      if (!d) return false;
      const doc = structuredClone(latest.current),
        serialized = JSON.stringify(doc),
        issue = documentError(doc);
      if (issue) {
        setStatus("Needs correction");
        return false;
      }
      if (serialized === saved.current) {
        setError(null);
        setStatus("Draft saved");
        return true;
      }
      setStatus("Saving…");
      try {
        const r = await api.save(d.id, d.revision, doc);
        if (r.error || !r.data) {
          setError(r.error ?? "Save failed. Try again.");
          setStatus("Not saved");
          return false;
        }
        d.revision = r.data.revision;
        saved.current = serialized;
        if (mounted.current) {
          setSavedDocument(serialized);
          setError(null);
          setStatus(
            JSON.stringify(latest.current) === serialized
              ? "Draft saved"
              : "Unsaved changes",
          );
        }
        return true;
      } catch {
        setError("Connection lost. Your edits are still here. Retry saving.");
        setStatus("Not saved");
        return false;
      }
    };
    chain.current = chain.current.then(work, work);
    return chain.current;
  }, [api]);
  useEffect(() => {
    if (!draft || problem || !dirty) return;
    const timer = setTimeout(() => void persist(), 600);
    return () => clearTimeout(timer);
  }, [document, draft, problem, dirty, persist]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(latest.current) !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  function edit(fn: (next: PlanDocument) => void) {
    const next = structuredClone(latest.current);
    fn(next);
    latest.current = next;
    setDocument(next);
    setStatus("Unsaved changes");
  }
  function exerciseEdit(id: string, fn: (e: PlanExercise) => void) {
    edit((d) => {
      for (const b of d.days[activeDay].blocks) {
        const e = b.exercises.find((x) => x.id === id);
        if (e) fn(e);
      }
    });
  }
  function changePrescription(
    id: string,
    field: "sets" | "reps" | "weight",
    value: string,
  ) {
    exerciseEdit(id, (e) => {
      if (week === 1 || latest.current.explicitWeeks) {
        e[field] = value;
        if (
          field === "sets" &&
          e.setTargets &&
          /^\d+$/.test(value) &&
          Number(value) >= 1 &&
          Number(value) <= 30
        ) {
          e.setTargets = Array.from(
            { length: Number(value) },
            (_, i) =>
              e.setTargets?.[i] ?? {
                reps: e.reps,
                weight: e.weight,
                rest: "",
                instructions: "",
              },
          );
        }
      } else {
        const o = e.overrides[String(week)] ?? {
          sets: "",
          reps: "",
          weight: "",
        };
        e.overrides[String(week)] = { ...o, [field]: value };
      }
    });
  }
  function addExercise() {
    const ex = exercises.find((e) => e.id === selectedExercise);
    if (!ex) return;
    edit((d) =>
      d.days[activeDay].blocks.push({
        id: crypto.randomUUID(),
        label: "",
        rest: "",
        exercises: [
          {
            id: crypto.randomUUID(),
            exerciseId: ex.id,
            name: ex.name,
            sets: "3",
            reps: "5–7",
            weight: "",
            instructions: "",
            optional: false,
            optionalNote: "",
            overrides: {},
          },
        ],
      }),
    );
    setSelectedExercise("");
    setQuery("");
  }
  function move(blockIndex: number, rowIndex: number, direction: number) {
    edit((d) => {
      const blocks = d.days[activeDay].blocks,
        b = blocks[blockIndex];
      if (
        b.exercises.length > 1 &&
        rowIndex + direction >= 0 &&
        rowIndex + direction < b.exercises.length
      ) {
        const [e] = b.exercises.splice(rowIndex, 1);
        b.exercises.splice(rowIndex + direction, 0, e);
      } else if (
        blockIndex + direction >= 0 &&
        blockIndex + direction < blocks.length
      ) {
        blocks.splice(blockIndex, 1);
        blocks.splice(blockIndex + direction, 0, b);
      }
    });
  }
  async function apply() {
    setBusy(true);
    setError(null);
    try {
      if (!(await persist())) return;
      const d = currentDraft.current;
      if (!d) return;
      const r = await api.apply(
        d.id,
        d.revision,
        assigned?.client_id ?? (recipient || null),
      );
      if (r.error || !r.data) {
        setError(r.error ?? "Could not apply changes.");
        return;
      }
      setStatus("Changes applied");
      saved.current = JSON.stringify(latest.current);
      if (api === liveAPI) {
        router.push(
          r.data.clientId
            ? `/admin/clients/${r.data.clientId}`
            : "/admin/programs",
        );
        router.refresh();
      }
    } catch {
      setError("Could not apply changes. Your draft is still saved.");
    } finally {
      setBusy(false);
    }
  }
  async function discard() {
    const d = currentDraft.current;
    if (!d) return;
    setBusy(true);
    try {
      await chain.current;
      const r = await api.discard(d.id, d.revision);
      if (r.error) {
        setError(r.error);
        return;
      }
      saved.current = JSON.stringify(latest.current);
      if (api === liveAPI) {
        router.push(
          assigned ? `/admin/clients/${assigned.client_id}` : "/admin/programs",
        );
        router.refresh();
      } else {
        const reopened = await api.open(version.id);
        if (reopened.data) {
          currentDraft.current = reopened.data;
          latest.current = reopened.data.document;
          saved.current = JSON.stringify(reopened.data.document);
          setSavedDocument(saved.current);
          setDocument(reopened.data.document);
          setDraft(reopened.data);
        }
        setStatus("Draft discarded");
        setConfirmDiscard(false);
      }
    } catch {
      setError("Could not discard. Try again.");
    } finally {
      setBusy(false);
    }
  }
  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className={styles.editor}>
      <Link
        href={
          assigned ? `/admin/clients/${assigned.client_id}` : "/admin/programs"
        }
      >
        Back to {assigned ? "client" : "programs"}
      </Link>
      <div className={styles.heading}>
        <div>
          <h1>Build the workout.</h1>
          <p>
            {assigned
              ? `Editing ${assigned.profiles?.full_name ?? "this client"}’s plan. Changes stay private until you apply them.`
              : "Build your days, adjust weekly targets, then save to the library or assign a private copy."}
          </p>
        </div>
        <span role="status" aria-live="polite" className={styles.saveStatus}>
          {status}
        </span>
      </div>
      {error && (
        <div className={styles.error} role="alert">
          {error}
          {draft && (
            <button
              className="btn btn--quiet btn--sm"
              onClick={() => void persist()}
              disabled={busy}
            >
              Retry saving
            </button>
          )}
        </div>
      )}
      {problem && (
        <p role="alert" className={styles.error}>
          {problem}
        </p>
      )}
      <fieldset
        disabled={!draft || busy}
        className={styles.fields}
        onBlur={() => void persist()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            e.target.blur();
          }
        }}
      >
        <div className={styles.metadata}>
          <label>
            Plan name
            <input
              className="input"
              value={document.name}
              onChange={(e) =>
                edit((d) => {
                  d.name = e.target.value;
                })
              }
            />
          </label>
          <label>
            Weeks
            <input
              className="input"
              inputMode="numeric"
              readOnly={document.explicitWeeks}
              title={
                document.explicitWeeks
                  ? "This PDF includes an explicit weekly schedule. Import a new revision to change its length."
                  : undefined
              }
              value={document.weeks}
              onChange={(e) =>
                edit((d) => {
                  d.weeks = e.target.value;
                })
              }
            />
          </label>
        </div>
        <details className={styles.description}>
          <summary>Plan introduction</summary>
          <label>
            Introduction the client sees
            <textarea
              className="input"
              rows={2}
              value={document.description}
              onChange={(e) =>
                edit((d) => {
                  d.description = e.target.value;
                })
              }
            />
          </label>
        </details>
        <div className={styles.toolbar}>
          <div className={styles.days} aria-label="Workout days">
            {visibleDays.map(({ d, i }) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={activeDay === i}
                onClick={() => setActiveDay(i)}
              >
                {d.title || `Day ${i + 1}`}
              </button>
            ))}
          </div>
          <label>
            Editing week
            <select
              className="input"
              value={week}
              onChange={(e) => {
                const next = Number(e.target.value);
                setWeek(next);
                if (document.explicitWeeks)
                  setActiveDay(document.days.findIndex((d) => d.week === next));
              }}
            >
              {Array.from(
                {
                  length: Math.max(
                    1,
                    Math.min(52, Number(document.weeks) || 1),
                  ),
                },
                (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                    {i === 0 && !document.explicitWeeks ? " · Base plan" : ""}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        <div className={styles.dayHeading}>
          <label>
            Day name
            <input
              className="input"
              value={day.title}
              onChange={(e) =>
                edit((d) => {
                  d.days[activeDay].title = e.target.value;
                })
              }
            />
          </label>
          <button
            className="btn btn--quiet btn--sm"
            type="button"
            disabled={visibleDays.length >= 14}
            onClick={() =>
              edit((d) => {
                const copy = structuredClone(d.days[activeDay]);
                copy.id = crypto.randomUUID();
                copy.title += " copy";
                for (const b of copy.blocks) {
                  b.id = crypto.randomUUID();
                  for (const e of b.exercises) e.id = crypto.randomUUID();
                }
                d.days.push(copy);
              })
            }
          >
            Duplicate day
          </button>
        </div>
        <details className={styles.description}>
          <summary>Week and day notes for the client</summary>
          <label>
            Week {week} notes
            <textarea
              className="input"
              rows={2}
              value={document.weekNotes?.[String(week)] ?? ""}
              onChange={(e) =>
                edit((d) => {
                  d.weekNotes = {
                    ...d.weekNotes,
                    [String(week)]: e.target.value,
                  };
                })
              }
            />
          </label>
          <label>
            Notes for {day.title}
            <textarea
              className="input"
              rows={2}
              value={day.instructions ?? ""}
              onChange={(e) =>
                edit((d) => {
                  d.days[activeDay].instructions = e.target.value;
                })
              }
            />
          </label>
        </details>
        {!!document.coachNotes?.length && (
          <details className={styles.privateNotes}>
            <summary>Private notes for Nicole · never shown to clients</summary>
            {document.coachNotes.map((n, i) => (
              <label key={i}>
                {n.scope}
                {n.week ? ` · Week ${n.week}` : ""}
                {n.day ? ` · Day ${n.day}` : ""}
                {n.exerciseName ? ` · ${n.exerciseName}` : ""}
                <textarea
                  className="input"
                  rows={2}
                  value={n.text}
                  onChange={(e) =>
                    edit((d) => {
                      d.coachNotes![i].text = e.target.value;
                    })
                  }
                />
              </label>
            ))}
          </details>
        )}
        {week > 1 && !document.explicitWeeks && (
          <p className={styles.hint}>
            Blank weekly cells use the base plan. Names, instructions, and set
            labels, and exercise order apply to every week.
          </p>
        )}
        <div className={styles.gridHeader} aria-hidden="true">
          <span>Exercise</span>
          <span>Sets</span>
          <span>Reps</span>
          <span>Target lb</span>
          <span>Instructions</span>
        </div>
        {day.blocks.length === 0 && (
          <p className={styles.empty}>
            Add the first exercise to build this day.
          </p>
        )}
        {day.blocks.map((block, bi) => (
          <section
            key={block.id}
            className={styles.block}
            aria-label={block.exercises.length > 1 ? "Superset" : "Exercise"}
          >
            {block.exercises.length > 1 && (
              <div className={styles.superset}>
                Superset · complete these exercises together
              </div>
            )}
            {block.exercises.map((ex, ei) => {
              const p =
                week === 1 || document.explicitWeeks
                  ? ex
                  : (ex.overrides[String(week)] ?? {
                      sets: "",
                      reps: "",
                      weight: "",
                    });
              return (
                <div key={ex.id} className={styles.exercise}>
                  <div className={styles.gridRow}>
                    <label>
                      <span>Exercise</span>
                      <input
                        className="input"
                        aria-label={`Exercise name ${bi + 1}.${ei + 1}`}
                        value={ex.name}
                        onChange={(e) =>
                          exerciseEdit(ex.id, (x) => {
                            x.name = e.target.value;
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Sets</span>
                      <input
                        className="input"
                        aria-label={`${ex.name} sets`}
                        inputMode="numeric"
                        value={p.sets}
                        placeholder={week > 1 ? ex.sets : undefined}
                        onChange={(e) =>
                          changePrescription(ex.id, "sets", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Reps</span>
                      <input
                        className="input"
                        aria-label={`${ex.name} reps`}
                        disabled={!!ex.setTargets}
                        value={ex.setTargets ? "Per set" : p.reps}
                        placeholder={week > 1 ? ex.reps : undefined}
                        onChange={(e) =>
                          changePrescription(ex.id, "reps", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Target lb</span>
                      <input
                        className="input"
                        aria-label={`${ex.name} target weight`}
                        inputMode="decimal"
                        disabled={!!ex.setTargets}
                        value={ex.setTargets ? "Per set" : p.weight}
                        placeholder={week > 1 ? ex.weight : "Optional"}
                        onChange={(e) =>
                          changePrescription(ex.id, "weight", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Instructions</span>
                      <textarea
                        className="input"
                        rows={1}
                        aria-label={`${ex.name} instructions`}
                        value={ex.instructions}
                        onChange={(e) =>
                          exerciseEdit(ex.id, (x) => {
                            x.instructions = e.target.value;
                          })
                        }
                      />
                    </label>
                  </div>
                  {!!ex.setTargets && (
                    <details className={styles.description}>
                      <summary>
                        Individual set targets · {ex.setTargets.length} sets
                      </summary>
                      {ex.setTargets.map((target, si) => (
                        <div key={si} className={styles.targetFields}>
                          <label>
                            Set {si + 1} target reps
                            <input
                              className="input"
                              value={target.reps}
                              onChange={(event) =>
                                exerciseEdit(ex.id, (x) => {
                                  x.setTargets![si].reps = event.target.value;
                                })
                              }
                            />
                          </label>
                          <label>
                            Target lb
                            <input
                              className="input"
                              inputMode="decimal"
                              value={target.weight}
                              onChange={(event) =>
                                exerciseEdit(ex.id, (x) => {
                                  x.setTargets![si].weight = event.target.value;
                                })
                              }
                            />
                          </label>
                          <label>
                            Rest seconds
                            <input
                              className="input"
                              inputMode="numeric"
                              value={target.rest}
                              onChange={(event) =>
                                exerciseEdit(ex.id, (x) => {
                                  x.setTargets![si].rest = event.target.value;
                                })
                              }
                            />
                          </label>
                          <label>
                            Set {si + 1} instructions
                            <textarea
                              className="input"
                              value={target.instructions}
                              rows={1}
                              onChange={(event) =>
                                exerciseEdit(ex.id, (x) => {
                                  x.setTargets![si].instructions =
                                    event.target.value;
                                })
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </details>
                  )}
                  <SetTypeEditor
                    name={ex.name}
                    count={Number(resolvePrescription(ex, week).sets)}
                    types={ex.setTypes}
                    onChange={(types) =>
                      exerciseEdit(ex.id, (x) => {
                        x.setTypes = types;
                      })
                    }
                  />
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      onClick={() =>
                        edit((d) => {
                          const copy = structuredClone(ex);
                          copy.id = crypto.randomUUID();
                          const blocks = d.days[activeDay].blocks;
                          if (blocks[bi].exercises.length === 1)
                            blocks.splice(bi + 1, 0, {
                              ...structuredClone(blocks[bi]),
                              id: crypto.randomUUID(),
                              exercises: [copy],
                            });
                          else blocks[bi].exercises.splice(ei + 1, 0, copy);
                        })
                      }
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${ex.name} up`}
                      disabled={bi === 0 && ei === 0}
                      onClick={() => move(bi, ei, -1)}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${ex.name} down`}
                      disabled={
                        bi === day.blocks.length - 1 &&
                        ei === block.exercises.length - 1
                      }
                      onClick={() => move(bi, ei, 1)}
                    >
                      Move down
                    </button>
                    {bi > 0 && block.exercises.length === 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          edit((d) => {
                            const bs = d.days[activeDay].blocks;
                            bs[bi - 1].exercises.push(...bs[bi].exercises);
                            bs.splice(bi, 1);
                          })
                        }
                      >
                        Superset with above
                      </button>
                    )}
                    {block.exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          edit((d) => {
                            const bs = d.days[activeDay].blocks;
                            const [moved] = bs[bi].exercises.splice(ei, 1);
                            bs.splice(bi + 1, 0, {
                              id: crypto.randomUUID(),
                              label: "",
                              rest: "",
                              exercises: [moved],
                            });
                          })
                        }
                      >
                        Split out
                      </button>
                    )}
                    <details>
                      <summary>Replace exercise</summary>
                      <label>
                        Choose library exercise
                        <select
                          className="input"
                          value={ex.exerciseId}
                          onChange={(e) => {
                            const picked = exercises.find(
                              (x) => x.id === e.target.value,
                            );
                            if (picked)
                              exerciseEdit(ex.id, (x) => {
                                x.exerciseId = picked.id;
                                x.name = picked.name;
                              });
                          }}
                        >
                          {exercises.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </details>
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={ex.optional}
                        onChange={(e) =>
                          exerciseEdit(ex.id, (x) => {
                            x.optional = e.target.checked;
                          })
                        }
                      />
                      Optional
                    </label>
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Remove ${ex.name}`}
                      onClick={() =>
                        edit((d) => {
                          const bs = d.days[activeDay].blocks;
                          bs[bi].exercises.splice(ei, 1);
                          if (!bs[bi].exercises.length) bs.splice(bi, 1);
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                  {ex.optional && (
                    <label className={styles.optionalNote}>
                      Optional note
                      <input
                        className="input"
                        value={ex.optionalNote}
                        onChange={(e) =>
                          exerciseEdit(ex.id, (x) => {
                            x.optionalNote = e.target.value;
                          })
                        }
                      />
                    </label>
                  )}
                </div>
              );
            })}
            <label className={styles.rest}>
              Rest between sets
              <input
                className="input"
                value={block.rest}
                placeholder="e.g. 90 seconds"
                onChange={(e) =>
                  edit((d) => {
                    d.days[activeDay].blocks[bi].rest = e.target.value;
                  })
                }
              />
            </label>
          </section>
        ))}
        <div className={styles.addRow}>
          <label>
            Find an exercise
            <input
              className="input"
              value={query}
              placeholder="Search the library"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Exercise
            <select
              className="input"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              <option value="">Choose an exercise</option>
              {filtered.map((e) => (
                <option value={e.id} key={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn--primary"
            type="button"
            disabled={!selectedExercise}
            onClick={addExercise}
          >
            Add exercise
          </button>
        </div>
        <p className={styles.hint}>
          Need a new movement?{" "}
          <Link href="/admin/exercises" target="_blank">
            Open the exercise library
          </Link>
          , then reload once your draft is saved.
        </p>
      </fieldset>
      <div className={styles.finishBar}>
        {!assigned && (
          <label>
            Destination
            <select
              className="input"
              disabled={busy}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            >
              <option value="">Save to program library</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="btn btn--ghost"
          disabled={!draft || !!problem || busy}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Close preview" : "Preview client view"}
        </button>
        <button
          className="btn btn--quiet"
          disabled={!draft || busy}
          onClick={() => setConfirmDiscard(true)}
        >
          Discard draft
        </button>
        <button
          className="btn btn--primary"
          disabled={
            !draft ||
            !!problem ||
            busy ||
            status === "Saving…" ||
            dirty ||
            !!error
          }
          onClick={() => void apply()}
        >
          {busy
            ? "Please wait…"
            : assigned
              ? "Apply changes"
              : recipient
                ? "Apply and assign"
                : "Save to library"}
        </button>
      </div>
      {confirmDiscard && (
        <div className={styles.confirm} role="alert">
          <p>
            Discard this draft? The published plan and workout history will stay
            as they are.
          </p>
          <button
            className="btn btn--ghost"
            disabled={busy}
            onClick={() => setConfirmDiscard(false)}
          >
            Keep editing
          </button>
          <button
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void discard()}
          >
            Discard draft
          </button>
        </div>
      )}
      {preview && (
        <section className={styles.preview} aria-label="Client preview">
          <h2>Client view · Week {week}</h2>
          <p>Preview only. No workout or logs will be created.</p>
          <WorkoutDay
            key={`${day.id}:${week}`}
            day={toWorkoutDay(document, activeDay, week, exercises)}
            assignmentId="preview"
            lastEntries={[]}
            week={week}
            totalWeeks={Number(document.weeks)}
            readOnly
          />
        </section>
      )}
    </main>
  );
}
export function toWorkoutDay(
  doc: PlanDocument,
  index: number,
  week: number,
  library: LibraryExercise[],
): DayData {
  const day = doc.days[index];
  return {
    id: day.id,
    week,
    day: doc.explicitWeeks
      ? doc.days.filter((d, i) => d.week === week && i <= index).length
      : index + 1,
    intro: doc.description,
    week_instructions: doc.weekNotes?.[String(week)] ?? "",
    instructions: day.instructions ?? "",
    title: day.title,
    day_blocks: day.blocks.map((b, bi) => ({
      id: b.id,
      label: b.exercises.length > 1 ? "Superset" : b.label,
      position: bi,
      rest_note: b.rest || null,
      block_exercises: b.exercises.map((e, ei) => {
        const p = resolvePrescription(e, week),
          lib = library.find((x) => x.id === e.exerciseId);
        return {
          id: e.id,
          exercise_id: e.exerciseId,
          exercise_name: e.name,
          sets: Number(p.sets),
          set_types: resolveSetTypes(e.setTypes, Number(p.sets)),
          set_targets: e.setTargets,
          rep_range: p.reps,
          target_weight_lbs: p.weight === "" ? null : Number(p.weight),
          optional: e.optional,
          optional_note: e.optionalNote || null,
          directions: e.instructions || null,
          position: ei,
          exercises: lib
            ? {
                youtube_url: lib.youtube_url,
                cue: lib.cue,
                thumb_path: lib.thumb_path ?? null,
              }
            : null,
        };
      }),
    })),
  };
}
