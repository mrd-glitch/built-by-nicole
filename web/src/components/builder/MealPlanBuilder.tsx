"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addMeal,
  addMealItem,
  addMealOption,
  deleteMeal,
  assignMealPlanCopy,
  publishMealPlan,
  removeMealItem,
  removeMealOption,
  updateMeal,
  updateMealOption,
  updateMealPlanMeta,
  updateMealPlanVersion,
} from "@/lib/actions-builder";
import { FoodPicker, type PickedFood } from "@/components/FoodPicker";

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
interface MealOptionRow {
  id: string;
  position: number;
  text: string;
  tag: "zero_prep" | "rough_day" | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}
interface Meal {
  id: string;
  name: string;
  note: string | null;
  chip_text: string | null;
  position: number;
  meal_items: Item[];
  meal_options: MealOptionRow[];
}
interface PlanMeta {
  id: string;
  name: string;
  description: string | null;
  target_calories: number | null;
  target_mode: "percent" | "grams";
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  target_protein_pct: number | null;
  target_carbs_pct: number | null;
  target_fat_pct: number | null;
}
interface Version {
  id: string;
  version: number;
  published_at: string | null;
  intro: string | null;
  headline: string | null;
  metric_value: string | null;
  metric_label: string | null;
  metric_note: string | null;
  mission_title: string | null;
  mission_body: string | null;
  callout_title: string | null;
  callout_body: string | null;
  closing_note: string | null;
  pdf_name: string | null;
  meal_plans: PlanMeta;
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
  const [meta, setMeta] = useState<PlanMeta>(version.meal_plans);
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
      setMeals([...meals, { id: res.mealId, name, note: null, chip_text: null, position: meals.length + 1, meal_items: [], meal_options: [] }]);
      flashSaved();
    }
  }

  async function onDeleteMeal(mealId: string) {
    setMeals(meals.filter((m) => m.id !== mealId));
    await deleteMeal(mealId);
    flashSaved();
  }

  async function onAddItem(meal: Meal, item: PickedFood) {
    const payload = { name: item.name, portion: item.portion, protein: item.protein, carbs: item.carbs, fats: item.fats, calories: item.calories };
    const res = await addMealItem(meal.id, payload, meal.meal_items.length + 1);
    if ("id" in res && res.id) {
      setMeals(
        meals.map((m) =>
          m.id === meal.id
            ? { ...m, meal_items: [...m.meal_items, { ...payload, id: res.id!, position: m.meal_items.length + 1 }] }
            : m,
        ),
      );
      flashSaved();
    }
  }

  function saveMeta(fields: Partial<PlanMeta>) {
    const next = { ...meta, ...fields };
    setMeta(next);
    updateMealPlanMeta(meta.id, fields);
    flashSaved();
  }

  /* Resolved gram targets from either entry mode */
  const kcal = meta.target_calories ?? 0;
  const targets = meta.target_mode === "grams"
    ? { p: meta.target_protein_g ?? 0, c: meta.target_carbs_g ?? 0, f: meta.target_fat_g ?? 0, kcal }
    : {
        p: kcal && meta.target_protein_pct ? Math.round((kcal * meta.target_protein_pct) / 100 / 4) : 0,
        c: kcal && meta.target_carbs_pct ? Math.round((kcal * meta.target_carbs_pct) / 100 / 4) : 0,
        f: kcal && meta.target_fat_pct ? Math.round((kcal * meta.target_fat_pct) / 100 / 9) : 0,
        kcal,
      };
  const totals = meals.reduce(
    (acc, m) => {
      for (const it of m.meal_items) {
        acc.kcal += it.calories ?? 0;
        acc.p += it.protein ?? 0;
        acc.c += it.carbs ?? 0;
        acc.f += it.fats ?? 0;
      }
      return acc;
    },
    { kcal: 0, p: 0, c: 0, f: 0 },
  );

  async function onRemoveItem(mealId: string, itemId: string) {
    setMeals(meals.map((m) => (m.id === mealId ? { ...m, meal_items: m.meal_items.filter((i) => i.id !== itemId) } : m)));
    await removeMealItem(itemId);
    flashSaved();
  }

  async function onPublish(client: { id: string; full_name: string } | null) {
    setBusy(true);
    const res = client
      ? await assignMealPlanCopy(version.id, client.id)
      : await publishMealPlan(version.id);
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
        placeholder="Plan description for the client (how to build a plate, when to eat, anything)."
        defaultValue={version.intro ?? ""}
        onBlur={(e) => {
          updateMealPlanVersion(version.id, { intro: e.target.value || null });
          flashSaved();
        }}
      />

      {/* Plan story (PDF-style hero, mission, callout, closing) */}
      <details className="glass mt-4" style={{ padding: "var(--space-4)" }}>
        <summary className="eyebrow" style={{ cursor: "pointer", color: "var(--text-strong)" }}>
          Plan story (hero, mission, callout, sign-off)
        </summary>
        <div className="mt-3 grid gap-2">
          <input className="input" placeholder='Headline — "One number. That&apos;s it."' defaultValue={version.headline ?? ""}
            onBlur={(e) => { updateMealPlanVersion(version.id, { headline: e.target.value || null }); flashSaved(); }} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input metric" placeholder='Big metric — "70g"' defaultValue={version.metric_value ?? ""}
              onBlur={(e) => { updateMealPlanVersion(version.id, { metric_value: e.target.value || null }); flashSaved(); }} />
            <input className="input" placeholder='Metric label — "protein a day"' defaultValue={version.metric_label ?? ""}
              onBlur={(e) => { updateMealPlanVersion(version.id, { metric_label: e.target.value || null }); flashSaved(); }} />
          </div>
          <textarea className="input" rows={2} placeholder="Metric note — how it spreads across the day" defaultValue={version.metric_note ?? ""}
            onBlur={(e) => { updateMealPlanVersion(version.id, { metric_note: e.target.value || null }); flashSaved(); }} />
          <input className="input" placeholder='Mission title — "Your mission"' defaultValue={version.mission_title ?? ""}
            onBlur={(e) => { updateMealPlanVersion(version.id, { mission_title: e.target.value || null }); flashSaved(); }} />
          <textarea className="input" rows={3} placeholder="Mission body" defaultValue={version.mission_body ?? ""}
            onBlur={(e) => { updateMealPlanVersion(version.id, { mission_body: e.target.value || null }); flashSaved(); }} />
          <input className="input" placeholder='Callout title — "Easiest option of all"' defaultValue={version.callout_title ?? ""}
            onBlur={(e) => { updateMealPlanVersion(version.id, { callout_title: e.target.value || null }); flashSaved(); }} />
          <textarea className="input" rows={2} placeholder="Callout body (dark card under the meals)" defaultValue={version.callout_body ?? ""}
            onBlur={(e) => { updateMealPlanVersion(version.id, { callout_body: e.target.value || null }); flashSaved(); }} />
          <input className="input" placeholder='Closing note — "Nothing changes if nothing changes..."' defaultValue={version.closing_note ?? ""}
            onBlur={(e) => { updateMealPlanVersion(version.id, { closing_note: e.target.value || null }); flashSaved(); }} />
        </div>
      </details>

      {/* Targets */}
      <section className="glass mt-4" style={{ padding: "var(--space-4)" }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="eyebrow" style={{ color: "var(--text-strong)" }}>Targets</h2>
          <div className="seg">
            <button type="button" className="seg__opt" aria-pressed={meta.target_mode === "percent"} onClick={() => saveMeta({ target_mode: "percent" })}>
              % split
            </button>
            <button type="button" className="seg__opt" aria-pressed={meta.target_mode === "grams"} onClick={() => saveMeta({ target_mode: "grams" })}>
              Grams
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <div>
            <span className="field-label" style={{ fontSize: 9 }}>Calories</span>
            <input className="input metric" inputMode="numeric" defaultValue={meta.target_calories ?? ""} placeholder="2500"
              onBlur={(e) => saveMeta({ target_calories: e.target.value ? parseFloat(e.target.value) : null })} />
          </div>
          {meta.target_mode === "percent" ? (
            <>
              <div>
                <span className="field-label" style={{ fontSize: 9 }}>Protein %</span>
                <input className="input metric" inputMode="numeric" defaultValue={meta.target_protein_pct ?? ""} placeholder="30"
                  onBlur={(e) => saveMeta({ target_protein_pct: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
              <div>
                <span className="field-label" style={{ fontSize: 9 }}>Carbs %</span>
                <input className="input metric" inputMode="numeric" defaultValue={meta.target_carbs_pct ?? ""} placeholder="40"
                  onBlur={(e) => saveMeta({ target_carbs_pct: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
              <div>
                <span className="field-label" style={{ fontSize: 9 }}>Fat %</span>
                <input className="input metric" inputMode="numeric" defaultValue={meta.target_fat_pct ?? ""} placeholder="30"
                  onBlur={(e) => saveMeta({ target_fat_pct: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="field-label" style={{ fontSize: 9 }}>Protein g</span>
                <input className="input metric" inputMode="numeric" defaultValue={meta.target_protein_g ?? ""} placeholder="180"
                  onBlur={(e) => saveMeta({ target_protein_g: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
              <div>
                <span className="field-label" style={{ fontSize: 9 }}>Carbs g</span>
                <input className="input metric" inputMode="numeric" defaultValue={meta.target_carbs_g ?? ""} placeholder="250"
                  onBlur={(e) => saveMeta({ target_carbs_g: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
              <div>
                <span className="field-label" style={{ fontSize: 9 }}>Fat g</span>
                <input className="input metric" inputMode="numeric" defaultValue={meta.target_fat_g ?? ""} placeholder="80"
                  onBlur={(e) => saveMeta({ target_fat_g: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
            </>
          )}
        </div>
        <MacroDials totals={totals} targets={targets} />
      </section>

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
                <button key={c.id} type="button" className="btn btn--quiet w-full" onClick={() => onPublish(c)} disabled={busy}>
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
  onAddItem: (item: PickedFood) => void;
  onRemoveItem: (itemId: string) => void;
  onRename: (name: string) => void;
  onNote: (note: string) => void;
}) {
  const [adding, setAdding] = useState(false);

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
      <input
        className="mt-1"
        style={{ border: "var(--rule-hairline)", borderRadius: "var(--radius-full)", background: "var(--surface-sunken)", fontSize: "var(--text-2xs)", padding: "4px 10px", width: 160, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}
        placeholder="~18g · pick one"
        defaultValue={meal.chip_text ?? ""}
        aria-label="Section chip text"
        onBlur={(e) => updateMeal(meal.id, { chip_text: e.target.value || null })}
      />

      <OptionsEditor mealId={meal.id} initial={meal.meal_options ?? []} />

      {[...meal.meal_items]
        .sort((a, b) => a.position - b.position)
        .map((it) => (
          <div key={it.id} className="mt-2 flex items-center justify-between gap-2" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-2)" }}>
            <p style={{ fontSize: "var(--text-sm)" }}>
              {it.name} · <span style={{ color: "var(--text-muted)" }}>{it.portion}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="metric" style={{ fontSize: "var(--text-2xs)", color: "var(--grey-500)" }}>
                {it.calories != null ? `${it.calories} kcal · ` : ""}P{it.protein ?? 0} C{it.carbs ?? 0} F{it.fats ?? 0}
              </span>
              <button type="button" className="btn btn--quiet btn--sm" onClick={() => onRemoveItem(it.id)} aria-label={`Remove ${it.name}`}>
                ✕
              </button>
            </div>
          </div>
        ))}

      {adding && (
        <FoodPicker
          onPick={(f) => {
            onAddItem(f);
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      )}
      <button type="button" className="btn btn--quiet btn--sm mt-3 w-full" onClick={() => setAdding(true)}>
        + Add food
      </button>
    </section>
  );
}

/* Filling macro bars: totals vs targets, live while building. */
export function MacroDials({
  totals,
  targets,
}: {
  totals: { kcal: number; p: number; c: number; f: number };
  targets: { kcal: number; p: number; c: number; f: number };
}) {
  const rows = [
    { label: "Calories", unit: "kcal", have: Math.round(totals.kcal), want: Math.round(targets.kcal), color: "var(--pink-500)" },
    { label: "Protein", unit: "g", have: Math.round(totals.p), want: targets.p, color: "var(--ink-900)" },
    { label: "Carbs", unit: "g", have: Math.round(totals.c), want: targets.c, color: "var(--highlight-deep, #E8C400)" },
    { label: "Fat", unit: "g", have: Math.round(totals.f), want: targets.f, color: "var(--grey-500)" },
  ];
  return (
    <div className="mt-4 grid gap-2">
      {rows.map((r) => {
        const pct = r.want > 0 ? Math.min((r.have / r.want) * 100, 100) : 0;
        const over = r.want > 0 && r.have > r.want * 1.03;
        return (
          <div key={r.label}>
            <div className="flex items-baseline justify-between">
              <span style={{ fontSize: "var(--text-2xs)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                {r.label}
              </span>
              <span className="metric" style={{ fontSize: "var(--text-xs)", color: over ? "var(--danger)" : "var(--text-strong)" }}>
                {r.have}
                {r.want > 0 && <span style={{ color: "var(--text-faint)" }}> / {r.want} {r.unit}</span>}
                {r.want > 0 && !over && r.have < r.want && (
                  <span style={{ color: "var(--text-faint)" }}> · {r.want - r.have} left</span>
                )}
              </span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: "rgb(13 13 15 / 0.07)", overflow: "hidden", marginTop: 3 }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  borderRadius: 4,
                  background: over ? "var(--danger)" : r.color,
                  transition: "width 300ms ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* "Pick one" options editor: 2-3 alternatives per meal window, tags, AI macro estimate. */
function OptionsEditor({ mealId, initial }: { mealId: string; initial: MealOptionRow[] }) {
  const [options, setOptions] = useState<MealOptionRow[]>([...initial].sort((a, b) => a.position - b.position));
  const [busyId, setBusyId] = useState<string | null>(null);

  async function add() {
    const res = await addMealOption(mealId, options.length + 1);
    if ("id" in res && res.id) {
      setOptions([...options, { id: res.id, position: options.length + 1, text: "", tag: null, calories: null, protein: null, carbs: null, fats: null }]);
    }
  }

  async function estimate(opt: MealOptionRow) {
    if (!opt.text.trim() || busyId) return;
    setBusyId(opt.id);
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(opt.text.slice(0, 110))}&deep=1`);
      const json = await res.json();
      const hit = (json.hits ?? []).find((h: { source: string }) => h.source === "ai") ?? (json.hits ?? [])[0];
      if (hit) {
        const fields = { calories: hit.calories, protein: hit.protein, carbs: hit.carbs, fats: hit.fats };
        setOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, ...fields } : o)));
        await updateMealOption(opt.id, fields);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-3 grid gap-2" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
      <p className="eyebrow" style={{ fontSize: 9 }}>Options — client picks one</p>
      {options.map((opt, i) => (
        <div key={opt.id} className="grid gap-1" style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "var(--space-2)" }}>
          <div className="flex items-start gap-2">
            <span className="metric" style={{ fontSize: "var(--text-2xs)", color: "var(--text-faint)", paddingTop: 10 }}>{String(i + 1).padStart(2, "0")}</span>
            <textarea
              className="input"
              rows={2}
              style={{ minHeight: 40 }}
              placeholder="Greek yogurt (¾ cup) with a sliced banana..."
              defaultValue={opt.text}
              onBlur={(e) => {
                setOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)));
                updateMealOption(opt.id, { text: e.target.value });
              }}
            />
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              aria-label="Remove option"
              onClick={async () => {
                setOptions(options.filter((o) => o.id !== opt.id));
                await removeMealOption(opt.id);
              }}
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2" style={{ paddingLeft: 24 }}>
            <select
              className="input"
              style={{ minHeight: 32, width: "auto", fontSize: "var(--text-2xs)", padding: "2px 8px" }}
              aria-label="Option tag"
              defaultValue={opt.tag ?? ""}
              onChange={(e) => updateMealOption(opt.id, { tag: (e.target.value || null) as "zero_prep" | "rough_day" | null })}
            >
              <option value="">numbered</option>
              <option value="zero_prep">ZERO PREP</option>
              <option value="rough_day">ROUGH DAY</option>
            </select>
            <button type="button" className="btn btn--quiet btn--sm" style={{ minHeight: 32 }} onClick={() => estimate(opt)} disabled={busyId === opt.id}>
              {busyId === opt.id ? "Estimating..." : opt.calories != null ? `${opt.calories} kcal · P${opt.protein} C${opt.carbs} F${opt.fats} — re-estimate` : "Estimate macros (AI)"}
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" onClick={add}>
        + Add option
      </button>
    </div>
  );
}
