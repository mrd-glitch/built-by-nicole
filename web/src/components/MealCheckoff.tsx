"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkoffMeal, undoCheckoff } from "@/lib/actions";
import { FoodPicker, type PickedFood } from "@/components/FoodPicker";

interface PlanItem {
  id: string;
  name: string;
  portion: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}
interface Existing {
  id: string;
  status: "ate_as_written" | "custom";
}

export function MealCheckoff({ mealId, items, existing }: { mealId: string; items: PlanItem[]; existing: Existing | null }) {
  const [custom, setCustom] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>(Object.fromEntries(items.map((i) => [i.id, true])));
  const [extras, setExtras] = useState<PickedFood[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function ateAsWritten() {
    if (busy) return;
    setBusy(true);
    await checkoffMeal(mealId, "ate_as_written");
    setBusy(false);
    router.refresh();
  }

  async function saveCustom() {
    if (busy) return;
    setBusy(true);
    const rows = [
      ...items
        .filter((i) => picked[i.id])
        .map((i) => ({ meal_item_id: i.id, name: i.name, calories: i.calories ?? 0, protein: i.protein ?? 0, carbs: i.carbs ?? 0, fats: i.fats ?? 0 })),
      ...extras.map((e) => ({ meal_item_id: null, name: `${e.name} (${e.portion})`, calories: e.calories, protein: e.protein, carbs: e.carbs, fats: e.fats })),
    ];
    await checkoffMeal(mealId, "custom", rows);
    setBusy(false);
    setCustom(false);
    setExtras([]);
    router.refresh();
  }

  async function undo() {
    if (!existing || busy) return;
    setBusy(true);
    await undoCheckoff(existing.id);
    setBusy(false);
    router.refresh();
  }

  if (existing) {
    return (
      <div className="mt-3 flex items-center justify-between" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
        <span className="chip" style={{ background: "var(--success-soft, #D1F5DC)", color: "#166534", borderColor: "transparent" }}>
          ✓ {existing.status === "ate_as_written" ? "Ate as written" : "Logged what I ate"}
        </span>
        <button type="button" className="btn btn--quiet btn--sm" onClick={undo} disabled={busy}>
          Undo
        </button>
      </div>
    );
  }

  if (custom) {
    return (
      <div className="mt-3 grid gap-2" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Untick what you skipped, add anything extra:</p>
        {items.map((i) => (
          <label key={i.id} className="flex items-center gap-2" style={{ fontSize: "var(--text-sm)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={picked[i.id] ?? true}
              onChange={(e) => setPicked({ ...picked, [i.id]: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "var(--pink-500)" }}
            />
            <span style={{ textDecoration: picked[i.id] ? "none" : "line-through", color: picked[i.id] ? "var(--text-strong)" : "var(--text-faint)" }}>
              {i.name} · {i.portion}
            </span>
          </label>
        ))}
        {extras.map((e, idx) => (
          <div key={idx} className="flex items-center justify-between" style={{ fontSize: "var(--text-sm)" }}>
            <span style={{ color: "var(--pink-700)" }}>+ {e.name} ({e.portion})</span>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setExtras(extras.filter((_, i2) => i2 !== idx))}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => setPickerOpen(true)}>
          + I also ate something else
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn btn--primary btn--sm flex-1" onClick={saveCustom} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </button>
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => setCustom(false)} disabled={busy}>
            Cancel
          </button>
        </div>
        {pickerOpen && (
          <FoodPicker
            onPick={(f) => {
              setExtras([...extras, f]);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-2" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
      <button type="button" className="btn btn--primary btn--sm flex-1" onClick={ateAsWritten} disabled={busy}>
        {busy ? "Saving..." : "✓ Ate this as written"}
      </button>
      <button type="button" className="btn btn--quiet btn--sm" onClick={() => setCustom(true)} disabled={busy}>
        Something different
      </button>
    </div>
  );
}
