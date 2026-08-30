import { redirect } from "next/navigation";
import { getClientHome, getSessionUser } from "@/lib/data";
import { checkinWindow } from "@/lib/checkin-window";
import { CheckinFlow } from "@/components/CheckinFlow";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { checkins } = await getClientHome(session.user.id);
  const tz = session.profile?.timezone ?? "America/Edmonton";
  const win = checkinWindow(tz);

  let state: "open" | "late" | "locked" = win.state;
  let targetWeek = win.targetWeek;
  if (state === "locked") {
    const supabase = await supabaseServer();
    const { data: reopen } = await supabase
      .from("checkin_reopens")
      .select("iso_week")
      .eq("client_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (reopen && !checkins.some((c) => c.iso_week === reopen.iso_week)) {
      state = "late";
      targetWeek = reopen.iso_week;
    }
  }
  const alreadyThisWeek = checkins.some((c) => c.iso_week === targetWeek);

  return <CheckinFlow history={checkins} alreadyThisWeek={alreadyThisWeek} windowState={state} targetWeek={targetWeek} />;
}
