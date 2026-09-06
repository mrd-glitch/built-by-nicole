"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addExerciseToDay,
  assignProgramCopy,
  copyDayBlocks,
  createExerciseQuick,
  moveExerciseToBlock,
  publishAndAssign,
  removeExercise,
  renameDay,
  setWeekOverride,
  splitExerciseOut,
  updateBlockExercise,
  updateProgramMeta,
} from "@/lib/actions-builder";

interface ExerciseRow {
  id: string;
  name: string;
  youtube_url: string | null;
  cue: string | null;
  thumb_path?: string | null;
}
interface Override {
  week: number;
  sets: number | null;
  rep_range: string | null;
  target_weight_lbs: number | null;
}
interface BlockExercise {
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
  program_week_overrides: Override[];
}
interface Block {
  id: string;
  label: string;
  rest_note: string | null;
  position: number;
  block_exercises: BlockExercise[];
}
interface Day {
  id: string;
  week: number;
  day: number;
  title: string;
  position: number;
  day_blocks: Block[];
}
interface Version {
  id: string;
  version: number;
  published_at: string | null;
  programs: { id: string; name: string; description: string | null; weeks: number; days_per_week: number; is_template: boolean };
  program_days: Day[];
  program_assignments: { active: boolean; profiles: { id: string; full_name: string } | null }[];
}

type Step = "days" | "weeks" | "assign";

/* Builder v3 — three guided steps: build each day once, tune weeks, send it.
   "Blocks" are invisible plumbing: every exercise gets its own; "Superset
   with above" merges two. */
