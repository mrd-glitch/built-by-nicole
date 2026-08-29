import { supabaseServer } from "@/lib/supabase/server";

/* Server-side reads. Every query is wrapped so a missing table (migrations
   003-006 pending) degrades to empty state instead of crashing the page. */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getSessionUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: role }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);
  return { user, role: role?.role as "admin" | "client" | undefined, profile };
}

export async function getClientHome(clientId: string) {
  const supabase = await supabaseServer();
  return safe(
    async () => {
      const [checkins, assignment, sessions] = await Promise.all([
        supabase
          .from("checkins")
          .select("*")
          .eq("client_id", clientId)
          .order("submitted_at", { ascending: false })
          .limit(12),
        supabase
          .from("program_assignments")
          .select("id, start_date, version_id, program_versions(id, program_id, programs(name), program_days(id, week, day, title, position))")
          .eq("client_id", clientId)
          .eq("active", true)
          .maybeSingle(),
        supabase
          .from("workout_sessions")
          .select("id, day_id, started_at, finished_at")
          .eq("client_id", clientId)
          .order("started_at", { ascending: false })
          .limit(60),
      ]);
      return {
        checkins: checkins.data ?? [],
        assignment: assignment.data ?? null,
        sessions: sessions.data ?? [],
      };
    },
    { checkins: [], assignment: null, sessions: [] },
  );
}

/* Signed URLs for private photos (storage RLS: owner or admin). */
export async function getSignedUrls(bucket: string, paths: string[]) {
  if (paths.length === 0) return {} as Record<string, string>;
  const supabase = await supabaseServer();
  return safe(async () => {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
    const map: Record<string, string> = {};
    (data ?? []).forEach((d, i) => {
      if (d.signedUrl) map[paths[i]] = d.signedUrl;
    });
    return map;
  }, {} as Record<string, string>);
}

export async function getProgramDay(dayId: string) {
  const supabase = await supabaseServer();
  return safe(async () => {
    const { data: day } = await supabase
      .from("program_days")
      .select("id, week, day, title, version_id, day_blocks(id, label, rest_note, position, block_exercises(id, exercise_id, exercise_name, sets, rep_range, target_weight_lbs, optional, optional_note, position, exercises(youtube_url, cue, thumb_path)))")
      .eq("id", dayId)
      .single();
    return day ?? null;
  }, null);
}

export async function getLastEntries(clientId: string, exerciseIds: string[]) {
  const supabase = await supabaseServer();
  return safe(async () => {
    const { data } = await supabase
      .from("set_entries")
      .select("exercise_id, reps, weight_lbs, logged_at")
      .eq("client_id", clientId)
      .in("exercise_id", exerciseIds)
      .order("logged_at", { ascending: false })
      .limit(200);
    return data ?? [];
  }, []);
}

export async function getMealPlanFor(clientId: string) {
  const supabase = await supabaseServer();
  return safe(async () => {
    const { data } = await supabase
      .from("meal_plan_assignments")
      .select("id, meal_plan_versions(id, intro, pdf_path, pdf_name, meal_plans(name), meals(id, name, note, position, meal_items(id, name, portion, protein, carbs, fats, calories, position)))")
      .eq("client_id", clientId)
      .eq("active", true)
      .maybeSingle();
    return data ?? null;
  }, null);
}

export async function getFoodLogsToday(clientId: string) {
  const supabase = await supabaseServer();
  return safe(async () => {
    const { data } = await supabase
      .from("food_logs")
      .select("*")
      .eq("client_id", clientId)
      .eq("log_date", new Date().toISOString().slice(0, 10))
      .order("created_at");
    return data ?? [];
  }, []);
}

export async function getMessages(clientId: string) {
  const supabase = await supabaseServer();
  return safe(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at")
      .limit(200);
    return data ?? [];
  }, []);
}

/* ---------- admin ---------- */

export async function getNotifications() {
  const supabase = await supabaseServer();
  return safe(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .is("handled_at", null)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  }, []);
}

export async function getClients() {
  const supabase = await supabaseServer();
  return safe(async () => {
    // no FK between profiles and user_roles (both reference auth.users), so two queries
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "client");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [];
    const { data } = await supabase.from("profiles").select("*").in("id", ids).order("full_name");
    return data ?? [];
  }, []);
}

export async function getClientDetail(clientId: string) {
  const supabase = await supabaseServer();
  return safe(
    async () => {
      const [profile, checkins, msgs] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", clientId).single(),
        supabase.from("checkins").select("*, checkin_photos(pose, storage_path)").eq("client_id", clientId).order("submitted_at", { ascending: false }).limit(8),
        supabase.from("messages").select("*").eq("client_id", clientId).order("created_at").limit(100),
      ]);
      return { profile: profile.data, checkins: checkins.data ?? [], messages: msgs.data ?? [] };
    },
    { profile: null, checkins: [], messages: [] },
  );
}

export async function getApplications() {
  const supabase = await supabaseServer();
  return safe(
    async () => {
      const [fresh, decided] = await Promise.all([
        supabase.from("applications").select("*").eq("status", "new").order("created_at", { ascending: false }),
        supabase.from("applications").select("id, email, status, decided_at, answers").neq("status", "new").order("decided_at", { ascending: false }).limit(10),
      ]);
      return { fresh: fresh.data ?? [], decided: decided.data ?? [] };
    },
    { fresh: [], decided: [] },
  );
}

export async function getExercises() {
  const supabase = await supabaseServer();
  return safe(async () => {
    const { data } = await supabase.from("exercises").select("*").eq("archived", false).order("name");
    return data ?? [];
  }, []);
}
