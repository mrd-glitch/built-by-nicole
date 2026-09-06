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

export async function createProgram(name: string, weeks: number, daysPerWeek: number, description?: string) {
  const supabase = await admin();
  // v2: build each unique day ONCE; weeks replicate automatically with per-week overrides.
  const { data: program, error } = await supabase
    .from("programs")
    .insert({ name, weeks, days_per_week: daysPerWeek, description: description || null, is_template: true })
    .select("id")
    .single();
  if (error) return { error: error.message };
  const { data: version, error: vErr } = await supabase
    .from("program_versions")
    .insert({ program_id: program.id, version: 1 })
    .select("id")
    .single();
  if (vErr) return { error: vErr.message };

  const days = [];
  for (let d = 1; d <= daysPerWeek; d++)
    days.push({ version_id: version.id, week: 1, day: d, title: "Full Body", position: d });
  const { error: dErr } = await supabase.from("program_days").insert(days);
  if (dErr) return { error: dErr.message };

  revalidatePath("/admin/programs");
  return { ok: true, versionId: version.id as string };
}

export async function updateProgramMeta(
  programId: string,
  fields: { name?: string; description?: string | null; weeks?: number },
) {
  const supabase = await admin();
  const { error } = await supabase.from("programs").update(fields).eq("id", programId);
  if (error) return { error: error.message };
  return { ok: true };
}

/* Per-week progression override. Null fields fall back to the base exercise. */
export async function setWeekOverride(
  blockExerciseId: string,
  week: number,
  fields: { sets?: number | null; rep_range?: string | null; target_weight_lbs?: number | null },
) {
  const supabase = await admin();
  const empty = fields.sets == null && !fields.rep_range && fields.target_weight_lbs == null;
  if (empty) {
    await supabase.from("program_week_overrides").delete().eq("block_exercise_id", blockExerciseId).eq("week", week);
    return { ok: true };
  }
  const { error } = await supabase
    .from("program_week_overrides")
    .upsert({ block_exercise_id: blockExerciseId, week, ...fields }, { onConflict: "block_exercise_id,week" });
  if (error) return { error: error.message };
  return { ok: true };
}

/* Copy-on-assign: deep-copy the program so the client gets a private version;
   the library master never changes. */
export async function assignProgramCopy(versionId: string, clientId: string, clientName: string) {
  const supabase = await admin();
  const { data: src, error: sErr } = await supabase
    .from("program_versions")
    .select("id, program_id, programs(name, description, weeks, days_per_week), program_days(id, week, day, title, position, day_blocks(id, label, rest_note, position, block_exercises(id, exercise_id, exercise_name, sets, rep_range, target_weight_lbs, optional, optional_note, directions, position, program_week_overrides(week, sets, rep_range, target_weight_lbs))))")
    .eq("id", versionId)
    .single();
  if (sErr || !src) return { error: sErr?.message ?? "Program not found" };

  const meta = src.programs as unknown as { name: string; description: string | null; weeks: number; days_per_week: number };
  const first = clientName.split(" ")[0] || "client";
  const { data: prog, error: pErr } = await supabase
    .from("programs")
    .insert({
      name: `${meta.name} · ${first}`,
      description: meta.description,
      weeks: meta.weeks,
      days_per_week: meta.days_per_week,
      is_template: false,
      source_program_id: src.program_id,
    })
    .select("id")
    .single();
  if (pErr) return { error: pErr.message };
  const { data: ver, error: vErr } = await supabase
    .from("program_versions")
    .insert({ program_id: prog.id, version: 1, published_at: new Date().toISOString() })
    .select("id")
    .single();
  if (vErr) return { error: vErr.message };

  for (const d of src.program_days ?? []) {
    const { data: nd, error: dErr } = await supabase
      .from("program_days")
      .insert({ version_id: ver.id, week: d.week, day: d.day, title: d.title, position: d.position })
      .select("id")
      .single();
    if (dErr) return { error: dErr.message };
    for (const b of d.day_blocks ?? []) {
      const { data: nb, error: bErr } = await supabase
        .from("day_blocks")
        .insert({ day_id: nd.id, label: b.label, rest_note: b.rest_note, position: b.position })
        .select("id")
        .single();
      if (bErr) return { error: bErr.message };
      for (const e of b.block_exercises ?? []) {
        const { program_week_overrides: overrides, id: _oldId, ...fields } = e;
        const { data: ne, error: eErr } = await supabase
          .from("block_exercises")
          .insert({ ...fields, block_id: nb.id })
          .select("id")
          .single();
        if (eErr) return { error: eErr.message };
        const oRows = (overrides ?? []).map((o) => ({ ...o, block_exercise_id: ne.id }));
        if (oRows.length) {
          const { error: oErr } = await supabase.from("program_week_overrides").insert(oRows);
          if (oErr) return { error: oErr.message };
        }
      }
    }
  }

  await supabase.from("program_assignments").update({ active: false }).eq("client_id", clientId).eq("active", true);
  const { error: aErr } = await supabase.from("program_assignments").insert({ client_id: clientId, version_id: ver.id });
  if (aErr) return { error: aErr.message };

  revalidatePath("/admin/programs");
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true, versionId: ver.id as string };
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

