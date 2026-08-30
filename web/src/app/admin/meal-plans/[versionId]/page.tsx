import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { MealPlanBuilder } from "@/components/builder/MealPlanBuilder";

export const dynamic = "force-dynamic";

export default async function MealPlanBuilderPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
  const supabase = await supabaseServer();

  const [{ data: version }, { data: roles }] = await Promise.all([
    supabase
      .from("meal_plan_versions")
      .select(
        "id, version, published_at, intro, pdf_name, meal_plans(id, name, description, target_calories, target_mode, target_protein_g, target_carbs_g, target_fat_g, target_protein_pct, target_carbs_pct, target_fat_pct), meals(id, name, note, position, meal_items(id, name, portion, protein, carbs, fats, calories, position)), meal_plan_assignments(active, profiles(id, full_name))",
      )
      .eq("id", versionId)
      .single(),
    supabase.from("user_roles").select("user_id").eq("role", "client"),
  ]);

  if (!version) {
    return (
      <main>
        <Link href="/admin/meal-plans">← Meal plans</Link>
        <p className="mt-4" style={{ color: "var(--text-muted)" }}>
          Plan not found.
        </p>
      </main>
    );
  }

  const ids = (roles ?? []).map((r) => r.user_id);
  const { data: clients } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids).eq("status", "active")
    : { data: [] };

  return <MealPlanBuilder version={JSON.parse(JSON.stringify(version))} clients={clients ?? []} />;
}
