"use client";

import { useEffect, useRef, useState } from "react";

/* Shared food search: Nicole's library -> USDA -> AI estimate. Returns a
   portion-scaled item. Used by the meal-plan builder and the client journal. */

export interface PickedFood {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Hit {
  id?: string;
  name: string;
  portion_label: string;
  portion_grams: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  source: "library" | "usda" | "ai";
  usda_fdc_id?: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function FoodPicker({ onPick, onClose }: { onPick: (f: PickedFood) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [deepDone, setDeepDone] = useState(false);
  const [chosen, setChosen] = useState<Hit | null>(null);
  const [amount, setAmount] = useState("1");
  const [manual, setManual] = useState(false);
  const [mName, setMName] = useState("");
  const [mPortion, setMPortion] = useState("");
  const [mCal, setMCal] = useState("");
  const [mP, setMP] = useState("");
  const [mC, setMC] = useState("");
  const [mF, setMF] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setDeepDone(false);
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        setHits(json.hits ?? []);
      } catch {
        setHits([]);
      }
      setSearching(false);
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  async function deepSearch() {
    setSearching(true);
    setDeepDone(true);
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(q.trim())}&deep=1`);
      const json = await res.json();
      setHits(json.hits ?? []);
    } catch {
      /* keep old hits */
    }
    setSearching(false);
  }

  function confirm() {
    if (!chosen) return;
    const mult = parseFloat(amount) || 1;
    // cache non-library foods for next time (best-effort)
    if (chosen.source !== "library") {
      fetch("/api/food-search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(chosen) }).catch(() => {});
    }
    onPick({
      name: chosen.name,
      portion: mult === 1 ? chosen.portion_label : `${amount} × ${chosen.portion_label}`,
      calories: r1(chosen.calories * mult),
      protein: r1(chosen.protein * mult),
      carbs: r1(chosen.carbs * mult),
      fats: r1(chosen.fats * mult),
    });
  }

  function confirmManual() {
    if (!mName.trim()) return;
    const f: Hit = {
      name: mName.trim(),
      portion_label: mPortion.trim() || "1 serving",
      portion_grams: null,
      calories: parseFloat(mCal) || 0,
      protein: parseFloat(mP) || 0,
      carbs: parseFloat(mC) || 0,
      fats: parseFloat(mF) || 0,
      source: "usda", // stored as manual by API
    };
    fetch("/api/food-search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, source: "manual" }) }).catch(() => {});
    onPick({ name: f.name, portion: f.portion_label, calories: f.calories, protein: f.protein, carbs: f.carbs, fats: f.fats });
  }

  const srcChip = (s: Hit["source"]) =>
    s === "library" ? <span className="chip chip--pink">Yours</span> : s === "usda" ? <span className="chip chip--ghost">USDA</span> : <span className="chip chip--yellow">Estimate</span>;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: "var(--surface-scrim)" }} role="dialog" aria-label="Add food">
      <div className="card flex w-full max-w-[460px] flex-col" style={{ borderRadius: "var(--radius-sheet)", margin: "var(--space-4)", maxHeight: "82dvh" }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: "var(--text-lg)" }}>Add food</h2>
          <button type="button" className="btn btn--quiet btn--sm" onClick={onClose}>
            Close
          </button>
        </div>

        {chosen ? (
          <div className="mt-4">
            <p style={{ fontWeight: 700, color: "var(--text-strong)" }}>{chosen.name}</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              per {chosen.portion_label}: {chosen.calories} kcal · P{chosen.protein} C{chosen.carbs} F{chosen.fats}
            </p>
            <label className="field-label mt-4" htmlFor="fp-amount">
              How many × {chosen.portion_label}?
            </label>
            <input id="fp-amount" className="input metric" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            {(() => {
              const m = parseFloat(amount) || 1;
              return (
                <p className="metric mt-2" style={{ fontSize: "var(--text-sm)", color: "var(--pink-700)" }}>
                  = {r1(chosen.calories * m)} kcal · P{r1(chosen.protein * m)} · C{r1(chosen.carbs * m)} · F{r1(chosen.fats * m)}
                </p>
              );
            })()}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn--primary flex-1" onClick={confirm}>
                Add
              </button>
              <button type="button" className="btn btn--quiet" onClick={() => setChosen(null)}>
                Back
              </button>
            </div>
          </div>
        ) : manual ? (
          <div className="mt-4 grid gap-2">
            <input className="input" placeholder="Food name" value={mName} onChange={(e) => setMName(e.target.value)} autoFocus />
            <input className="input" placeholder="Portion (5 oz / 1 cup)" value={mPortion} onChange={(e) => setMPortion(e.target.value)} />
            <div className="grid grid-cols-4 gap-2">
              <input className="input metric" inputMode="decimal" placeholder="kcal" aria-label="Calories" value={mCal} onChange={(e) => setMCal(e.target.value)} />
              <input className="input metric" inputMode="decimal" placeholder="P" aria-label="Protein grams" value={mP} onChange={(e) => setMP(e.target.value)} />
              <input className="input metric" inputMode="decimal" placeholder="C" aria-label="Carb grams" value={mC} onChange={(e) => setMC(e.target.value)} />
              <input className="input metric" inputMode="decimal" placeholder="F" aria-label="Fat grams" value={mF} onChange={(e) => setMF(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn--primary flex-1" onClick={confirmManual} disabled={!mName.trim()}>
                Add food
              </button>
              <button type="button" className="btn btn--quiet" onClick={() => setManual(false)}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              className="input mt-3"
              placeholder="3 oz chicken, greek yogurt, rice..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <div className="mt-3 grid gap-1 overflow-y-auto" style={{ flex: 1, minHeight: 120 }}>
              {searching && (
                <p className="p-2" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                  Searching...
                </p>
              )}
              {!searching &&
                hits.map((h, i) => (
                  <button
                    key={`${h.source}-${h.id ?? h.usda_fdc_id ?? i}`}
                    type="button"
                    className="flex items-center justify-between gap-2 text-left"
                    style={{ padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: "none", background: "transparent", cursor: "pointer", minHeight: 44 }}
                    onClick={() => setChosen(h)}
                  >
                    <span>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", display: "block" }}>{h.name}</span>
                      <span className="metric" style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
                        {h.portion_label} · {h.calories} kcal · P{h.protein} C{h.carbs} F{h.fats}
                      </span>
                    </span>
                    {srcChip(h.source)}
                  </button>
                ))}
              {!searching && q.trim().length >= 2 && hits.length === 0 && (
                <p className="p-2" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                  Nothing found yet.
                </p>
              )}
            </div>
            {q.trim().length >= 2 && !searching && (
              <div className="mt-2 grid gap-2" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
                {!deepDone && (
                  <button type="button" className="btn btn--quiet btn--sm w-full" onClick={deepSearch}>
                    Ask AI to estimate &ldquo;{q.trim()}&rdquo;
                  </button>
                )}
                <button type="button" className="btn btn--ghost btn--sm w-full" onClick={() => setManual(true)}>
                  Enter macros myself
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
