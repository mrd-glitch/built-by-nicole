"use client";

import { timeAgo } from "@/lib/time";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { submitCheckin, attachCheckinPhoto } from "@/lib/actions";

/* Sunday check-in: weight -> photos -> ratings -> notes -> done. Real writes. */

interface CheckinRow {
  id: string;
  iso_week: string;
  submitted_at: string;
  dry_weight_lbs: number;
  meal_rating: number;
  fitness_rating: number;
}

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div role="group" aria-label={`${label}: rate 1 to 5`}>
      <span className="field-label">{label}</span>
      <div className="rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={value >= n} aria-label={`${n} of 5`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

const poses = ["front", "side", "back"] as const;
type Pose = (typeof poses)[number];

export function CheckinFlow({
  history,
  alreadyThisWeek,
  windowState = "open",
  targetWeek,
}: {
  history: CheckinRow[];
  alreadyThisWeek: boolean;
  windowState?: "open" | "late" | "locked";
  targetWeek?: string;
}) {
  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState("");
  const [photos, setPhotos] = useState<Partial<Record<Pose, File>>>({});
  const [mealRating, setMealRating] = useState(0);
  const [mealNote, setMealNote] = useState("");
  const [fitRating, setFitRating] = useState(0);
  const [fitNote, setFitNote] = useState("");
  const [comments, setComments] = useState("");
  const [proud, setProud] = useState("");
  const [excited, setExcited] = useState("");
  const [energy, setEnergy] = useState(0);
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await submitCheckin({
      dryWeightLbs: parseFloat(weight),
      mealRating,
      mealNote,
      fitnessRating: fitRating,
      fitnessNote: fitNote,
      comments,
      proud,
      excited,
      energyRating: energy || undefined,
      focusNextWeek: focus,
    });
    if (res?.error || !res?.checkinId) {
      setBusy(false);
      setError(res?.error ?? "Something broke. Try again.");
      return;
    }

    // Upload photos (best-effort; check-in itself is already saved)
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let failed = 0;
    for (const pose of poses) {
      const file = photos[pose];
      if (!file || !user) continue;
      const path = `${user.id}/checkins/${res.checkinId}/${pose}.jpg`;
      const { error: upErr } = await supabase.storage.from("progress-photos").upload(path, file, { upsert: true });
      if (upErr) {
        failed++;
        continue;
      }
      await attachCheckinPhoto(res.checkinId, pose, path);
    }
    if (failed > 0) setPhotoWarning(`Check-in saved, but ${failed} photo(s) didn't upload. You can resend them to Nicole in Messages.`);
    setBusy(false);
    setStep(5);
  }

  if (step === 0) {
    return (
      <main className="page-pad">
        <p className="eyebrow eyebrow--accent">Weekly check-in</p>
        <h1 className="mt-2" style={{ fontSize: "var(--text-2xl)" }}>
          Let&apos;s see those wins.
        </h1>
        <div className="card card--invert mt-5" style={{ padding: "var(--space-5)" }}>
          {alreadyThisWeek ? (
            <p style={{ color: "var(--paper-50)", fontSize: "var(--text-base)" }}>
              This week&apos;s check-in is in. Nicole has it. Next one opens Saturday.
            </p>
          ) : windowState === "locked" ? (
            <p style={{ color: "var(--paper-50)", fontSize: "var(--text-base)" }}>
              Check-in opens Saturday morning and closes Monday night. If life got in the way this
              week, message Nicole — she can reopen it for you.
            </p>
          ) : (
            <>
              <p style={{ color: "var(--paper-50)", fontSize: "var(--text-base)" }}>
                Takes about five minutes: weight, three photos, a few honest taps.
              </p>
              {windowState === "late" && (
                <p className="mt-2" style={{ color: "var(--highlight)", fontSize: "var(--text-sm)" }}>
                  This one counts for last week{targetWeek ? ` (${targetWeek})` : ""} — marked as a late check-in.
                </p>
              )}
              <button type="button" className="btn btn--highlight mt-4 w-full" onClick={() => setStep(1)}>
                Start check-in
              </button>
            </>
          )}
        </div>

        <h2 className="eyebrow mt-8">History</h2>
        <div className="mt-3 grid gap-2">
          {history.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
              First check-in this Sunday. That&apos;s where the trend starts.
            </p>
          )}
          {history.map((c) => (
            <div key={c.id} className="glass flex items-center justify-between gap-2" style={{ padding: "var(--space-3) var(--space-4)" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)" }}>{c.iso_week}</p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  {timeAgo(c.submitted_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="metric" style={{ fontSize: "var(--text-base)" }}>
                  {c.dry_weight_lbs} lbs
                </p>
                <p className="metric" style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
                  meals {c.meal_rating}/5 · training {c.fitness_rating}/5
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (step === 5) {
    return (
      <main className="page-pad">
        <div className="glass text-center" style={{ padding: "var(--space-10)" }}>
          <span className="script" style={{ fontSize: "var(--text-4xl)", color: "var(--pink-500)" }}>
            sent.
          </span>
          <h1 className="mt-3" style={{ fontSize: "var(--text-xl)" }}>
            Check-in is with Nicole.
          </h1>
          <p className="mt-3" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
            {photoWarning ?? "She reads every one. You'll hear back in Messages."}
          </p>
          <button type="button" className="btn btn--primary mt-6" onClick={() => window.location.reload()}>
            Done
          </button>
        </div>
      </main>
    );
  }

  const stepTitles = ["", "Morning weight", "Progress photos", "Rate your week", "Talk to me"];

  return (
    <main className="page-pad">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Step {step} of 4</span>
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => setStep(0)}>
          Exit
        </button>
      </div>
      <h1 className="mt-2" style={{ fontSize: "var(--text-xl)" }}>
        {stepTitles[step]}
      </h1>

      {step === 1 && (
        <div className="glass mt-5">
          <label className="field-label" htmlFor="weight">
            Dry weight (lbs)
          </label>
          <p className="field-hint mb-3">Morning, after the bathroom, before eating.</p>
          <input
            id="weight"
            className="input metric"
            style={{ fontSize: "var(--text-2xl)", textAlign: "center", minHeight: 64 }}
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.0"
          />
        </div>
      )}

      {step === 2 && (
        <div className="mt-5 grid gap-3">
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Front, side, back. Swimwear or fitted athletic wear. Same spot, same light as last week if you can.
          </p>
          {poses.map((p) => (
            <label
              key={p}
              className="glass flex items-center justify-between"
              style={{
                cursor: "pointer",
                borderColor: photos[p] ? "var(--pink-500)" : "rgb(13 13 15 / 0.15)",
                borderWidth: photos[p] ? 2 : 1.5,
                borderStyle: photos[p] ? "solid" : "dashed",
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center"
                  style={{ width: 40, height: 40, borderRadius: 12, background: photos[p] ? "var(--pink-500)" : "var(--pink-100)", flexShrink: 0 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={photos[p] ? "#fff" : "var(--pink-700)"} strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </span>
                <span style={{ fontWeight: 600, textTransform: "capitalize", color: "var(--text-strong)" }}>{p} photo</span>
              </span>
              {photos[p] ? <span className="chip chip--pink">Added</span> : <span className="chip chip--ghost">Tap to add</span>}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhotos({ ...photos, [p]: f });
                }}
              />
            </label>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="mt-5 grid gap-6">
          <div className="glass grid gap-3">
            <Rating label="Meal plan this week" value={mealRating} onChange={setMealRating} />
            <textarea className="input" placeholder="Tell me how eating actually went." value={mealNote} onChange={(e) => setMealNote(e.target.value)} />
          </div>
          <div className="glass grid gap-3">
            <Rating label="Fitness plan this week" value={fitRating} onChange={setFitRating} />
            <textarea className="input" placeholder="Workouts done? Anything hurt?" value={fitNote} onChange={(e) => setFitNote(e.target.value)} />
          </div>
          <div className="glass grid gap-3">
            <Rating label="Energy and sleep this week" value={energy} onChange={setEnergy} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-5 grid gap-4">
          <div>
            <label className="field-label" htmlFor="proud">
              What actions were you proud of? <span style={{ color: "var(--text-faint)" }}>(optional)</span>
            </label>
            <textarea id="proud" className="input" value={proud} onChange={(e) => setProud(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="excited">
              What are you excited for next week? <span style={{ color: "var(--text-faint)" }}>(optional)</span>
            </label>
            <textarea id="excited" className="input" value={excited} onChange={(e) => setExcited(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="focus">
              What&apos;s one thing you&apos;ll focus on or change — even just 1% — to get closer to your goals this week?
            </label>
            <textarea id="focus" className="input" placeholder="One small thing counts." value={focus} onChange={(e) => setFocus(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="comments">
              Anything else for Nicole? <span style={{ color: "var(--text-faint)" }}>(optional)</span>
            </label>
            <textarea id="comments" className="input" value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-between">
        <button type="button" className="btn btn--quiet" onClick={() => setStep(step - 1)} disabled={step === 1 || busy}>
          Back
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => (step === 4 ? submit() : setStep(step + 1))}
          disabled={
            busy ||
            (step === 1 && (!weight.trim() || isNaN(parseFloat(weight)))) ||
            (step === 2 && poses.some((p) => !photos[p])) ||
            (step === 3 && (!mealRating || !fitRating || !energy)) ||
            (step === 4 && !focus.trim())
          }
        >
          {busy ? "Sending..." : step === 4 ? "Submit check-in" : "Next"}
        </button>
      </div>
    </main>
  );
}
