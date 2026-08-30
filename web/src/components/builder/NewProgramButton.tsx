"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProgram } from "@/lib/actions-builder";

export function NewProgramButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(2);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function create() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await createProgram(name.trim(), weeks, daysPerWeek, description.trim() || undefined);
    setBusy(false);
    if (res && "error" in res && res.error) return setError(res.error);
    if (res && "versionId" in res) router.push(`/admin/programs/${res.versionId}`);
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--primary btn--sm" onClick={() => setOpen(true)}>
        New program
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "var(--surface-scrim)" }}
      role="dialog"
      aria-label="New program"
    >
      <div className="card w-full max-w-[420px]" style={{ borderRadius: "var(--radius-sheet)", margin: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--text-lg)" }}>New program</h2>
        <label className="field-label mt-4" htmlFor="prog-name">
          Name
        </label>
        <input
          id="prog-name"
          className="input"
          placeholder="October 2026: 3x/week"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <label className="field-label mt-4" htmlFor="prog-desc">
          Description (optional)
        </label>
        <textarea
          id="prog-desc"
          className="input"
          rows={2}
          placeholder="This plan encompasses..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <span className="field-label">Weeks</span>
            <div className="flex gap-1">
              {[2, 4, 6, 8].map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`btn btn--sm flex-1 ${weeks === w ? "btn--primary" : "btn--quiet"}`}
                  onClick={() => setWeeks(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label">Days / week</span>
            <div className="flex gap-1">
              {[2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`btn btn--sm flex-1 ${daysPerWeek === d ? "btn--primary" : "btn--quiet"}`}
                  onClick={() => setDaysPerWeek(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-3" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <button type="button" className="btn btn--primary flex-1" onClick={create} disabled={busy || !name.trim()}>
            {busy ? "Creating..." : `Build ${daysPerWeek} workouts (repeat ${weeks} weeks)`}
          </button>
          <button type="button" className="btn btn--quiet" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
