"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { logFood } from "@/lib/actions";

interface FoodLogRow {
  id: string;
  meal_label: string;
  note: string;
  storage_path: string | null;
  created_at: string;
}

export function FoodJournal({ initial }: { initial: FoodLogRow[] }) {
  const [logs, setLogs] = useState(initial);
  const [open, setOpen] = useState(false);
  const [mealLabel, setMealLabel] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (busy || !mealLabel.trim()) return;
    setBusy(true);
    setError(null);

    let storagePath: string | null = null;
    if (file) {
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const path = `${user.id}/food/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("food-photos").upload(path, file);
        if (!upErr) storagePath = path;
      }
    }

    const res = await logFood(mealLabel, note, storagePath);
    setBusy(false);
    if (res?.error) return setError(res.error);
    setLogs([
      ...logs,
      { id: `tmp-${Date.now()}`, meal_label: mealLabel, note, storage_path: storagePath, created_at: new Date().toISOString() },
    ]);
    setMealLabel("");
    setNote("");
    setFile(null);
    setOpen(false);
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Today&apos;s food journal</h2>
        <span className="badge badge--pink">{logs.length} logged</span>
      </div>

      <div className="mt-3 grid gap-2">
        {logs.map((f) => (
          <div key={f.id} className="card flex items-center gap-3" style={{ padding: "var(--space-3)" }}>
            <div
              className="flex items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--pink-100)", flexShrink: 0 }}
              aria-hidden
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pink-700)" strokeWidth="2" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="flex-1">
              <p style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)" }}>{f.meal_label}</p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {f.note} · {new Date(f.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                {f.storage_path ? " · photo" : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {open ? (
        <div className="card mt-4 grid gap-3">
          <div>
            <label className="field-label" htmlFor="meal-label">
              Which meal?
            </label>
            <input id="meal-label" className="input" placeholder="Plate 2, Snack 1..." value={mealLabel} onChange={(e) => setMealLabel(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="meal-note">
              What was it?
            </label>
            <input id="meal-note" className="input" placeholder="Chicken + rice" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <label className="btn btn--quiet" style={{ cursor: "pointer" }}>
            {file ? "Photo added" : "Add photo"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {error && (
            <p role="alert" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn btn--primary flex-1" onClick={save} disabled={busy}>
              {busy ? "Saving..." : "Save meal"}
            </button>
            <button type="button" className="btn btn--quiet" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--primary mt-4 w-full" onClick={() => setOpen(true)}>
          Log a meal
        </button>
      )}
    </section>
  );
}
