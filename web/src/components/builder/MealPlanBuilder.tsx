"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addMeal,
  addMealItem,
  deleteMeal,
  publishAndAssignMealPlan,
  removeMealItem,
  updateMeal,
  updateMealPlanVersion,
} from "@/lib/actions-builder";

interface Item {
  id: string;
  name: string;
  portion: string;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  calories: number | null;
  position: number;
}
interface Meal {
  id: string;
  name: string;
  note: string | null;
  position: number;
  meal_items: Item[];
}
interface Version {
  id: string;
  version: number;
  published_at: string | null;
  intro: string | null;
  pdf_name: string | null;
  meal_plans: { id: string; name: string };
  meals: Meal[];
  meal_plan_assignments: { active: boolean; profiles: { id: string; full_name: string } | null }[];
}

export function MealPlanBuilder({ version, clients }: { version: Version; clients: { id: string; full_name: string }[] }) {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([...version.meals].sort((a, b) => a.position - b.position));
  const [publishOpen, setPublishOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assigned = version.meal_plan_assignments?.filter((a) => a.active).map((a) => a.profiles?.full_name).filter(Boolean) ?? [];

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  async function onAddMeal(kind: "Plate" | "Snack") {
    const count = meals.filter((m) => m.name.startsWith(kind)).length + 1;
    const name = `${kind} ${count}`;
    const res = await addMeal(version.id, name, meals.length + 1);
    if ("mealId" in res && res.mealId) {
      setMeals([...meals, { id: res.mealId, name, note: null, position: meals.length + 1, meal_items: [] }]);
      flashSaved();
    }
  }

  async function onDeleteMeal(mealId: string) {
    setMeals(meals.filter((m) => m.id !== mealId));
    await deleteMeal(mealId);
    flashSaved();
  }

  async function onAddItem(meal: Meal, item: { name: string; portion: string; protein: number | null; carbs: number | null; fats: number | null }) {
    const res = await addMealItem(meal.id, item, meal.meal_items.length + 1);
    if ("id" in res && res.id) {
      setMeals(
        meals.map((m) =>
          m.id === meal.id
            ? { ...m, meal_items: [...m.meal_items, { ...item, calories: null, id: res.id!, position: m.meal_items.length + 1 }] }
            : m,
        ),
      );
      flashSaved();
    }
  }

  async function onRemoveItem(mealId: string, itemId: string) {
    setMeals(meals.map((m) => (m.id === mealId ? { ...m, meal_items: m.meal_items.filter((i) => i.id !== itemId) } : m)));
    await removeMealItem(itemId);
    flashSaved();
  }

  async function onPublish(clientId: string | null) {
    setBusy(true);
    const res = await publishAndAssignMealPlan(version.id, clientId);
    setBusy(false);
    if (res && "error" in res && res.error) return setError(res.error);
    setPublishOpen(false);
    router.push("/admin/meal-plans");
  }

  return (
    <main style={{ maxWidth: 720 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/meal-plans" style={{ fontSize: "var(--text-sm)" }}>
            ← Meal plans
          </Link>
          <h1 className="mt-1" style={{ fontSize: "var(--text-xl)" }}>
            {version.meal_plans.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="badge badge--green">Saved</span>}
          <span className={`badge ${version.published_at ? "badge--green" : "badge--yellow"}`}>
            {version.published_at ? (assigned.length ? `Live · ${assigned.join(", ")}` : "Published") : "Draft"}
          </span>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setPublishOpen(true)}>
            {version.published_at ? "Assign" : "Publish"}
          </button>
        </div>
      </div>

      <textarea
        className="input mt-4"
        placeholder="Intro note for the client (how to build a plate, when to eat, anything)."
        defaultValue={version.intro ?? ""}
        onBlur={(e) => {
          updateMealPlanVersion(version.id, { intro: e.target.value || null });
          flashSaved();
        }}
      />

      <div className="mt-4 grid gap-3">
        {meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} onDelete={() => onDeleteMeal(meal.id)} onAddItem={(item) => onAddItem(meal, item)} onRemoveItem={(itemId) => onRemoveItem(meal.id, itemId)} onRename={(name) => updateMeal(meal.id, { name }).then(flashSaved)} onNote={(note) => updateMeal(meal.id, { note: note || null }).then(flashSaved)} />
        ))}
        <div className="flex gap-2">
          <button type="button" className="btn btn--ghost flex-1" onClick={() => onAddMeal("Plate")}>
            + Add plate
          </button>
          <button type="button" className="btn btn--quiet flex-1" onClick={() => onAddMeal("Snack")}>
            + Add snack
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </p>
      )}

      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: "var(--surface-scrim)" }} role="dialog" aria-label="Publish meal plan">
          <div className="card w-full max-w-[420px]" style={{ borderRadius: "var(--radius-sheet)", margin: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--text-lg)" }}>Send it to a client</h2>
            <div className="mt-4 grid gap-2">
              {clients.map((c) => (
                <button key={c.id} type="button" className="btn btn--quiet w-full" onClick={() => onPublish(c.id)} disabled={busy}>
                  {c.full_name}
                </button>
              ))}
              <button type="button" className="btn btn--ghost w-full" onClick={() => onPublish(null)} disabled={busy}>
                Publish without assigning
              </button>
            </div>
            <button type="button" className="btn btn--quiet btn--sm mt-4 w-full" onClick={() => setPublishOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function MealCard({
  meal,
  onDelete,
  onAddItem,
  onRemoveItem,
  onRename,
  onNote,
}: {
  meal: Meal;
  onDelete: () => void;
  onAddItem: (item: { name: string; portion: string; protein: number | null; carbs: number | null; fats: number | null }) => void;
  onRemoveItem: (itemId: string) => void;
  onRename: (name: string) => void;
  onNote: (note: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [portion, setPortion] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  function submit() {
    if (!name.trim()) return;
    onAddItem({
      name: name.trim(),
      portion: portion.trim(),
      protein: protein ? parseFloat(protein) : null,
      carbs: carbs ? parseFloat(carbs) : null,
      fats: fats ? parseFloat(fats) : null,
    });
    setName("");
    setPortion("");
    setProtein("");
    setCarbs("");
    setFats("");
    setAdding(false);
  }

  return (
    <section className="card" style={{ padding: "var(--space-4)" }}>
      <div className="flex items-center justify-between gap-2">
        <input
          style={{ border: "none", background: "transparent", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-base)", width: "60%" }}
          defaultValue={meal.name}
          aria-label="Meal name"
          onBlur={(e) => e.target.value !== meal.name && onRename(e.target.value)}
        />
        <button type="button" className="btn btn--quiet btn--sm" onClick={onDelete} aria-label={`Delete ${meal.name}`}>
          ✕
        </button>
      </div>
      <input
        className="mt-1 w-full"
        style={{ border: "none", background: "transparent", fontSize: "var(--text-xs)", color: "var(--pink-700)" }}
        placeholder="Note (optional)"
        defaultValue={meal.note ?? ""}
        aria-label="Meal note"
        onBlur={(e) => e.target.value !== (meal.note ?? "") && onNote(e.target.value)}
      />

      {[...meal.meal_items]
        .sort((a, b) => a.position - b.position)
        .map((it) => (
          <div key={it.id} className="mt-2 flex items-center justify-between gap-2" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-2)" }}>
            <p style={{ fontSize: "var(--text-sm)" }}>
              {it.name} · <span style={{ color: "var(--text-muted)" }}>{it.portion}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="metric" style={{ fontSize: "var(--text-2xs)", color: "var(--grey-500)" }}>
                P{it.protein ?? 0} C{it.carbs ?? 0} F{it.fats ?? 0}
              </span>
              <button type="button" className="btn btn--quiet btn--sm" onClick={() => onRemoveItem(it.id)} aria-label={`Remove ${it.name}`}>
                ✕
              </button>
            </div>
          </div>
        ))}

      {adding ? (
        <div className="mt-3 grid gap-2" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
          <input className="input" placeholder="Food (Chicken breast)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <input className="input" placeholder="Portion (5 oz / 1 fist)" value={portion} onChange={(e) => setPortion(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <input className="input metric" inputMode="decimal" placeholder="P" aria-label="Protein grams" value={protein} onChange={(e) => setProtein(e.target.value)} />
            <input className="input metric" inputMode="decimal" placeholder="C" aria-label="Carb grams" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            <input className="input metric" inputMode="decimal" placeholder="F" aria-label="Fat grams" value={fats} onChange={(e) => setFats(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn--primary btn--sm flex-1" onClick={submit} disabled={!name.trim()}>
              Add food
            </button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--quiet btn--sm mt-3 w-full" onClick={() => setAdding(true)}>
          + Add food
        </button>
      )}
    </section>
  );
}
