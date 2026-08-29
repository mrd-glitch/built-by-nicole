import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { NewMealPlanButton } from "@/components/builder/NewMealPlanButton";

export const dynamic = "force-dynamic";

export default async function MealPlansPage() {
  const supabase = await supabaseServer();
  const { data: plans } = await supabase
    .from("meal_plans")
    .select("id, name, created_at, meal_plan_versions(id, version, published_at, meal_plan_assignments(active, profiles(full_name)))")
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: 860 }}>
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Meal plans</h1>
        <NewMealPlanButton />
      </div>

      <div className="mt-6 grid gap-3">
        {(plans ?? []).length === 0 && (
          <div className="card card--sunken text-center" style={{ padding: "var(--space-10)" }}>
            <p style={{ color: "var(--text-muted)" }}>No meal plans yet.</p>
          </div>
        )}
        {(plans ?? []).map((p) => {
          const versions = (p.meal_plan_versions ?? []) as unknown as {
            id: string;
            version: number;
            published_at: string | null;
            meal_plan_assignments: { active: boolean; profiles: { full_name: string } | null }[];
          }[];
          const latest = [...versions].sort((a, b) => b.version - a.version)[0];
          if (!latest) return null;
          const assigned = versions
            .flatMap((v) => v.meal_plan_assignments ?? [])
            .filter((a) => a.active)
            .map((a) => a.profiles?.full_name)
            .filter(Boolean);
          return (
            <Link
              key={p.id}
              href={`/admin/meal-plans/${latest.id}`}
              className="card flex flex-wrap items-center justify-between gap-3"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-extrabold)", fontSize: "var(--text-md)", color: "var(--text-strong)" }}>
                  {p.name}
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                  {assigned.length > 0 ? `Assigned to ${assigned.join(", ")}` : "Not assigned yet"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${latest.published_at ? "badge--green" : "badge--yellow"}`}>
                  {latest.published_at ? "Published" : "Draft"}
                </span>
                <span className="btn btn--quiet btn--sm">Open</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
