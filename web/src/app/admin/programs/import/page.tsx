import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { WorkoutImporter } from "@/components/plans/import/WorkoutImporter";
export const dynamic = "force-dynamic";
export default async function ImportPage() {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) redirect("/app");
  const { data, error } = await db
    .from("exercises")
    .select("id,name,youtube_url,cue")
    .eq("archived", false)
    .order("name");
  return (
    <main>
      <Link href="/admin/programs">Back to programs</Link>
      {error ? (
        <p role="alert">
          The exercise library could not be loaded. Reload to try again.
        </p>
      ) : (
        <WorkoutImporter library={data ?? []} />
      )}
    </main>
  );
}
