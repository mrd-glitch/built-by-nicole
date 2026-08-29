"use client";

import { useState } from "react";
import { submitApplication } from "@/lib/actions";

/* Multi-step intake: one question in view at a time, big touch targets.
   Phase A: submissions land in local state only. Phase B: POST to /api/apply
   (zod validation, rate limit, Turnstile) -> applications table. */

type Step = {
  key: string;
  label: string;
  hint?: string;
  kind: "text" | "email" | "tel" | "choice" | "textarea" | "number";
  choices?: string[];
  optional?: boolean;
};

const steps: Step[] = [
  { key: "firstName", label: "What's your first name?", kind: "text" },
  { key: "lastName", label: "And your last name?", kind: "text" },
  { key: "email", label: "Best email to reach you?", hint: "Your invite goes here if we're a fit.", kind: "email" },
  { key: "phone", label: "Phone number?", kind: "tel" },
  {
    key: "goal",
    label: "What's the main goal?",
    kind: "choice",
    choices: [
      "Lose body fat",
      "Build strength & muscle",
      "Improve energy & habits",
      "Post-partum rebuild",
      "General health & consistency",
    ],
  },
  {
    key: "experience",
    label: "How much training experience do you have?",
    kind: "choice",
    choices: ["Brand new", "Some, on and off", "Consistent for a year+", "Very experienced"],
  },
  {
    key: "daysPerWeek",
    label: "How many days a week can you actually train?",
    hint: "Be honest. Two real days beats five imaginary ones.",
    kind: "choice",
    choices: ["2", "3", "4", "5+"],
  },
  {
    key: "equipment",
    label: "What do you have to work with?",
    kind: "choice",
    choices: ["Full gym membership", "Home: dumbbells / bands", "Home: barely anything", "Gym + home"],
  },
  {
    key: "injuries",
    label: "Any injuries or things we work around?",
    hint: "Knees, back, post-partum, anything.",
    kind: "textarea",
    optional: true,
  },
  {
    key: "nutritionHabits",
    label: "What does eating look like right now?",
    hint: "Real answer. Skipped breakfasts and 9pm snacks included.",
    kind: "textarea",
  },
  {
    key: "lifestyle",
    label: "Tell me about your life.",
    hint: "Kids, work, sleep. The plan has to fit it.",
    kind: "textarea",
  },
  { key: "referral", label: "How did you hear about me?", kind: "text", optional: true },
];

export function IntakeForm() {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[i];
  const value = answers[step?.key ?? ""] ?? "";
  const last = i === steps.length - 1;
  const canNext = step?.optional || value.trim().length > 0;

  async function next() {
    if (!canNext) return;
    if (last) {
      if (!consent || sending) return;
      setSending(true);
      setError(null);
      const res = await submitApplication(answers);
      setSending(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setDone(true);
      return;
    }
    setI(i + 1);
  }

  if (done) {
    return (
      <div className="card" role="status">
        <h3 style={{ fontSize: "var(--text-lg)" }}>Got it. Talk soon.</h3>
        <p className="mt-3" style={{ color: "var(--text-muted)" }}>
          Your application is in. I read every one myself, and I&apos;ll reach out within two days.
          Watch your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "var(--pad-card-lg)" }}>
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="eyebrow">
          Question {i + 1} of {steps.length}
        </span>
        <div className="flex gap-1" aria-hidden>
          {steps.map((s, idx) => (
            <span
              key={s.key}
              style={{
                width: 14,
                height: 3,
                background: idx <= i ? "var(--pink-500)" : "var(--grey-200)",
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      </div>

      <label className="field-label mt-6" htmlFor={step.key} style={{ fontSize: "var(--text-lg)", textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-display)" }}>
        {step.label}
      </label>
      {step.hint && <p className="field-hint mb-3">{step.hint}</p>}

      {step.kind === "choice" ? (
        <div className="mt-3 grid gap-2">
          {step.choices!.map((c) => (
            <button
              key={c}
              type="button"
              className="input text-left"
              aria-pressed={value === c}
              style={{
                cursor: "pointer",
                borderColor: value === c ? "var(--pink-500)" : undefined,
                borderWidth: value === c ? 2 : 1,
                background: value === c ? "var(--pink-100)" : undefined,
                fontWeight: value === c ? 600 : 400,
              }}
              onClick={() => {
                setAnswers({ ...answers, [step.key]: c });
                if (!last) setTimeout(() => setI((v) => Math.min(v + 1, steps.length - 1)), 150);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      ) : step.kind === "textarea" ? (
        <textarea
          id={step.key}
          className="input mt-2"
          value={value}
          onChange={(e) => setAnswers({ ...answers, [step.key]: e.target.value })}
        />
      ) : (
        <input
          id={step.key}
          type={step.kind}
          className="input mt-2"
          value={value}
          autoComplete={step.key === "email" ? "email" : step.key === "phone" ? "tel" : "off"}
          onChange={(e) => setAnswers({ ...answers, [step.key]: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && next()}
        />
      )}

      {last && (
        <label className="mt-5 flex items-start gap-3" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ width: 20, height: 20, marginTop: 2, accentColor: "var(--pink-500)" }}
          />
          <span>
            I&apos;m okay with Nicole storing my answers, and later my progress photos and health
            info, to coach me. Deleted any time I ask.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="mt-4" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={() => setI(Math.max(0, i - 1))}
          disabled={i === 0}
        >
          Back
        </button>
        <button type="button" className="btn btn--primary" onClick={next} disabled={!canNext || (last && !consent) || sending}>
          {sending ? "Sending..." : last ? "Send application" : step.optional && !value.trim() ? "Skip" : "Next"}
        </button>
      </div>
    </div>
  );
}
