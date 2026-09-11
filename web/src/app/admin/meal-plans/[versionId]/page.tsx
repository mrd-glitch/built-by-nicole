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
        "id, version, published_at, intro, headline, metric_value, metric_label, metric_note, mission_title, mission_body, callout_title, callout_body, closing_note, pdf_name, meal_plans(id, name, description, target_calories, target_mode, target_protein_g, target_carbs_g, target_fat_g, target_protein_pct, target_carbs_pct, target_fat_pct), meals(id, name, note, chip_text, position, meal_items(id, name, portion, protein, carbs, fats, calories, position), meal_options(id, position, text, tag, calories, protein, carbs, fats)), meal_plan_assignments(active, profiles(id, full_name))",
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
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids)
        .eq("status", "active")
    : { data: [] };

  const { data: privateNotes, error: notesError } = await supabase
    .from("meal_plan_coach_notes")
    .select("notes")
    .eq("version_id", versionId)
    .maybeSingle();
  return (
    <>
      {notesError ? (
        <p role="alert">
          Private notes could not be loaded. Reload before reviewing this plan.
        </p>
      ) : (
        Array.isArray(privateNotes?.notes) &&
        privateNotes.notes.length > 0 && (
          <section className="card" style={{ marginBottom: 24 }}>
            <h2>Private notes for Nicole</h2>
            <p>These notes are never shown to the client.</p>
            {privateNotes.notes.map(
              (n: { meal: number | null; text: string }, i: number) => (
                <p key={i}>
                  {n.meal ? `Meal ${n.meal}` : "Plan"}: {n.text}
                </p>
              ),
            )}
          </section>
        )
      )}
      <MealPlanBuilder
        version={JSON.parse(JSON.stringify(version))}
        clients={clients ?? []}
      />
    </>
  );
}
