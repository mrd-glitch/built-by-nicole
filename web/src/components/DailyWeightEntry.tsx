"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDailyWeight } from "@/lib/actions";

/* Optional daily weigh-in quick entry. No nagging — just there if they want it. */
export function DailyWeightEntry({ todayValue }: { todayValue: number | null }) {
  const [value, setValue] = useState(todayValue != null ? String(todayValue) : "");
  const [state, setState] = useState<"idle" | "busy" | "saved">(todayValue != null ? "saved" : "idle");
  const router = useRouter();

  async function save() {
    const w = parseFloat(value);
    if (!w || state === "busy") return;
    setState("busy");
    const res = await saveDailyWeight(w);
    setState(res?.error ? "idle" : "saved");
    router.refresh();
  }

  return (
    <section className="glass mt-4 flex items-center gap-3" style={{ padding: "var(--space-4)" }}>
      <div style={{ flex: 1 }}>
        <p className="eyebrow" style={{ fontSize: 9 }}>
          Today&apos;s weigh-in <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            className="input metric"
            style={{ maxWidth: 110, minHeight: 44, fontSize: "var(--text-lg)", textAlign: "center" }}
            inputMode="decimal"
            placeholder="0.0"
            aria-label="Today's weight in pounds"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (state === "saved") setState("idle");
            }}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>lbs</span>
          <button type="button" className={`btn btn--sm ${state === "saved" ? "btn--quiet" : "btn--primary"}`} onClick={save} disabled={state === "busy" || !value}>
            {state === "saved" ? "Saved ✓" : state === "busy" ? "..." : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}
