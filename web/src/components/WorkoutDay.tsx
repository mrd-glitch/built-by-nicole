"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { finishSession, logSet, startSession } from "@/lib/actions";

export interface DayData {
  id: string;
  week: number;
  day: number;
  title: string;
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
      rep_range: string;
      target_weight_lbs: number | null;
      optional: boolean;
      optional_note: string | null;
      position: number;
      directions?: string | null;
      exercises: { youtube_url: string | null; cue: string | null; thumb_path: string | null } | null;
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

export function WorkoutDay({
  day,
  assignmentId,
  lastEntries,
  week = 1,
  totalWeeks = 1,
}: {
  day: DayData;
  assignmentId: string;
  lastEntries: LastEntry[];
  week?: number;
  totalWeeks?: number;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<LogKey, { reps: string; weight: string; saved?: boolean }>>({});
  const [video, setVideo] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const blocks = useMemo(
    () =>
      [...day.day_blocks]
        .sort((a, b) => a.position - b.position)
        .map((b) => ({ ...b, block_exercises: [...b.block_exercises].sort((x, y) => x.position - y.position) })),
    [day],
  );

  const lastFor = (exId: string) => lastEntries.find((s) => s.exercise_id === exId);
  const bestFor = (exId: string) => {
    const mine = lastEntries.filter((s) => s.exercise_id === exId);
    if (!mine.length) return null;
    return Math.max(...mine.map((s) => Number(s.weight_lbs)));
  };

  const totalSets = blocks.reduce((a, b) => a + b.block_exercises.reduce((x, e) => x + e.sets, 0), 0);
  const doneSets = Object.values(logs).filter((l) => l.saved).length;

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId;
    const res = await startSession(day.id, assignmentId);
    if (res?.error || !res?.sessionId) {
      setError(res?.error ?? "Couldn't start the session.");
      return null;
    }
    setSessionId(res.sessionId);
    return res.sessionId;
  }

  async function saveSet(be: DayData["day_blocks"][number]["block_exercises"][number], si: number) {
    const key: LogKey = `${be.id}:${si}`;
    const log = logs[key];
    if (!log?.reps || !log?.weight) return;
    const sid = await ensureSession();
    if (!sid) return;
    const res = await logSet({
      sessionId: sid,
      blockExerciseId: be.id,
      exerciseId: be.exercise_id,
      setIndex: si,
      reps: parseInt(log.reps, 10),
      weightLbs: parseFloat(log.weight),
    });
    if (res?.error) return setError(res.error);
    setError(null);
    setLogs((prev) => ({ ...prev, [key]: { ...prev[key], saved: true } }));
  }

  async function finish() {
    setBusy(true);
    if (sessionId) await finishSession(sessionId);
    setBusy(false);
    setFinished(true);
  }

  if (finished) {
    return (
      <main className="page-pad">
        <div className="card text-center" style={{ padding: "var(--space-10)" }}>
          <span className="script" style={{ fontSize: "var(--text-4xl)", color: "var(--pink-500)" }}>
            done.
          </span>
          <h1 className="mt-3" style={{ fontSize: "var(--text-xl)" }}>
            That&apos;s the quiet work nobody sees.
          </h1>
          <p className="mt-3" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
            {doneSets} sets logged. Nicole can see every number.
          </p>
          <Link href="/app" className="btn btn--primary mt-6">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-pad">
      <Link href="/app/fitness" style={{ fontSize: "var(--text-sm)", color: "var(--text-accent)" }}>
        ← All days
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="eyebrow eyebrow--accent">
            Week {week} of {totalWeeks} · Day {day.day}
          </p>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>{day.title}</h1>
        </div>
        <span className="metric" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
          {doneSets}/{totalSets} sets
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-3" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4">
        {blocks.map((block) => (
          <section key={block.id} className="glass" style={{ padding: "var(--space-4)" }}>
            <div className="flex items-center justify-between">
              <h2 className="eyebrow" style={{ color: "var(--text-strong)" }}>
                {block.label}
              </h2>
              {block.rest_note && (
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>{block.rest_note}</span>
              )}
            </div>

            {block.block_exercises.map((be) => {
              const last = lastFor(be.exercise_id);
              const pb = bestFor(be.exercise_id);
              const yt = be.exercises?.youtube_url ?? null;
              return (
                <div key={be.id} className="mt-4" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      {be.exercises?.thumb_path && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={be.exercises.thumb_path}
                          alt=""
                          width={48}
                          height={48}
                          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 14, flexShrink: 0, boxShadow: "0 4px 10px rgb(13 13 15 / 0.12)", border: "1.5px solid rgb(255 255 255 / 0.9)" }}
                        />
                      )}
                    <div>
                      <p style={{ fontFamily: "var(--font-numeric)", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>
                        {be.exercise_name}
                        {be.optional && <span className="chip chip--ghost ml-2" style={{ padding: "2px 8px" }}>Optional</span>}
                      </p>
                      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                        {be.sets} sets · {be.rep_range} reps
                        {be.target_weight_lbs ? ` · target ${be.target_weight_lbs} lbs` : ""}
                      </p>
                      {(last || pb) && (
                        <p className="metric mt-1" style={{ fontSize: "var(--text-2xs)", color: "var(--grey-400)" }}>
                          {last ? `Last: ${last.weight_lbs} lbs × ${last.reps}` : ""}
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
                    <p className="mt-2" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontStyle: "italic" }}>
                      {be.optional_note}
                    </p>
                  )}
                  {be.directions && (
                    <p className="mt-2" style={{ fontSize: "var(--text-xs)", color: "var(--text-strong)", background: "var(--pink-100)", padding: "8px 10px", borderRadius: "var(--radius-md)" }}>
                      {be.directions}
                    </p>
                  )}
                  {be.exercises?.cue && (
                    <p className="mt-2" style={{ fontSize: "var(--text-xs)", color: "var(--pink-700)" }}>
                      Nicole&apos;s cue: {be.exercises.cue}
                    </p>
                  )}

                  {video === yt && yt && (
                    <div className="mt-3 overflow-hidden" style={{ borderRadius: "var(--radius-media)", aspectRatio: "16/9" }}>
                      <iframe
                        src={yt}
                        title={`${be.exercise_name} demo`}
                        className="h-full w-full"
                        allow="accelerometer; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  <div className="mt-3 grid gap-2">
                    {Array.from({ length: be.sets }).map((_, si) => {
                      const key: LogKey = `${be.id}:${si}`;
                      const log = logs[key] ?? { reps: "", weight: "" };
                      return (
                        <div key={si} className="flex items-center gap-2">
                          <span
                            className="metric flex items-center justify-center"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: log.saved ? "var(--pink-500)" : "var(--surface-sunken)",
                              color: log.saved ? "var(--white)" : "var(--text-muted)",
                              fontSize: "var(--text-xs)",
                              flexShrink: 0,
                            }}
                          >
                            {si + 1}
                          </span>
                          <input
                            className="input metric"
                            style={{ minHeight: 44 }}
                            inputMode="decimal"
                            placeholder="lbs"
                            aria-label={`${be.exercise_name} set ${si + 1} weight in pounds`}
                            value={log.weight}
                            onChange={(e) => setLogs({ ...logs, [key]: { ...log, weight: e.target.value, saved: false } })}
                            onBlur={() => saveSet(be, si)}
                          />
                          <input
                            className="input metric"
                            style={{ minHeight: 44 }}
                            inputMode="numeric"
                            placeholder="reps"
                            aria-label={`${be.exercise_name} set ${si + 1} reps`}
                            value={log.reps}
                            onChange={(e) => setLogs({ ...logs, [key]: { ...log, reps: e.target.value, saved: false } })}
                            onBlur={() => saveSet(be, si)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <div
        className="sticky mt-6"
        style={{
          bottom: "calc(84px + env(safe-area-inset-bottom))",
          margin: "0 calc(-1 * var(--space-4))",
          padding: "var(--space-3) var(--space-4)",
          background: "linear-gradient(180deg, transparent, rgb(250 250 248 / 0.9) 30%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <button type="button" className="btn btn--primary w-full" onClick={finish} disabled={busy}>
          {busy ? "Saving..." : `Finish workout · ${doneSets}/${totalSets} sets`}
        </button>
      </div>
    </main>
  );
}
