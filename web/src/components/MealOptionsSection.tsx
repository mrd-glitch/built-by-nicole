"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkoffMeal, undoCheckoff } from "@/lib/actions";

/* PDF-style "pick one" meal section, fillable: tap the option you ate today.
   Tap again (or Undo) to clear. Chip colors alternate like Nicole's PDF. */

export interface MealOption {
  id: string;
  position: number;
  text: string;
  tag: "zero_prep" | "rough_day" | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}

export function MealOptionsSection({
  mealId,
  name,
  note,
  chipText,
  chipDark,
  options,
  existing,
}: {
  mealId: string;
  name: string;
  note: string | null;
  chipText: string | null;
  chipDark: boolean;
  options: MealOption[];
  existing: { id: string; optionId: string | null } | null;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function pick(opt: MealOption) {
    if (busy) return;
    setBusy(true);
    if (existing?.optionId === opt.id) {
      await undoCheckoff(existing.id);
    } else {
      await checkoffMeal(mealId, "option", undefined, opt.id);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="mt-7">
      <div className="flex items-end justify-between gap-2">
        <h2
          style={{
            fontFamily: "var(--font-numeric)",
            fontWeight: 800,
            fontSize: "var(--text-lg)",
            textTransform: "uppercase",
            letterSpacing: "0.01em",
            color: "var(--text-strong)",
          }}
        >
          {name}
        </h2>
        {chipText && <span className={`chip ${chipDark ? "chip--ink" : "chip--yellow"}`}>{chipText}</span>}
      </div>
      <div aria-hidden style={{ height: 3, background: "var(--pink-500)", marginTop: 8, borderRadius: 2 }} />
      <div aria-hidden style={{ height: 1, background: "var(--pink-300)", marginTop: 2, borderRadius: 2 }} />
      {note && (
        <p className="mt-2" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", fontStyle: "italic" }}>
          {note}
        </p>
      )}

      <div className="mt-1">
        {[...options]
          .sort((a, b) => a.position - b.position)
          .map((opt) => {
            const picked = existing?.optionId === opt.id;
            const dimmed = existing != null && !picked;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => pick(opt)}
                disabled={busy}
                className="flex w-full items-start gap-3 text-left"
                style={{
                  border: "none",
                  borderTop: "var(--rule-hairline)",
                  background: picked ? "var(--pink-100)" : "transparent",
                  borderRadius: picked ? "var(--radius-md)" : 0,
                  padding: "12px 8px",
                  cursor: "pointer",
                  opacity: dimmed ? 0.45 : 1,
                  transition: "all 140ms ease",
                }}
                aria-pressed={picked}
              >
                {opt.tag === "zero_prep" ? (
                  <span className="chip chip--pink" style={{ flexShrink: 0 }}>Zero prep</span>
                ) : opt.tag === "rough_day" ? (
                  <span className="chip chip--ink" style={{ flexShrink: 0 }}>Rough day</span>
                ) : (
                  <span
                    className="metric"
                    style={{ fontSize: "var(--text-2xs)", color: "var(--text-faint)", paddingTop: 4, minWidth: 22, flexShrink: 0 }}
                  >
                    {String(opt.position).padStart(2, "0")}
                  </span>
                )}
                <span style={{ fontSize: "var(--text-base)", color: "var(--text-body)", lineHeight: "var(--leading-body)" }}>
                  {opt.text}
                </span>
                {picked && (
                  <span
                    className="flex items-center justify-center"
                    style={{ marginLeft: "auto", width: 24, height: 24, borderRadius: "50%", background: "var(--pink-500)", flexShrink: 0 }}
                    aria-hidden
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
      </div>
      {existing && (
        <p className="mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--pink-700)" }}>
          Logged for today — tap it again to undo.
        </p>
      )}
    </section>
  );
}
