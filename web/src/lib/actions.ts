"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { buildSnapshot } from "@/lib/snapshot";
import { checkinWindow } from "@/lib/checkin-window";

/* ---------- helpers ---------- */

async function requireAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (role?.role !== "admin") throw new Error("Admin only");
  return { supabase, user };
}

/* Service-role client, constructed ONLY after the caller's session is verified
   as an active admin (PLAN.md hardening). */
function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set — see docs/SETUP.md");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}

/* ---------- auth ---------- */

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That login didn't work. Check the email and password." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user!.id)
    .single();
  redirect(role?.role === "admin" ? "/admin" : "/app");
}

export async function logout() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

/* ---------- public intake ---------- */

export async function submitApplication(answers: Record<string, string>) {
  // server-side validation: required fields + length caps
  const required = ["firstName", "lastName", "email", "phone", "goal", "experience", "daysPerWeek", "equipment", "nutritionHabits", "lifestyle"];
  for (const k of required) {
    if (!answers[k]?.trim()) return { error: `Missing ${k}` };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(answers.email)) return { error: "That email doesn't look right." };
  for (const [k, v] of Object.entries(answers)) {
    if (v.length > 2000) return { error: `Answer too long: ${k}` };
  }

  const supabase = await supabaseServer();
  const snapshot = buildSnapshot(answers);
  const { error } = await supabase.from("applications").insert({
    email: answers.email.trim().toLowerCase(),
    answers,
    snapshot,
  });
  if (error) {
    if (error.code === "23505") return { error: "You already have an application in. Nicole will be in touch." };
    return { error: "Something broke on our end. Try again in a minute." };
  }
  return { ok: true };
}

/* ---------- admin: applications ---------- */

