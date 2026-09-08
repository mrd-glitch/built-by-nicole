"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import {
  documentError,
  type Draft,
  type PlanDocument,
  type Result,
} from "./model";

async function coach() {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  const { data, error } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Only Nicole can change client plans.");
  return db;
}
function message(e: unknown) {
  return e instanceof Error
    ? e.message
    : "Could not save. Your changes are still here; try again.";
}
export async function openPlanDraft(versionId: string): Promise<Result<Draft>> {
  try {
    const db = await coach();
    const { data, error } = await db.rpc("bbn_open_plan_draft", {
      p_version_id: versionId,
    });
    if (error) return { error: error.message };
    return { data };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function savePlanDraft(
  id: string,
  revision: number,
  document: PlanDocument,
): Promise<Result<{ revision: number }>> {
  try {
    const problem = documentError(document);
    if (problem) return { error: problem };
    const db = await coach();
    const { data, error } = await db.rpc("bbn_save_plan_draft", {
      p_id: id,
      p_revision: revision,
      p_document: document,
    });
    return error ? { error: error.message } : { data };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function applyPlanDraft(
  id: string,
  revision: number,
  clientId: string | null,
): Promise<Result<{ versionId: string; clientId: string | null }>> {
  try {
    const db = await coach();
    const { data, error } = await db.rpc("bbn_apply_plan_draft", {
      p_id: id,
      p_revision: revision,
      p_client_id: clientId,
    });
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/admin/programs");
    revalidatePath("/app/fitness");
    revalidatePath("/app");
    if (data.clientId) revalidatePath(`/admin/clients/${data.clientId}`);
    return { data };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function discardPlanDraft(
  id: string,
  revision: number,
): Promise<Result<null>> {
  try {
    const db = await coach();
    const { error } = await db.rpc("bbn_discard_plan_draft", {
      p_id: id,
      p_revision: revision,
    });
    return error ? { error: error.message } : { data: null };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function removeClientMealPlan(
  clientId: string,
  assignmentId: string,
): Promise<Result<null>> {
  try {
    const db = await coach();
    const { data, error } = await db
      .from("meal_plan_assignments")
      .update({ active: false })
      .eq("id", assignmentId)
      .eq("client_id", clientId)
      .eq("active", true)
      .select("id");
    if (error) return { error: error.message };
    if (!data?.length)
      return {
        error:
          "This assignment has changed. Refresh the client page before removing it.",
      };
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath("/app/nutrition");
    revalidatePath("/app");
    return { data: null };
  } catch (e) {
    return { error: message(e) };
  }
}
