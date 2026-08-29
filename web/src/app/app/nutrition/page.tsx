import Image from "next/image";
import { redirect } from "next/navigation";
import { getFoodLogsToday, getMealPlanFor, getSessionUser } from "@/lib/data";
import { FoodJournal } from "@/components/FoodJournal";

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
  const [assignment, foodLogs] = await Promise.all([
    getMealPlanFor(session.user.id),
    getFoodLogsToday(session.user.id),
  ]);

  const showMacros = session.profile?.show_macros ?? false;
  const showCalories = session.profile?.show_calories ?? false;
  const journalOn = session.profile?.food_journal_enabled ?? false;

  const version = assignment?.meal_plan_versions as unknown as {
    intro: string | null;
    pdf_name: string | null;
    pdf_path: string | null;
    meal_plans: { name: string } | null;
    meals: MealRow[];
  } | null;
  const meals = (version?.meals ?? []).sort((a, b) => a.position - b.position);

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