export async function approveApplication(applicationId: string) {
  const { supabase } = await requireAdmin();
  const { data: app } = await supabase.from("applications").select("*").eq("id", applicationId).single();
  if (!app || app.status !== "new") return { error: "Application not found or already decided." };

  const svc = serviceClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3400";
  const { data: invited, error: invErr } = await svc.auth.admin.inviteUserByEmail(app.email, {
    redirectTo: `${site}/set-password`,
  });
  if (invErr) return { error: `Invite failed: ${invErr.message}` };

  const uid = invited.user.id;
  const a = app.answers as Record<string, string>;
  await svc.from("user_roles").upsert({ user_id: uid, role: "client" });
  await svc.from("profiles").upsert({
    id: uid,
    full_name: `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim(),
    first_name: a.firstName ?? "",
    email: app.email,
  });
  await svc.from("applications").update({ status: "approved", invited_user_id: uid, decided_at: new Date().toISOString() }).eq("id", applicationId);

  revalidatePath("/admin/applications");
  return { ok: true };
}

export async function declineApplication(applicationId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("applications").update({ status: "declined", decided_at: new Date().toISOString() }).eq("id", applicationId);
  revalidatePath("/admin/applications");
  return { ok: true };
}

/* ---------- admin: client toggles ---------- */

export async function updateToggles(clientId: string, toggles: { show_macros?: boolean; show_calories?: boolean; food_journal_enabled?: boolean; daily_weight_enabled?: boolean; status?: string }) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("profiles").update(toggles).eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

/* ---------- client: check-in ---------- */

function isoWeekOf(d: Date, tz = "America/Edmonton") {
  // ISO week in client's timezone
  const local = new Date(d.toLocaleString("en-US", { timeZone: tz }));
  const target = new Date(local.valueOf());
  const dayNr = (local.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week = 1 + Math.round(((target.valueOf() - firstThursday.valueOf()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function submitCheckin(input: {
  dryWeightLbs: number;
  mealRating: number;
  mealNote: string;
  fitnessRating: number;
  fitnessNote: string;
  comments: string;
  proud?: string;
  excited?: string;
  energyRating?: number;
  focusNextWeek?: string;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const tz = profile?.timezone ?? "America/Edmonton";

  // Sat-Mon window; outside it only a Nicole-reopened week can be submitted.
  const win = checkinWindow(tz);
  let targetWeek = win.targetWeek;
  let late = win.state === "late";
  if (win.state === "locked") {
    const { data: reopen } = await supabase
      .from("checkin_reopens")
      .select("iso_week")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!reopen) return { error: "Check-in is closed until Saturday. Message Nicole if you need this week reopened." };
    targetWeek = reopen.iso_week;
    late = true;
  }

  const { data, error } = await supabase
    .from("checkins")
    .insert({
      client_id: user.id,
      iso_week: targetWeek,
      late,
      dry_weight_lbs: input.dryWeightLbs,
      meal_rating: input.mealRating,
      meal_note: input.mealNote,
      fitness_rating: input.fitnessRating,
      fitness_note: input.fitnessNote,
      energy_rating: input.energyRating ?? null,
      focus_next_week: input.focusNextWeek || null,
      comments: input.comments,
      proud: input.proud || null,
      excited: input.excited || null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "You already checked in this week. Nicole has it." };
    return { error: error.message };
  }
  revalidatePath("/app/checkin");
  return { ok: true, checkinId: data.id as string };
}

export async function attachCheckinPhoto(checkinId: string, pose: "front" | "side" | "back", storagePath: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { error } = await supabase.from("checkin_photos").insert({
    checkin_id: checkinId,
    client_id: user.id,
    pose,
    storage_path: storagePath,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

/* ---------- messaging ---------- */

export async function sendMessage(clientId: string, body: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  if (!body.trim()) return { error: "Empty message" };
  const isSelf = user.id === clientId;
  const { error } = await supabase.from("messages").insert({
    client_id: clientId,
    sender_id: user.id,
    body: body.trim().slice(0, 4000),
    read_by_client: isSelf,
    read_by_admin: !isSelf,
  });
  if (error) return { error: error.message };
  revalidatePath(isSelf ? "/app/messages" : `/admin/clients/${clientId}`);
  return { ok: true };
}

/* ---------- food journal ---------- */

export async function logFood(
  mealLabel: string,
  note: string,
  storagePath: string | null,
  macros?: { calories: number; protein: number; carbs: number; fats: number } | null,
) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { error } = await supabase.from("food_logs").insert({
    client_id: user.id,
    meal_label: mealLabel.slice(0, 60),
    note: note.slice(0, 500),
    storage_path: storagePath,
    calories: macros?.calories ?? null,
    protein: macros?.protein ?? null,
    carbs: macros?.carbs ?? null,
    fats: macros?.fats ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/nutrition");
  return { ok: true };
}

/* ---------- meal check-offs ---------- */

export async function checkoffMeal(
  mealId: string,
  status: "ate_as_written" | "custom" | "option",
  customItems?: { meal_item_id?: string | null; name: string; calories: number; protein: number; carbs: number; fats: number }[],
  optionId?: string,
) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const today = new Date().toISOString().slice(0, 10);
  // replace any existing checkoff for this meal today
  await supabase.from("meal_checkoffs").delete().eq("client_id", user.id).eq("log_date", today).eq("meal_id", mealId);
  const { data, error } = await supabase
    .from("meal_checkoffs")
    .insert({ client_id: user.id, log_date: today, meal_id: mealId, status, option_id: optionId ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  if (status === "custom" && customItems?.length) {
    const rows = customItems.map((i) => ({ ...i, checkoff_id: data.id, client_id: user.id }));
    const { error: iErr } = await supabase.from("meal_checkoff_items").insert(rows);
    if (iErr) return { error: iErr.message };
  }
  revalidatePath("/app/nutrition");
  return { ok: true, checkoffId: data.id as string };
}

export async function undoCheckoff(checkoffId: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  await supabase.from("meal_checkoffs").delete().eq("id", checkoffId).eq("client_id", user.id);
  revalidatePath("/app/nutrition");
  return { ok: true };
}

/* Reopen a locked check-in week for a client (admin only via RLS). */
export async function reopenCheckin(clientId: string, isoWeek: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("checkin_reopens").upsert({ client_id: clientId, iso_week: isoWeek }, { onConflict: "client_id,iso_week" });
  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

/* ---------- media messages (voice / video) ---------- */

export async function sendMediaMessage(
  clientId: string,
  kind: "voice" | "video",
  mediaPath: string,
  durationSeconds: number | null,
) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const isSelf = user.id === clientId;
  const { error } = await supabase.from("messages").insert({
    client_id: clientId,
    sender_id: user.id,
    body: "",
    kind,
    media_path: mediaPath,
    duration_seconds: durationSeconds,
    read_by_client: isSelf,
    read_by_admin: !isSelf,
  });
  if (error) return { error: error.message };
  revalidatePath(isSelf ? "/app/messages" : `/admin/clients/${clientId}`);
  return { ok: true };
}

/* ---------- daily weigh-in ---------- */

export async function saveDailyWeight(weightLbs: number) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  if (!(weightLbs > 40 && weightLbs < 1000)) return { error: "That doesn't look like a weight." };
  const { error } = await supabase
    .from("daily_weights")
    .upsert({ client_id: user.id, weigh_date: new Date().toISOString().slice(0, 10), weight_lbs: weightLbs }, { onConflict: "client_id,weigh_date" });
  if (error) return { error: error.message };
  revalidatePath("/app");
  return { ok: true };
}
