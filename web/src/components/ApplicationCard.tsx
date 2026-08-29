"use client";

import { timeAgo } from "@/lib/time";

import { useState } from "react";
import { approveApplication, declineApplication } from "@/lib/actions";

interface AppRow {
  id: string;
  email: string;
  created_at: string;
  answers: Record<string, string>;
  snapshot: {
    goalType: string;
    suggestedSplit: string;
    frequency: string;
    platesTarget: string;
    redFlags: string[];
  } | null;
}

export function ApplicationCard({ app }: { app: AppRow }) {
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);

  if (gone) return null;
  const a = app.answers;
  const s = app.snapshot;

  async function act(kind: "approve" | "decline") {
    setBusy(kind);
    setError(null);
    const res = kind === "approve" ? await approveApplication(app.id) : await declineApplication(app.id);
    setBusy(null);
    if (res && "error" in res && res.error) return setError(res.error);
    setGone(true);
  }

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 style={{ fontSize: "var(--text-lg)" }}>
            {a.firstName} {a.lastName}
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            {app.email} · applied {timeAgo(app.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn--primary btn--sm" disabled={busy !== null} onClick={() => act("approve")}>
            {busy === "approve" ? "Inviting..." : "Approve & invite"}
          </button>
          <button type="button" className="btn btn--quiet btn--sm" disabled={busy !== null} onClick={() => act("decline")}>
            {busy === "decline" ? "..." : "Decline"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </p>
      )}

      {s && (
        <div className="card card--invert mt-4" style={{ padding: "var(--space-4)" }}>
          <p className="eyebrow" style={{ color: "var(--pink-300)" }}>
            Client snapshot
          </p>
          <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {[
              ["Goal", s.goalType],
              ["Suggested split", s.suggestedSplit],
              ["Frequency", s.frequency],
              ["Plates target", s.platesTarget],
            ].map(([k, v]) => (
              <p key={k} style={{ fontSize: "var(--text-sm)" }}>
                <span style={{ color: "var(--grey-400)" }}>{k}: </span>
                <span style={{ color: "var(--paper-50)", fontWeight: 600 }}>{v}</span>
              </p>
            ))}
          </div>
          {s.redFlags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {s.redFlags.map((f) => (
                <span key={f} className="badge badge--yellow">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <details className="mt-3">
        <summary style={{ cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-accent)" }}>
          Full answers
        </summary>
        <dl className="mt-3 grid gap-2" style={{ fontSize: "var(--text-sm)" }}>
          {[
            ["Goal", a.goal],
            ["Experience", a.experience],
            ["Days per week", a.daysPerWeek],
            ["Equipment", a.equipment],
            ["Injuries", a.injuries || "None noted"],
            ["Eating right now", a.nutritionHabits],
            ["Life", a.lifestyle],
            ["Phone", a.phone],
            ["Heard about", a.referral || "-"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow" style={{ fontSize: 9 }}>
                {k}
              </dt>
              <dd style={{ margin: 0 }}>{v}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
