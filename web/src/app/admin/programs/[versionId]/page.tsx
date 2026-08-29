import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { ProgramBuilder } from "@/components/builder/ProgramBuilder";

export const dynamic = "force-dynamic";

export default async function ProgramBuilderPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
  const supabase = await supabaseServer();

  const [{ data: version }, { data: exercises }, { data: roles }] = await Promise.all([
    supabase
      .from("program_versions")
      .select(
        "id, version, published_at, programs(id, name), program_days(id, week, day, title, position, day_blocks(id, label, rest_note, position, block_exercises(id, exercise_id, exercise_name, sets, rep_range, target_weight_lbs, optional, optional_note, position))), program_assignments(active, profiles(id, full_name))",
      )
      .eq("id", versionId)
      .single(),
    supabase.from("exercises").select("id, name, youtube_url, cue").eq("archived", false).order("name"),
    supabase.from("user_roles").select("user_id").eq("role", "client"),
  ]);

  if (!version) {
    return (
      <main>
        <Link href="/admin/programs">← Programs</Link>
        <p className="mt-4" style={{ color: "var(--text-muted)" }}>
          Program not found.
        </p>
      </main>
    );
  }

  const ids = (roles ?? []).map((r) => r.user_id);
  const { data: clients } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids).eq("status", "active")
    : { data: [] };

  return (
    <ProgramBuilder
      version={JSON.parse(JSON.stringify(version))}
      exercises={exercises ?? []}
      clients={clients ?? []}
    />
  );
}
