import Image from "next/image";
import { redirect } from "next/navigation";
import { getCheckoffsToday, getFoodLogsToday, getMealPlanFor, getSessionUser } from "@/lib/data";
import { FoodJournal } from "@/components/FoodJournal";
import { MealCheckoff } from "@/components/MealCheckoff";
import { MacroDials } from "@/components/builder/MealPlanBuilder";

export const dynamic = "force-dynamic";

interface MealItemRow {
  id: string;
  name: string;
  portion: string;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  calories: number | null;
  position: number;
}
interface MealRow {
  id: string;
  name: string;
  note: string | null;
  position: number;
  meal_items: MealItemRow[];
}

export default async function NutritionPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const [assignment, foodLogs, checkoffs] = await Promise.all([
    getMealPlanFor(session.user.id),
    getFoodLogsToday(session.user.id),
    getCheckoffsToday(session.user.id),
  ]);

  const showMacros = session.profile?.show_macros ?? false;
  const showCalories = session.profile?.show_calories ?? false;
  const journalOn = session.profile?.food_journal_enabled ?? false;

  const version = assignment?.meal_plan_versions as unknown as {
    intro: string | null;
    pdf_name: string | null;
    pdf_path: string | null;
    meal_plans: {
      name: string;
      target_calories: number | null;
      target_mode: "percent" | "grams";
      target_protein_g: number | null;
      target_carbs_g: number | null;
      target_fat_g: number | null;
      target_protein_pct: number | null;
      target_carbs_pct: number | null;
      target_fat_pct: number | null;
    } | null;
    meals: MealRow[];
  } | null;
  const meals = (version?.meals ?? []).sort((a, b) => a.position - b.position);

  // Today's eaten totals: checked meals (as-written = full plan items; custom = its items) + journal extras
  const checkoffByMeal = new Map(checkoffs.map((c) => [c.meal_id, c]));
  const eaten = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const c of checkoffs) {
    if (c.status === "ate_as_written") {
      const meal = meals.find((m) => m.id === c.meal_id);
      for (const it of meal?.meal_items ?? []) {
        eaten.kcal += it.calories ?? 0;
        eaten.p += it.protein ?? 0;
        eaten.c += it.carbs ?? 0;
        eaten.f += it.fats ?? 0;
      }
    } else {
      for (const it of c.meal_checkoff_items ?? []) {
        eaten.kcal += it.calories ?? 0;
        eaten.p += it.protein ?? 0;
        eaten.c += it.carbs ?? 0;
        eaten.f += it.fats ?? 0;
      }
    }
  }
  for (const l of foodLogs) {
    eaten.kcal += l.calories ?? 0;
    eaten.p += l.protein ?? 0;
    eaten.c += l.carbs ?? 0;
    eaten.f += l.fats ?? 0;
  }
  const mp = version?.meal_plans;
  const tKcal = mp?.target_calories ?? 0;
  const targets = mp
    ? mp.target_mode === "grams"
      ? { kcal: tKcal, p: mp.target_protein_g ?? 0, c: mp.target_carbs_g ?? 0, f: mp.target_fat_g ?? 0 }
      : {
          kcal: tKcal,
          p: tKcal && mp.target_protein_pct ? Math.round((tKcal * mp.target_protein_pct) / 100 / 4) : 0,
          c: tKcal && mp.target_carbs_pct ? Math.round((tKcal * mp.target_carbs_pct) / 100 / 4) : 0,
          f: tKcal && mp.target_fat_pct ? Math.round((tKcal * mp.target_fat_pct) / 100 / 9) : 0,
        }
    : { kcal: 0, p: 0, c: 0, f: 0 };

  return (
    <main className="page-pad">
      {/* Photo header */}
      <div className="photocard">
        <Image src="/cards/nutrition-plate.jpg" alt="" width={900} height={675} className="h-40 w-full object-cover" priority />
        <div className="photocard__bar">
          <div>
            <p className="eyebrow" style={{ color: "var(--pink-300)", fontSize: 9 }}>
              Nutrition
            </p>
            <h1 style={{ fontSize: "var(--text-lg)", color: "var(--paper-50)" }}>{version?.meal_plans?.name ?? "No plan yet"}</h1>
          </div>
        </div>
      </div>
      {!version && (
        <div className="card card--sunken mt-4" style={{ padding: "var(--space-5)" }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Nicole is writing your plan from your intake. It shows up here, nothing to download.
          </p>
        </div>
      )}
      {version?.intro && (
        <p className="mt-3 card card--sunken" style={{ fontSize: "var(--text-sm)", color: "var(--text-body)", padding: "var(--space-4)" }}>
          {version.intro}
        </p>
      )}

      {showMacros && version && (targets.kcal > 0 || eaten.kcal > 0) && (
        <section className="glass mt-4" style={{ padding: "var(--space-4)" }}>
          <h2 className="eyebrow" style={{ color: "var(--text-strong)" }}>
            Today so far
          </h2>
          <MacroDials totals={eaten} targets={targets} />
        </section>
      )}

      <div className="mt-5 grid gap-3">
        {meals.map((meal) => (
          <section key={meal.id} className="card" style={{ padding: "var(--space-4)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-extrabold)", fontSize: "var(--text-base)", color: "var(--text-strong)" }}>
              {meal.name}
            </h2>
            {meal.note && (
              <p className="mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--pink-700)" }}>
                {meal.note}
              </p>
            )}
            <ul className="mt-3 grid gap-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[...meal.meal_items]
                .sort((a, b) => a.position - b.position)
                .map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-3" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-2)" }}>
                    <div>
                      <p style={{ fontSize: "var(--text-base)", color: "var(--text-strong)" }}>{item.name}</p>
                      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{item.portion}</p>
                    </div>
                    {showMacros && (
                      <span className="metric" style={{ fontSize: "var(--text-2xs)", color: "var(--grey-500)", whiteSpace: "nowrap" }}>
                        P{item.protein ?? 0} C{item.carbs ?? 0} F{item.fats ?? 0}
                        {showCalories && item.calories ? ` · ${item.calories}` : ""}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
            <MealCheckoff
              mealId={meal.id}
              items={[...meal.meal_items].sort((a, b) => a.position - b.position)}
              existing={(() => {
                const c = checkoffByMeal.get(meal.id);
                return c ? { id: c.id, status: c.status as "ate_as_written" | "custom" } : null;
              })()}
            />
          </section>
        ))}
      </div>

      {version?.pdf_name && (
        <button type="button" className="btn btn--ghost mt-4 w-full">
          View {version.pdf_name}
        </button>
      )}

      {journalOn && <FoodJournal initial={foodLogs} />}
    </main>
  );
}
