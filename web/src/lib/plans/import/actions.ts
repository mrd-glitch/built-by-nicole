"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { documentError, type Result } from "../model";
import { importDocument } from "./format";
import { parseCoachingText } from "./coaching";
export interface ImportResult {
  versionId: string | null;
  mealVersionId?: string | null;
  reused: boolean;
  state: "editing" | "applied";
}
export async function createImportedDraft(
  text: string,
  matches: Record<string, string>,
): Promise<Result<ImportResult>> {
  try {
    const db = await supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new Error("Sign in as Nicole to import a plan.");
    const { data: role, error: roleError } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !role) throw new Error("Only Nicole can import plans.");
    const parsed = await parseCoachingText(text);
    if (
      !matches ||
      typeof matches !== "object" ||
      Array.isArray(matches) ||
      Object.keys(matches).length > 5200
    )
      throw new Error("Choose valid exercise-library matches.");
    const { data: library, error } = await db
      .from("exercises")
      .select("id,name,youtube_url,cue")
      .eq("archived", false);
    if (error)
      throw new Error("The exercise library could not be loaded. Try again.");
    const document = parsed.plan.workout
      ? importDocument(parsed.plan.workout, matches, library ?? [])
      : null;
    const problem = document ? documentError(document) : null;
    if (problem) throw new Error(problem);
    const { data, error: saveError } = await db.rpc("bbn_import_coaching", {
      p_source_id: parsed.plan.plan_id,
      p_revision: parsed.plan.revision,
      p_checksum: parsed.checksum,
      p_document: document,
      p_meal: parsed.plan.meal,
    });
    if (saveError) throw new Error(saveError.message);
    revalidatePath("/admin/programs");
    revalidatePath("/admin/meal-plans");
    return { data };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Import failed. Your current client plan has not changed. Please retry.",
    };
  }
}
