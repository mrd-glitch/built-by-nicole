"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addBlock,
  addExerciseToBlock,
  copyDayBlocks,
  createExerciseQuick,
  deleteBlock,
  publishAndAssign,
  removeBlockExercise,
  renameDay,
  updateBlock,
  updateBlockExercise,
} from "@/lib/actions-builder";

interface ExerciseRow {
  id: string;
  name: string;
  youtube_url: string | null;
  cue: string | null;
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
  position: number;
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
  programs: { id: string; name: string };
  program_days: Day[];
  program_assignments: { active: boolean; profiles: { id: string; full_name: string } | null }[];
}

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
  const [picker, setPicker] = useState<{ blockId: string } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const day = useMemo(() => days.find((d) => d.id === activeDayId) ?? days[0], [days, activeDayId]);
  const assigned = version.program_assignments?.filter((a) => a.active).map((a) => a.profiles?.full_name).filter(Boolean) ?? [];

  function patchDay(dayId: string, fn: (d: Day) => Day) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? fn(d) : d)));
  }
  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  /* ----- block ops ----- */

  async function onAddBlock() {
    if (!day) return;
    const pos = day.day_blocks.length + 1;
    const res = await addBlock(day.id, pos);
    if ("error" in res && res.error) return setError(res.error);
    if ("blockId" in res && res.blockId) {
      patchDay(day.id, (d) => ({
        ...d,
        day_blocks: [...d.day_blocks, { id: res.blockId!, label: `${pos})`, rest_note: null, position: pos, block_exercises: [] }],
      }));
      setPicker({ blockId: res.blockId! });
    }
  }

  async function onDeleteBlock(blockId: string) {
    patchDay(day.id, (d) => ({ ...d, day_blocks: d.day_blocks.filter((b) => b.id !== blockId) }));
    await deleteBlock(blockId);
    flashSaved();
  }

  async function onPickExercise(blockId: string, ex: { id: string; name: string }) {
    const block = day.day_blocks.find((b) => b.id === blockId);
    const pos = (block?.block_exercises.length ?? 0) + 1;
    const res = await addExerciseToBlock(blockId, ex, pos);
    if ("error" in res && res.error) return setError(res.error);
    if ("id" in res && res.id) {
      patchDay(day.id, (d) => ({
        ...d,
        day_blocks: d.day_blocks.map((b) =>
          b.id === blockId
            ? {
                ...b,
                block_exercises: [
                  ...b.block_exercises,
                  { id: res.id!, exercise_id: ex.id, exercise_name: ex.name, sets: 3, rep_range: "8-10", target_weight_lbs: null, optional: false, optional_note: null, position: pos },
                ],
              }
            : b,
        ),
      }));
      flashSaved();
    }
    setPicker(null);
  }

  async function onFieldChange(blockId: string, beId: string, fields: Partial<BlockExercise>) {
    patchDay(day.id, (d) => ({
      ...d,
      day_blocks: d.day_blocks.map((b) =>
        b.id === blockId
          ? { ...b, block_exercises: b.block_exercises.map((e) => (e.id === beId ? { ...e, ...fields } : e)) }
          : b,
      ),
    }));
    await updateBlockExercise(beId, fields as never);
    flashSaved();
  }

  async function onRemoveExercise(blockId: string, beId: string) {
    patchDay(day.id, (d) => ({
      ...d,
      day_blocks: d.day_blocks.map((b) =>
        b.id === blockId ? { ...b, block_exercises: b.block_exercises.filter((e) => e.id !== beId) } : b,
      ),
    }));
    await removeBlockExercise(beId);
    flashSaved();
  }

  async function onCopyToAllDays() {
    if (!day || busy) return;
    setBusy(true);
    for (const target of days) {
      if (target.id === day.id || target.day_blocks.length > 0) continue;
      await copyDayBlocks(day.id, target.id);
    }
    setBusy(false);
    router.refresh();
    window.location.reload();
  }

  async function onPublish(clientId: string | null) {
    setBusy(true);
    const res = await publishAndAssign(version.id, clientId);
    setBusy(false);
    if (res && "error" in res && res.error) return setError(res.error);
    setPublishOpen(false);
    router.push("/admin/programs");
  }

  if (!day) return null;

  return (
    <main style={{ maxWidth: 720 }}>
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
          {saved && <span className="badge badge--green">Saved</span>}
          <span className={`badge ${version.published_at ? "badge--green" : "badge--yellow"}`}>
            {version.published_at ? (assigned.length ? `Live · ${assigned.join(", ")}` : "Published") : "Draft"}
          </span>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setPublishOpen(true)}>
            {version.published_at ? "Assign" : "Publish"}
          </button>
        </div>
      </div>

      {/* Day strip */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => (
          <button key={d.id} type="button" className="day-chip" aria-pressed={d.id === day.id} onClick={() => setActiveDayId(d.id)}>
            <small>
              Week {d.week} Day {d.day}
            </small>
            <span className="metric">{d.day_blocks.reduce((a, b) => a + b.block_exercises.length, 0)}</span>
            <small>{d.day_blocks.length ? "exercises" : "empty"}</small>
          </button>
        ))}
      </div>

      {/* Day title */}
      <div className="mt-4 flex items-center gap-2">
        <input
          className="input"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700, maxWidth: 280 }}
          defaultValue={day.title}
          aria-label="Day title"
          onBlur={(e) => {
            if (e.target.value !== day.title) {
              patchDay(day.id, (d) => ({ ...d, title: e.target.value }));
              renameDay(day.id, e.target.value);
              flashSaved();
            }
          }}
        />
        {day.day_blocks.length > 0 && days.some((d) => d.id !== day.id && d.day_blocks.length === 0) && (
          <button type="button" className="btn btn--quiet btn--sm" onClick={onCopyToAllDays} disabled={busy}>
            {busy ? "Copying..." : "Copy to empty days"}
          </button>
        )}
      </div>

      {/* Blocks */}
      <div className="mt-4 grid gap-3">
        {[...day.day_blocks]
          .sort((a, b) => a.position - b.position)
          .map((block) => (
            <section key={block.id} className="card" style={{ padding: "var(--space-4)" }}>
              <div className="flex items-center justify-between gap-2">
                <input
                  className="eyebrow"
                  style={{ border: "none", background: "transparent", color: "var(--text-strong)", width: 160 }}
                  defaultValue={block.label}
                  aria-label="Block label"
                  onBlur={(e) => {
                    updateBlock(block.id, { label: e.target.value });
                    flashSaved();
                  }}
                />
                <div className="flex items-center gap-2">
                  {block.block_exercises.length > 1 && <span className="badge badge--pink">Superset</span>}
                  <button type="button" className="btn btn--quiet btn--sm" onClick={() => onDeleteBlock(block.id)} aria-label="Delete block">
                    ✕
                  </button>
                </div>
              </div>

              {[...block.block_exercises]
                .sort((a, b) => a.position - b.position)
                .map((be) => (
                  <div key={be.id} className="mt-3" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <p style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: "var(--text-base)" }}>{be.exercise_name}</p>
                      <button type="button" className="btn btn--quiet btn--sm" onClick={() => onRemoveExercise(block.id, be.id)} aria-label={`Remove ${be.exercise_name}`}>
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div>
                        <span className="field-label" style={{ fontSize: 9 }}>
                          Sets
                        </span>
                        <input
                          className="input metric"
                          inputMode="numeric"
                          defaultValue={be.sets}
                          onBlur={(e) => onFieldChange(block.id, be.id, { sets: parseInt(e.target.value, 10) || 1 })}
                        />
                      </div>
                      <div>
                        <span className="field-label" style={{ fontSize: 9 }}>
                          Reps
                        </span>
                        <input
                          className="input metric"
                          defaultValue={be.rep_range}
                          placeholder="8-10"
                          onBlur={(e) => onFieldChange(block.id, be.id, { rep_range: e.target.value || "8-10" })}
                        />
                      </div>
                      <div>
                        <span className="field-label" style={{ fontSize: 9 }}>
                          Target lbs
                        </span>
                        <input
                          className="input metric"
                          inputMode="decimal"
                          defaultValue={be.target_weight_lbs ?? ""}
                          placeholder="—"
                          onBlur={(e) => onFieldChange(block.id, be.id, { target_weight_lbs: e.target.value ? parseFloat(e.target.value) : null })}
                        />
                      </div>
                    </div>
                    <label className="mt-2 flex items-center gap-2" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        defaultChecked={be.optional}
                        style={{ width: 16, height: 16, accentColor: "var(--pink-500)" }}
                        onChange={(e) => onFieldChange(block.id, be.id, { optional: e.target.checked })}
                      />
                      Optional exercise
                    </label>
                  </div>
                ))}

              <button type="button" className="btn btn--quiet btn--sm mt-3 w-full" onClick={() => setPicker({ blockId: block.id })}>
                + Add exercise{block.block_exercises.length > 0 ? " (makes superset)" : ""}
              </button>
            </section>
          ))}

        <button type="button" className="btn btn--ghost" onClick={onAddBlock}>
          + Add block
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </p>
      )}

      {picker && (
        <ExercisePicker
          exercises={exercises}
          onPick={(ex) => onPickExercise(picker.blockId, ex)}
          onCreate={async (name, yt) => {
            const res = await createExerciseQuick(name, yt, null);
            if ("exercise" in res && res.exercise) {
              setExercises((prev) => [...prev, { ...res.exercise, youtube_url: yt, cue: null }].sort((a, b) => a.name.localeCompare(b.name)));
              onPickExercise(picker.blockId, res.exercise);
            }
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: "var(--surface-scrim)" }} role="dialog" aria-label="Publish program">
          <div className="card w-full max-w-[420px]" style={{ borderRadius: "var(--radius-sheet)", margin: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--text-lg)" }}>Send it to a client</h2>
            <p className="mt-2" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              Publishing locks this version so logged workouts never change meaning.
            </p>
            <div className="mt-4 grid gap-2">
              {clients.map((c) => (
                <button key={c.id} type="button" className="btn btn--quiet w-full" onClick={() => onPublish(c.id)} disabled={busy}>
                  {c.full_name}
                </button>
              ))}
              <button type="button" className="btn btn--ghost w-full" onClick={() => onPublish(null)} disabled={busy}>
                Publish without assigning
              </button>
            </div>
            <button type="button" className="btn btn--quiet btn--sm mt-4 w-full" onClick={() => setPublishOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
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
  onPick: (ex: { id: string; name: string }) => void;
  onCreate: (name: string, youtube: string | null) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [newYt, setNewYt] = useState("");

  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  function normalizeYoutube(url: string): string | null {
    const m = url.trim().match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: "var(--surface-scrim)" }} role="dialog" aria-label="Add exercise">
      <div className="card flex w-full max-w-[440px] flex-col" style={{ borderRadius: "var(--radius-sheet)", margin: "var(--space-4)", maxHeight: "80dvh" }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: "var(--text-lg)" }}>Add exercise</h2>
          <button type="button" className="btn btn--quiet btn--sm" onClick={onClose}>
            Close
          </button>
        </div>
        <input
          className="input mt-3"
          placeholder="Search your library..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div className="mt-3 grid gap-1 overflow-y-auto" style={{ flex: 1 }}>
          {filtered.map((e) => (
            <button
              key={e.id}
              type="button"
              className="flex items-center justify-between text-left"
              style={{ padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: "none", background: "transparent", cursor: "pointer", minHeight: 44 }}
              onClick={() => onPick(e)}
            >
              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{e.name}</span>
              {e.youtube_url && <span className="badge badge--pink">Video</span>}
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
            <button type="button" className="btn btn--primary" onClick={() => onCreate(q.trim(), normalizeYoutube(newYt))} disabled={!q.trim()}>
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
