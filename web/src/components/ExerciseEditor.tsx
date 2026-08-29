"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface ExerciseRow {
  id: string;
  name: string;
  youtube_url: string | null;
  cue: string | null;
  thumb_path: string | null;
}

export function ExerciseEditor({ initial }: { initial: ExerciseRow[] }) {
  const [exercises, setExercises] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExerciseRow | null>(null);
  const [name, setName] = useState("");
  const [youtube, setYoutube] = useState("");
  const [cue, setCue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setEditing(null);
    setName("");
    setYoutube("");
    setCue("");
    setOpen(true);
  }
  function startEdit(e: ExerciseRow) {
    setEditing(e);
    setName(e.name);
    setYoutube(e.youtube_url ?? "");
    setCue(e.cue ?? "");
    setOpen(true);
  }

  function normalizeYoutube(url: string): string | null {
    const t = url.trim();
    if (!t) return null;
    // accept watch/short/embed links, store privacy-enhanced embed
    const m = t.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const yt = normalizeYoutube(youtube);
    if (youtube.trim() && !yt) {
      setBusy(false);
      return setError("That doesn't look like a YouTube link.");
    }
    if (editing) {
      const { error } = await supabase
        .from("exercises")
        .update({ name: name.trim(), youtube_url: yt, cue: cue.trim() || null })
        .eq("id", editing.id);
      setBusy(false);
      if (error) return setError(error.message);
      setExercises(exercises.map((e) => (e.id === editing.id ? { ...e, name: name.trim(), youtube_url: yt, cue: cue.trim() || null } : e)));
    } else {
      const { data, error } = await supabase
        .from("exercises")
        .insert({ name: name.trim(), youtube_url: yt, cue: cue.trim() || null })
        .select("id, name, youtube_url, cue, thumb_path")
        .single();
      setBusy(false);
      if (error) return setError(error.message);
      setExercises([...exercises, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setOpen(false);
  }

  return (
    <main style={{ maxWidth: 860 }}>
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Exercise library</h1>
        <button type="button" className="btn btn--primary btn--sm" onClick={startAdd}>
          Add exercise
        </button>
      </div>
      <p className="mt-2" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
        Your movements, your cues, your video links. Programs pull from here.
      </p>

      {open && (
        <div className="card mt-4 grid gap-3">
          <div>
            <label className="field-label" htmlFor="ex-name">
              Exercise name
            </label>
            <input id="ex-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="ex-yt">
              YouTube link (optional)
            </label>
            <input id="ex-yt" className="input" placeholder="https://youtube.com/watch?v=..." value={youtube} onChange={(e) => setYoutube(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="ex-cue">
              Your cue (optional)
            </label>
            <input id="ex-cue" className="input" placeholder="Brace before every pull." value={cue} onChange={(e) => setCue(e.target.value)} />
          </div>
          {error && (
            <p role="alert" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>
              {busy ? "Saving..." : editing ? "Save changes" : "Add exercise"}
            </button>
            <button type="button" className="btn btn--quiet" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-2">
        {exercises.length === 0 && !open && (
          <div className="card card--sunken text-center" style={{ padding: "var(--space-10)" }}>
            <p style={{ color: "var(--text-muted)" }}>Empty library. Add your first movement.</p>
          </div>
        )}
        {exercises.map((e) => (
          <div key={e.id} className="glass flex flex-wrap items-center justify-between gap-3" style={{ padding: "var(--space-3) var(--space-4)" }}>
            <div className="flex items-center gap-3">
              {e.thumb_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.thumb_path}
                  alt=""
                  width={44}
                  height={44}
                  style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 12, border: "1.5px solid rgb(255 255 255 / 0.9)", boxShadow: "0 3px 8px rgb(13 13 15 / 0.1)" }}
                />
              ) : (
                <span
                  className="flex items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: 12, background: "var(--pink-100)", color: "var(--pink-700)", fontFamily: "var(--font-numeric)", fontWeight: 700 }}
                >
                  {e.name[0]}
                </span>
              )}
              <div>
                <p style={{ fontWeight: 600, color: "var(--text-strong)" }}>{e.name}</p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{e.cue ?? "No cue yet"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {e.youtube_url ? <span className="chip chip--pink">Video</span> : <span className="chip chip--ghost">No video</span>}
              <button type="button" className="btn btn--quiet btn--sm" onClick={() => startEdit(e)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
