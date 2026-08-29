"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

/* Admin plan-builder actions. All run under Nicole's session — RLS admin
   policies enforce access; no service role needed here. */

async function admin() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return supabase;
}

/* ---------- programs ---------- */

export async function createProgram(name: string, weeks: number, daysPerWeek: number) {
  const supabase = await admin();
  const { data: program, error } = await supabase.from("programs").insert({ name }).select("id").single();
  if (error) return { error: error.message };
  const { data: version, error: vErr } = await supabase
    .from("program_versions")
    .insert({ program_id: program.id, version: 1 })
    .select("id")
    .single();
  if (vErr) return { error: vErr.message };

  const days = [];
  let pos = 0;
  for (let w = 1; w <= weeks; w++)
    for (let d = 1; d <= daysPerWeek; d++)
      days.push({ version_id: version.id, week: w, day: d, title: "Full Body", position: ++pos });
  const { error: dErr } = await supabase.from("program_days").insert(days);
  if (dErr) return { error: dErr.message };

  revalidatePath("/admin/programs");
  return { ok: true, versionId: version.id as string };
}

export async function renameDay(dayId: string, title: string) {
  const supabase = await admin();
  await supabase.from("program_days").update({ title: title.slice(0, 60) }).eq("id", dayId);
  return { ok: true };
}

export async function addBlock(dayId: string, position: number) {
  const supabase = await admin();
  const { data, error } = await supabase
    .from("day_blocks")
    .insert({ day_id: dayId, label: `${position})`, position })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { ok: true, blockId: data.id as string };
}

export async function updateBlock(blockId: string, fields: { label?: string; rest_note?: string | null }) {
  const supabase = await admin();
  const { error } = await supabase.from("day_blocks").update(fields).eq("id", blockId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteBlock(blockId: string) {
  const supabase = await admin();
  const { error } = await supabase.from("day_blocks").delete().eq("id", blockId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function addExerciseToBlock(
  blockId: string,
  exercise: { id: string; name: string },
  position: number,
) {
  const supabase = await admin();
  const { data, error } = await supabase
    .from("block_exercises")
    .insert({
      block_id: blockId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 3,
      rep_range: "8-10",
      position,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { ok: true, id: data.id as string };
}

export async function updateBlockExercise(
  id: string,
  fields: { sets?: number; rep_range?: string; target_weight_lbs?: number | null; optional?: boolean; optional_note?: string | null },
) {
  const supabase = await admin();
  const { error } = await supabase.from("block_exercises").update(fields).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function removeBlockExercise(id: string) {
  const supabase = await admin();
  const { error } = await supabase.from("block_exercises").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function copyDayBlocks(fromDayId: string, toDayId: string) {
  const supabase = await admin();
  const { data: blocks, error } = await supabase
    .from("day_blocks")
    .select("label, rest_note, position, block_exercises(exercise_id, exercise_name, sets, rep_range, target_weight_lbs, optional, optional_note, position)")
    .eq("day_id", fromDayId)
    .order("position");
  if (error) return { error: error.message };
  for (const b of blocks ?? []) {
    const { data: nb, error: bErr } = await supabase
      .from("day_blocks")
      .insert({ day_id: toDayId, label: b.label, rest_note: b.rest_note, position: b.position })
      .select("id")
      .single();
    if (bErr) return { error: bErr.message };
    const rows = (b.block_exercises ?? []).map((e) => ({ ...e, block_id: nb.id }));
    if (rows.length) {
      const { error: eErr } = await supabase.from("block_exercises").insert(rows);
      if (eErr) return { error: eErr.message };
    }
  }
  return { ok: true };
}

export async function publishAndAssign(versionId: string, clientId: string | null) {
  const supabase = await admin();
  const { error } = await supabase
    .from("program_versions")
    .update({ published_at: new Date().toISOString() })
    .eq("id", versionId);
  if (error) return { error: error.message };
  if (clientId) {
    await supabase.from("program_assignments").update({ active: false }).eq("client_id", clientId).eq("active", true);
    const { error: aErr } = await supabase
      .from("program_assignments")
      .insert({ client_id: clientId, version_id: versionId });
    if (aErr) return { error: aErr.message };
  }
  revalidatePath("/admin/programs");
  return { ok: true };
}

export async function createExerciseQuick(name: string, youtubeUrl: string | null, cue: string | null) {
  const supabase = await admin();
  const { data, error } = await supabase
    .from("exercises")
    .insert({ name: name.trim(), youtube_url: youtubeUrl, cue })
    .select("id, name")
    .single();
  if (error) return { error: error.message };
  return { ok: true, exercise: data };
}

/* ---------- meal plans ---------- */

export async function createMealPlan(name: string) {
  const supabase = await admin();
  const { data: plan, error } = await supabase.from("meal_plans").insert({ name }).select("id").single();
  if (error) return { error: error.message };
  const { data: version, error: vErr } = await supabase
    .from("meal_plan_versions")
    .insert({ meal_plan_id: plan.id, version: 1 })
    .select("id")
    .single();
  if (vErr) return { error: vErr.message };
  revalidatePath("/admin/meal-plans");
  return { ok: true, versionId: version.id as string };
}

export async function updateMealPlanVersion(versionId: string, fields: { intro?: string | null }) {
  const supabase = await admin();
  const { error } = await supabase.from("meal_plan_versions").update(fields).eq("id", versionId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function addMeal(versionId: string, name: string, position: number) {
  const supabase = await admin();
  const { data, error } = await supabase
    .from("meals")
    .insert({ version_id: versionId, name, position })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { ok: true, mealId: data.id as string };
}

export async function updateMeal(mealId: string, fields: { name?: string; note?: string | null }) {
  const supabase = await admin();
  const { error } = await supabase.from("meals").update(fields).eq("id", mealId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteMeal(mealId: string) {
  const supabase = await admin();
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function addMealItem(
  mealId: string,
  item: { name: string; portion: string; protein?: number | null; carbs?: number | null; fats?: number | null; calories?: number | null },
  position: number,
) {
  const supabase = await admin();
  const { data, error } = await supabase
    .from("meal_items")
    .insert({ meal_id: mealId, ...item, position })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { ok: true, id: data.id as string };
}

export async function removeMealItem(id: string) {
  const supabase = await admin();
  const { error } = await supabase.from("meal_items").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function publishAndAssignMealPlan(versionId: string, clientId: string | null) {
  const supabase = await admin();
  const { error } = await supabase
    .from("meal_plan_versions")
    .update({ published_at: new Date().toISOString() })
    .eq("id", versionId);
  if (error) return { error: error.message };
  if (clientId) {
    await supabase.from("meal_plan_assignments").update({ active: false }).eq("client_id", clientId).eq("active", true);
    const { error: aErr } = await supabase
      .from("meal_plan_assignments")
      .insert({ client_id: clientId, version_id: versionId });
    if (aErr) return { error: aErr.message };
  }
  revalidatePath("/admin/meal-plans");
  return { ok: true };
}