export function ProgramBuilder({
  version,
  exercises: initialExercises,
  clients,
}: {
  version: Version;
  exercises: ExerciseRow[];
  clients: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [days, setDays] = useState<Day[]>(
    [...version.program_days].sort((a, b) => a.position - b.position || a.week - b.week || a.day - b.day),
  );
  const [activeDayId, setActiveDayId] = useState(days[0]?.id);
  const [exercises, setExercises] = useState(initialExercises);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState<Step>("days");
  const [weeks, setWeeks] = useState(version.programs.weeks);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const day = useMemo(() => days.find((d) => d.id === activeDayId) ?? days[0], [days, activeDayId]);
  const assigned = version.program_assignments?.filter((a) => a.active).map((a) => a.profiles?.full_name).filter(Boolean) ?? [];
  const thumbFor = (exerciseId: string) => exercises.find((e) => e.id === exerciseId)?.thumb_path ?? null;
  const totalExercises = days.reduce((a, d) => a + d.day_blocks.reduce((x, b) => x + b.block_exercises.length, 0), 0);

  function patchDay(dayId: string, fn: (d: Day) => Day) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? fn(d) : d)));
  }
  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  /* ----- exercise ops (block plumbing hidden) ----- */

  async function onPickExercise(ex: { id: string; name: string }): Promise<true | string> {
    if (!day) return "No day selected";
    const res = await addExerciseToDay(day.id, ex);
    if ("error" in res && res.error) return res.error;
    if (!("id" in res) || !res.id) return "Couldn't add that exercise";
    const pos = res.position;
    patchDay(day.id, (d) => ({
      ...d,
      day_blocks: [
        ...d.day_blocks,
        {
          id: res.blockId,
          label: `${pos})`,
          rest_note: null,
          position: pos,
          block_exercises: [
            {
              id: res.id,
              exercise_id: ex.id,
              exercise_name: ex.name,
              sets: res.sets,
              rep_range: res.rep_range,
              target_weight_lbs: res.target_weight_lbs,
              optional: false,
              optional_note: null,
              directions: null,
              position: 1,
              program_week_overrides: [],
            },
          ],
        },
      ],
    }));
    setError(null);
    flashSaved();
    return true;
  }

  /* Any optimistic edit that the server rejects: show the error and reload
     from the database so the screen never lies about what's saved. */
  function revert(message: string) {
    setError(`${message} — reloading the saved version.`);
    setTimeout(() => window.location.reload(), 900);
  }

  async function onFieldChange(blockId: string, beId: string, fields: Partial<BlockExercise>) {
    patchDay(day.id, (d) => ({
      ...d,
      day_blocks: d.day_blocks.map((b) =>
        b.id === blockId ? { ...b, block_exercises: b.block_exercises.map((e) => (e.id === beId ? { ...e, ...fields } : e)) } : b,
      ),
    }));
    try {
      const res = await updateBlockExercise(beId, fields as never);
      if (res && "error" in res && res.error) return revert(res.error);
      flashSaved();
    } catch (err) {
      revert(err instanceof Error ? err.message : "Lost connection");
    }
  }

  async function onRemoveExercise(blockId: string, beId: string) {
    if (busy) return;
    setBusy(true);
    setMenuFor(null);
    try {
      // Transactional: removes the exercise and its block if that empties it.
      const res = await removeExercise(beId);
      if (res && "error" in res && res.error) return revert(res.error);
      patchDay(day.id, (d) => ({
        ...d,
        day_blocks: d.day_blocks
          .map((b) => (b.id === blockId ? { ...b, block_exercises: b.block_exercises.filter((e) => e.id !== beId) } : b))
          .filter((b) => b.block_exercises.length > 0),
      }));
      flashSaved();
    } catch (err) {
      revert(err instanceof Error ? err.message : "Lost connection");
    } finally {
      setBusy(false);
    }
  }

  /* Superset with the block above: move this exercise into the previous block. */
  async function onSupersetWithAbove(blockId: string, be: BlockExercise) {
    if (busy) return;
    const sorted = [...day.day_blocks].sort((a, b) => a.position - b.position);
    const i = sorted.findIndex((b) => b.id === blockId);
    if (i <= 0) return;
    const prev = sorted[i - 1];
    const cur = sorted[i];
    setMenuFor(null);
    setBusy(true);
    try {
      const res = await moveExerciseToBlock(be.id, prev.id);
      if ("error" in res && res.error) return revert(res.error);
      const pos: number = "position" in res && typeof res.position === "number" ? res.position : prev.block_exercises.length + 1;
      patchDay(day.id, (d) => ({
        ...d,
        day_blocks: d.day_blocks
          .map((b) => {
            if (b.id === prev.id) return { ...b, block_exercises: [...b.block_exercises, { ...be, position: pos }] };
            if (b.id === cur.id) return { ...b, block_exercises: b.block_exercises.filter((e) => e.id !== be.id) };
            return b;
          })
          .filter((b) => b.block_exercises.length > 0),
      }));
      flashSaved();
    } catch (err) {
      revert(err instanceof Error ? err.message : "Lost connection");
    } finally {
      setBusy(false);
    }
  }

  async function onSplitOut(blockId: string, be: BlockExercise) {
    if (busy) return;
    setBusy(true);
    setMenuFor(null);
    try {
      const res = await splitExerciseOut(be.id);
      if ("error" in res && res.error) return revert(res.error);
      if (!("blockId" in res) || !res.blockId) return;
      const newBlockId: string = res.blockId;
      const pos: number = res.position;
      if (newBlockId === blockId) return; // already alone
      patchDay(day.id, (d) => ({
        ...d,
        day_blocks: [
          ...d.day_blocks.map((b) => (b.id === blockId ? { ...b, block_exercises: b.block_exercises.filter((e) => e.id !== be.id) } : b)),
          { id: newBlockId, label: `${pos})`, rest_note: null, position: pos, block_exercises: [{ ...be, position: 1 }] },
        ],
      }));
      flashSaved();
    } catch (err) {
      revert(err instanceof Error ? err.message : "Lost connection");
    } finally {
      setBusy(false);
    }
  }

  async function onCopyToEmptyDays() {
    if (!day || busy) return;
    setBusy(true);
    for (const target of days) {
      if (target.id === day.id || target.day_blocks.length > 0) continue;
      await copyDayBlocks(day.id, target.id);
    }
    setBusy(false);
    window.location.reload();
  }

  async function onAssign(client: { id: string; full_name: string } | null) {
    setBusy(true);
    const res = client ? await assignProgramCopy(version.id, client.id, client.full_name) : await publishAndAssign(version.id, null);
    setBusy(false);
    if (res && "error" in res && res.error) return setError(res.error);
    router.push(client ? `/admin/clients/${client.id}` : "/admin/programs");
  }

  if (!day) return null;

  const steps: { key: Step; label: string }[] = [
    { key: "days", label: "1 · Build days" },
    { key: "weeks", label: "2 · Weeks" },
    { key: "assign", label: "3 · Send" },
  ];

  return (
    <main style={{ maxWidth: 720, paddingBottom: 90 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/programs" style={{ fontSize: "var(--text-sm)" }}>
            ← Programs
          </Link>
          <h1 className="mt-1" style={{ fontSize: "var(--text-xl)" }}>
            {version.programs.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="chip chip--pink">Saved</span>}
          {assigned.length > 0 && <span className="chip chip--ink">Live · {assigned.join(", ")}</span>}
        </div>
      </div>

      {/* Stepper */}
      <div className="seg mt-4 w-full" role="tablist" style={{ display: "flex" }}>
        {steps.map((s) => (
          <button key={s.key} type="button" className="seg__opt" style={{ flex: 1 }} aria-pressed={step === s.key} onClick={() => setStep(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {step === "days" && (
        <>
          <textarea
            className="input mt-4"
            rows={2}
            placeholder="What this plan is for — the client sees this at the top of their program."
            defaultValue={version.programs.description ?? ""}
            onBlur={(e) => {
              updateProgramMeta(version.programs.id, { description: e.target.value || null });
              flashSaved();
            }}
          />

          {/* Day strip */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button key={d.id} type="button" className="day-chip" aria-pressed={d.id === day.id} onClick={() => setActiveDayId(d.id)}>
                <small>Day {d.day}</small>
                <span className="metric">{d.day_blocks.reduce((a, b) => a + b.block_exercises.length, 0)}</span>
                <small>{d.day_blocks.length ? "moves" : "empty"}</small>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              className="input"
              style={{ fontFamily: "var(--font-numeric)", fontWeight: 700, flex: 1 }}
              defaultValue={day.title}
              aria-label="Day title"
              placeholder="Day name (Full Body, Upper, Legs...)"
              onBlur={(e) => {
                if (e.target.value !== day.title) {
                  patchDay(day.id, (d) => ({ ...d, title: e.target.value }));
                  renameDay(day.id, e.target.value);
                  flashSaved();
                }
              }}
            />
            {day.day_blocks.length > 0 && days.some((d) => d.id !== day.id && d.day_blocks.length === 0) && (
              <button type="button" className="btn btn--quiet btn--sm" onClick={onCopyToEmptyDays} disabled={busy}>
                {busy ? "Copying..." : "Copy to empty days"}
              </button>
            )}
          </div>

          {/* Exercise list — one row per movement, supersets grouped */}
          <div className="mt-4 grid gap-2">
            {day.day_blocks.length === 0 && (
              <div className="card card--sunken text-center" style={{ padding: "var(--space-8)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                  Empty day. Tap <strong>Add exercise</strong> — pick as many as you want in one go.
                </p>
              </div>
            )}
            {[...day.day_blocks]
              .sort((a, b) => a.position - b.position)
              .map((block, bi) => (
                <section
                  key={block.id}
                  className="glass"
                  style={{ padding: "var(--space-3)", borderLeft: block.block_exercises.length > 1 ? "3px solid var(--pink-500)" : undefined }}
                >
                  {block.block_exercises.length > 1 && (
                    <p className="eyebrow eyebrow--accent" style={{ fontSize: 9, marginBottom: 6 }}>
                      Superset · {block.block_exercises.length} moves back-to-back
                    </p>
                  )}
                  {[...block.block_exercises]
                    .sort((a, b) => a.position - b.position)
                    .map((be) => {
                      const thumb = thumbFor(be.exercise_id);
                      const open = menuFor === be.id;
                      return (
                        <div key={be.id} className="grid gap-2" style={{ paddingTop: be.position > 1 ? 8 : 0, borderTop: be.position > 1 ? "var(--rule-hairline)" : undefined }}>
                          <div className="flex items-center gap-2">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="" width={40} height={40} style={{ width: 40, height: 40, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <span className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--pink-100)", color: "var(--pink-700)", fontFamily: "var(--font-numeric)", fontWeight: 700, flexShrink: 0 }}>
                                {be.exercise_name[0]}
                              </span>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: "var(--text-sm)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {be.exercise_name}
                                {be.optional && <span className="chip chip--ghost ml-2" style={{ padding: "1px 7px" }}>Optional</span>}
                              </p>
                              <div className="flex items-center gap-1" style={{ marginTop: 4 }}>
                                <input
                                  className="input metric"
                                  style={{ width: 44, minHeight: 34, padding: 4, textAlign: "center", fontSize: 13 }}
                                  inputMode="numeric"
                                  aria-label={`${be.exercise_name} sets`}
                                  defaultValue={be.sets}
                                  onBlur={(e) => onFieldChange(block.id, be.id, { sets: parseInt(e.target.value, 10) || 1 })}
                                />
                                <span style={{ color: "var(--text-faint)", fontSize: 12 }}>×</span>
                                <input
                                  className="input metric"
                                  style={{ width: 62, minHeight: 34, padding: 4, textAlign: "center", fontSize: 13 }}
                                  aria-label={`${be.exercise_name} reps`}
                                  defaultValue={be.rep_range}
                                  placeholder="8-10"
                                  onBlur={(e) => onFieldChange(block.id, be.id, { rep_range: e.target.value || "8-10" })}
                                />
                                <span style={{ color: "var(--text-faint)", fontSize: 12 }}>@</span>
                                <input
                                  className="input metric"
                                  style={{ width: 58, minHeight: 34, padding: 4, textAlign: "center", fontSize: 13 }}
                                  inputMode="decimal"
                                  aria-label={`${be.exercise_name} target pounds`}
                                  defaultValue={be.target_weight_lbs ?? ""}
                                  placeholder="lbs"
                                  onBlur={(e) => onFieldChange(block.id, be.id, { target_weight_lbs: e.target.value ? parseFloat(e.target.value) : null })}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn--quiet btn--sm"
                              style={{ minHeight: 34, padding: "0 10px" }}
                              aria-label={`More for ${be.exercise_name}`}
                              aria-expanded={open}
                              onClick={() => setMenuFor(open ? null : be.id)}
                            >
                              ⋯
                            </button>
                          </div>

                          {open && (
                            <div className="grid gap-2" style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "var(--space-3)" }}>
                              <textarea
                                className="input"
                                rows={2}
                                placeholder="Directions for this move (tempo, form focus, this client's goal)..."
                                defaultValue={be.directions ?? ""}
                                onBlur={(e) => onFieldChange(block.id, be.id, { directions: e.target.value || null })}
                              />
                              <div className="flex flex-wrap gap-2">
                                <label className="flex items-center gap-2" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", cursor: "pointer" }}>
                                  <input type="checkbox" defaultChecked={be.optional} style={{ width: 16, height: 16, accentColor: "var(--pink-500)" }} onChange={(e) => onFieldChange(block.id, be.id, { optional: e.target.checked })} />
                                  Optional
                                </label>
                                {bi > 0 && block.block_exercises.length === 1 && (
                                  <button type="button" className="btn btn--quiet btn--sm" onClick={() => onSupersetWithAbove(block.id, be)} disabled={busy}>
                                    Superset with above
                                  </button>
                                )}
                                {block.block_exercises.length > 1 && (
                                  <button type="button" className="btn btn--quiet btn--sm" onClick={() => onSplitOut(block.id, be)} disabled={busy}>
                                    Split out
                                  </button>
                                )}
                                <button type="button" className="btn btn--quiet btn--sm" style={{ color: "var(--danger)" }} onClick={() => onRemoveExercise(block.id, be.id)} disabled={busy}>
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </section>
              ))}
          </div>

          <button type="button" className="btn btn--primary mt-4 w-full" onClick={() => setPickerOpen(true)}>
            + Add exercise
          </button>
        </>
      )}

      {step === "weeks" && (
        <>
          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              Program length
              <input
                className="input metric"
                style={{ width: 64, minHeight: 38 }}
                inputMode="numeric"
                defaultValue={weeks}
                onBlur={(e) => {
                  const w = Math.max(1, Math.min(16, parseInt(e.target.value, 10) || 4));
                  setWeeks(w);
                  updateProgramMeta(version.programs.id, { weeks: w });
                  flashSaved();
                }}
              />
              weeks
            </label>
          </div>
          <ProgressionGrid days={days} weeks={weeks} onSaved={flashSaved} setDays={setDays} />
        </>
      )}

      {step === "assign" && (
        <section className="glass mt-4" style={{ padding: "var(--space-5)" }}>
          <h2 style={{ fontSize: "var(--text-lg)" }}>Send it to a client</h2>
          <p className="mt-2" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            {days.length} days · {totalExercises} moves · {weeks} weeks. The client gets their own private copy — this library plan stays untouched for reuse.
          </p>
          <div className="mt-4 grid gap-2">
            {clients.map((c) => (
              <button key={c.id} type="button" className="btn btn--primary w-full" onClick={() => onAssign(c)} disabled={busy || totalExercises === 0}>
                {busy ? "Sending..." : `Send to ${c.full_name}`}
              </button>
            ))}
            <button type="button" className="btn btn--ghost w-full" onClick={() => onAssign(null)} disabled={busy}>
              Just save to library
            </button>
          </div>
          {totalExercises === 0 && (
            <p className="mt-3" style={{ fontSize: "var(--text-xs)", color: "var(--danger)" }}>
              Add at least one exercise first.
            </p>
          )}
        </section>
      )}

      {error && (
        <p role="alert" className="mt-3" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </p>
      )}

      {/* Sticky next-step bar */}
      {step !== "assign" && (
        <div
          className="fixed left-0 right-0"
          style={{ bottom: "calc(74px + env(safe-area-inset-bottom))", padding: "0 16px", zIndex: 40, pointerEvents: "none" }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "flex-end", pointerEvents: "auto" }}>
            <button type="button" className="btn btn--highlight btn--sm" onClick={() => setStep(step === "days" ? "weeks" : "assign")}>
              {step === "days" ? "Next: weeks →" : "Next: send →"}
            </button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <ExercisePicker
          exercises={exercises}
          onPick={(ex) => onPickExercise(ex)}
          onCreate={async (name, yt) => {
            const res = await createExerciseQuick(name, yt, null);
            if ("error" in res && res.error) return res.error;
            if (!("exercise" in res) || !res.exercise) return "Couldn't create that exercise";
            setExercises((prev) => [...prev, { ...res.exercise, youtube_url: yt, cue: null }].sort((a, b) => a.name.localeCompare(b.name)));
            return onPickExercise(res.exercise);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </main>
  );
}

function ExercisePicker({
  exercises,
  onPick,
  onCreate,
  onClose,
}: {
  exercises: ExerciseRow[];
  onPick: (ex: { id: string; name: string }) => Promise<true | string>;
  onCreate: (name: string, youtube: string | null) => Promise<true | string>;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [newYt, setNewYt] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  function normalizeYoutube(url: string): string | null {
    const m = url.trim().match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }

  // Multi-add: picking keeps the sheet open so a whole day builds in one pass.
  async function pick(e: ExerciseRow) {
    if (pending) return; // one add at a time
    setPending(true);
    setPickError(null);
    try {
      const r = await onPick(e);
      if (r !== true) return setPickError(r);
      setAdded((prev) => [...prev, e.name]);
      setQ("");
    } catch (err) {
      setPickError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: "var(--surface-scrim)" }} role="dialog" aria-label="Add exercises">
      <div className="card flex w-full max-w-[440px] flex-col" style={{ borderRadius: "var(--radius-sheet)", margin: "var(--space-4)", maxHeight: "85dvh" }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: "var(--text-lg)" }}>Add exercises</h2>
          <button type="button" className="btn btn--primary btn--sm" onClick={onClose} disabled={pending}>
            {pending ? "Adding..." : added.length ? `Done · ${added.length} added` : "Done"}
          </button>
        </div>
        {pickError && (
          <p role="alert" className="mt-2" style={{ fontSize: "var(--text-sm)", color: "var(--danger)" }}>
            {pickError}
          </p>
        )}
        {added.length > 0 && (
          <p className="mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--pink-700)" }}>
            Added: {added.slice(-3).join(", ")}
            {added.length > 3 ? ` +${added.length - 3}` : ""}
          </p>
        )}
        <input
          className="input mt-3"
          placeholder="Search — keep tapping to add more"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div className="mt-3 grid gap-1 overflow-y-auto" style={{ flex: 1 }}>
          {filtered.map((e) => (
            <button
              key={e.id}
              type="button"
              className="flex items-center gap-3 text-left"
              style={{ padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "none", background: "transparent", cursor: "pointer", minHeight: 48, opacity: pending ? 0.5 : 1 }}
              onClick={() => pick(e)}
              disabled={pending}
            >
              {e.thumb_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.thumb_path} alt="" width={36} height={36} style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--pink-100)", color: "var(--pink-700)", fontFamily: "var(--font-numeric)", fontWeight: 700, flexShrink: 0 }}>
                  {e.name[0]}
                </span>
              )}
              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", flex: 1 }}>{e.name}</span>
              <span className="chip chip--ghost" style={{ padding: "2px 9px" }}>+ Add</span>
            </button>
          ))}
          {filtered.length === 0 && !creating && (
            <p className="p-3" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
              Nothing named &ldquo;{q}&rdquo; yet.
            </p>
          )}
        </div>
        {creating ? (
          <div className="mt-3 grid gap-2" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
            <input className="input" placeholder="YouTube link (optional)" value={newYt} onChange={(e) => setNewYt(e.target.value)} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={async () => {
                if (pending) return;
                setPending(true);
                setPickError(null);
                try {
                  const r = await onCreate(q.trim(), normalizeYoutube(newYt));
                  if (r !== true) return setPickError(r);
                  setAdded((prev) => [...prev, q.trim()]);
                  setCreating(false);
                  setNewYt("");
                  setQ("");
                } catch (err) {
                  setPickError(err instanceof Error ? err.message : "Something went wrong");
                } finally {
                  setPending(false);
                }
              }}
              disabled={!q.trim() || pending}
            >
              Create &ldquo;{q.trim()}&rdquo; and add
            </button>
          </div>
        ) : (
          q.trim() &&
          !filtered.some((e) => e.name.toLowerCase() === q.trim().toLowerCase()) && (
            <button type="button" className="btn btn--ghost mt-3 w-full" onClick={() => setCreating(true)}>
              + New exercise: &ldquo;{q.trim()}&rdquo;
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* ---- Week progression grid: rows = exercises per day, cols = weeks.
   Week 1 edits the base exercise; weeks 2+ write overrides (blank = same as base). ---- */
function ProgressionGrid({
  days,
  weeks,
  onSaved,
  setDays,
}: {
  days: Day[];
  weeks: number;
  onSaved: () => void;
  setDays: React.Dispatch<React.SetStateAction<Day[]>>;
}) {
  function ovFor(be: BlockExercise, week: number): Override | undefined {
    return be.program_week_overrides?.find((o) => o.week === week);
  }

  function patchBe(beId: string, fn: (e: BlockExercise) => BlockExercise) {
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        day_blocks: d.day_blocks.map((b) => ({
          ...b,
          block_exercises: b.block_exercises.map((e) => (e.id === beId ? fn(e) : e)),
        })),
      })),
    );
  }

  async function saveCell(be: BlockExercise, week: number, field: "sets" | "rep_range" | "target_weight_lbs", raw: string) {
    if (week === 1) {
      const val = field === "rep_range" ? raw || "8-10" : raw ? (field === "sets" ? parseInt(raw, 10) : parseFloat(raw)) : null;
      patchBe(be.id, (e) => ({ ...e, [field]: val }) as BlockExercise);
      await updateBlockExercise(be.id, { [field]: val } as never);
      onSaved();
      return;
    }
    const existing = ovFor(be, week);
    const next: Override = {
      week,
      sets: existing?.sets ?? null,
      rep_range: existing?.rep_range ?? null,
      target_weight_lbs: existing?.target_weight_lbs ?? null,
      [field]: raw === "" ? null : field === "sets" ? parseInt(raw, 10) || null : field === "rep_range" ? raw : parseFloat(raw) || null,
    };
    patchBe(be.id, (e) => ({
      ...e,
      program_week_overrides: [...(e.program_week_overrides ?? []).filter((o) => o.week !== week), next],
    }));
    await setWeekOverride(be.id, week, { sets: next.sets, rep_range: next.rep_range, target_weight_lbs: next.target_weight_lbs });
    onSaved();
  }

  return (
    <div className="mt-5 grid gap-5">
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        Each day repeats every week. Tweak sets, reps, or weight for any week — blank cells inherit week 1.
      </p>
      {days.map((d) => {
        const rows = [...d.day_blocks]
          .sort((a, b) => a.position - b.position)
          .flatMap((b) => [...b.block_exercises].sort((a, z) => a.position - z.position));
        if (rows.length === 0) return null;
        return (
          <section key={d.id} className="glass" style={{ padding: "var(--space-4)", overflowX: "auto" }}>
            <h2 className="eyebrow" style={{ color: "var(--text-strong)" }}>
              Day {d.day} · {d.title}
            </h2>
            <table className="mt-3" style={{ borderCollapse: "collapse", minWidth: 140 + weeks * 150 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 10, color: "var(--text-faint)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 8 }}>Exercise</th>
                  {Array.from({ length: weeks }).map((_, i) => (
                    <th key={i} style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 8, paddingLeft: 8 }}>
                      Week {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((be) => (
                  <tr key={be.id} style={{ borderTop: "var(--rule-hairline)" }}>
                    <td style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-strong)", padding: "8px 8px 8px 0", maxWidth: 140 }}>
                      {be.exercise_name}
                    </td>
                    {Array.from({ length: weeks }).map((_, i) => {
                      const week = i + 1;
                      const ov = week === 1 ? undefined : ovFor(be, week);
                      const val = (f: "sets" | "rep_range" | "target_weight_lbs") =>
                        week === 1 ? (be[f] ?? "") : (ov?.[f] ?? "");
                      const ph = (f: "sets" | "rep_range" | "target_weight_lbs") =>
                        week === 1 ? "" : String(be[f] ?? "");
                      return (
                        <td key={week} style={{ padding: "6px 0 6px 8px" }}>
                          <div className="flex gap-1">
                            <input
                              className="input metric"
                              style={{ width: 38, minHeight: 34, padding: 4, fontSize: 12, textAlign: "center", opacity: week > 1 && !ov?.sets ? 0.55 : 1 }}
                              inputMode="numeric"
                              aria-label={`${be.exercise_name} week ${week} sets`}
                              defaultValue={val("sets")}
                              placeholder={ph("sets") || "sets"}
                              onBlur={(e) => saveCell(be, week, "sets", e.target.value)}
                            />
                            <input
                              className="input metric"
                              style={{ width: 52, minHeight: 34, padding: 4, fontSize: 12, textAlign: "center", opacity: week > 1 && !ov?.rep_range ? 0.55 : 1 }}
                              aria-label={`${be.exercise_name} week ${week} reps`}
                              defaultValue={val("rep_range")}
                              placeholder={ph("rep_range") || "reps"}
                              onBlur={(e) => saveCell(be, week, "rep_range", e.target.value)}
                            />
                            <input
                              className="input metric"
                              style={{ width: 46, minHeight: 34, padding: 4, fontSize: 12, textAlign: "center", opacity: week > 1 && ov?.target_weight_lbs == null ? 0.55 : 1 }}
                              inputMode="decimal"
                              aria-label={`${be.exercise_name} week ${week} weight`}
                              defaultValue={val("target_weight_lbs")}
                              placeholder={ph("target_weight_lbs") || "lbs"}
                              onBlur={(e) => saveCell(be, week, "target_weight_lbs", e.target.value)}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