/* Builder v3 mutations run as single transactional Postgres functions
   (web/supabase/migrations/007_bbn_builder_v3.sql): positions are allocated
   under a per-day row lock, and a block is never left behind empty. */

export async function addExerciseToDay(dayId: string, exercise: { id: string; name: string }) {
  const supabase = await admin();
  const { data, error } = await supabase
    .rpc("bbn_add_exercise_to_day", { p_day_id: dayId, p_exercise_id: exercise.id, p_exercise_name: exercise.name })
    .single();
  if (error) return { error: error.message };
  const row = data as { block_id: string; be_id: string; out_position: number; sets: number; rep_range: string; target_weight_lbs: number | null };
  return { ok: true, blockId: row.block_id, id: row.be_id, position: row.out_position, sets: row.sets, rep_range: row.rep_range, target_weight_lbs: row.target_weight_lbs };
}

export async function moveExerciseToBlock(beId: string, targetBlockId: string) {
  const supabase = await admin();
  const { data, error } = await supabase.rpc("bbn_move_exercise_to_block", { p_be_id: beId, p_target_block: targetBlockId });
  if (error) return { error: error.message };
  return { ok: true, position: data as number };
}

export async function removeExercise(beId: string) {
  const supabase = await admin();
  const { error } = await supabase.rpc("bbn_remove_exercise", { p_be_id: beId });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function splitExerciseOut(beId: string) {
  const supabase = await admin();
  const { data, error } = await supabase.rpc("bbn_split_exercise_out", { p_be_id: beId }).single();
  if (error) return { error: error.message };
  const row = data as { block_id: string; out_position: number };
  return { ok: true, blockId: row.block_id, position: row.out_position };
}

export async function updateBlockExercise(
  id: string,
  fields: { sets?: number; rep_range?: string; target_weight_lbs?: number | null; optional?: boolean; optional_note?: string | null; directions?: string | null },
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

export async function updateMealPlanVersion(
  versionId: string,
  fields: {
    intro?: string | null;
    headline?: string | null;
    metric_value?: string | null;
    metric_label?: string | null;
    metric_note?: string | null;
    mission_title?: string | null;
    mission_body?: string | null;
    callout_title?: string | null;
    callout_body?: string | null;
    closing_note?: string | null;
  },
) {
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

export async function updateMeal(mealId: string, fields: { name?: string; note?: string | null; chip_text?: string | null }) {
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

export async function publishMealPlan(versionId: string) {
  const supabase = await admin();
  const { error } = await supabase
    .from("meal_plan_versions")
    .update({ published_at: new Date().toISOString() })
    .eq("id", versionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/meal-plans");
  return { ok: true };
}

export async function updateMealPlanMeta(
  planId: string,
  fields: {
    name?: string;
    description?: string | null;
    target_calories?: number | null;
    target_mode?: "percent" | "grams";
    target_protein_g?: number | null;
    target_carbs_g?: number | null;
    target_fat_g?: number | null;
    target_protein_pct?: number | null;
    target_carbs_pct?: number | null;
    target_fat_pct?: number | null;
  },
) {
  const supabase = await admin();
  const { error } = await supabase.from("meal_plans").update(fields).eq("id", planId);
  if (error) return { error: error.message };
  return { ok: true };
}

/* Copy-on-assign for meal plans, mirroring programs. */
export async function assignMealPlanCopy(versionId: string, clientId: string, clientName: string) {
  const supabase = await admin();
  const { data: src, error: sErr } = await supabase
    .from("meal_plan_versions")
    .select("id, meal_plan_id, intro, pdf_path, pdf_name, headline, metric_value, metric_label, metric_note, mission_title, mission_body, callout_title, callout_body, closing_note, meal_plans(name, description, target_calories, target_mode, target_protein_g, target_carbs_g, target_fat_g, target_protein_pct, target_carbs_pct, target_fat_pct), meals(id, name, note, chip_text, position, meal_items(name, portion, protein, carbs, fats, calories, position), meal_options(position, text, tag, calories, protein, carbs, fats))")
    .eq("id", versionId)
    .single();
  if (sErr || !src) return { error: sErr?.message ?? "Meal plan not found" };

  const meta = src.meal_plans as unknown as Record<string, unknown> & { name: string };
  const first = clientName.split(" ")[0] || "client";
  const { name, ...targets } = meta;
  const { data: plan, error: pErr } = await supabase
    .from("meal_plans")
    .insert({ ...targets, name: `${name} · ${first}`, is_template: false, source_meal_plan_id: src.meal_plan_id })
    .select("id")
    .single();
  if (pErr) return { error: pErr.message };
  const { data: ver, error: vErr } = await supabase
    .from("meal_plan_versions")
    .insert({
      meal_plan_id: plan.id,
      version: 1,
      intro: src.intro,
      pdf_path: src.pdf_path,
      pdf_name: src.pdf_name,
      headline: src.headline,
      metric_value: src.metric_value,
      metric_label: src.metric_label,
      metric_note: src.metric_note,
      mission_title: src.mission_title,
      mission_body: src.mission_body,
      callout_title: src.callout_title,
      callout_body: src.callout_body,
      closing_note: src.closing_note,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (vErr) return { error: vErr.message };

  for (const m of src.meals ?? []) {
    const { data: nm, error: mErr } = await supabase
      .from("meals")
      .insert({ version_id: ver.id, name: m.name, note: m.note, chip_text: m.chip_text, position: m.position })
      .select("id")
      .single();
    if (mErr) return { error: mErr.message };
    const rows = (m.meal_items ?? []).map((i) => ({ ...i, meal_id: nm.id }));
    if (rows.length) {
      const { error: iErr } = await supabase.from("meal_items").insert(rows);
      if (iErr) return { error: iErr.message };
    }
    const oRows = (m.meal_options ?? []).map((o) => ({ ...o, meal_id: nm.id }));
    if (oRows.length) {
      const { error: oErr } = await supabase.from("meal_options").insert(oRows);
      if (oErr) return { error: oErr.message };
    }
  }

  await supabase.from("meal_plan_assignments").update({ active: false }).eq("client_id", clientId).eq("active", true);
  const { error: aErr } = await supabase.from("meal_plan_assignments").insert({ client_id: clientId, version_id: ver.id });
  if (aErr) return { error: aErr.message };

  revalidatePath("/admin/meal-plans");
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true, versionId: ver.id as string };
}

/* ---------- meal options (pick-one rows) ---------- */

export async function addMealOption(mealId: string, position: number) {
  const supabase = await admin();
  const { data, error } = await supabase
    .from("meal_options")
    .insert({ meal_id: mealId, position, text: "" })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { ok: true, id: data.id as string };
}

export async function updateMealOption(
  id: string,
  fields: { text?: string; tag?: "zero_prep" | "rough_day" | null; calories?: number | null; protein?: number | null; carbs?: number | null; fats?: number | null },
) {
  const supabase = await admin();
  const { error } = await supabase.from("meal_options").update(fields).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function removeMealOption(id: string) {
  const supabase = await admin();
  const { error } = await supabase.from("meal_options").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
