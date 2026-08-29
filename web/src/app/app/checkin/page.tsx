import { redirect } from "next/navigation";
import { getClientHome, getSessionUser } from "@/lib/data";
import { CheckinFlow } from "@/components/CheckinFlow";

export const dynamic = "force-dynamic";

function isoWeekNow(tz: string) {
  const local = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const target = new Date(local.valueOf());
  const dayNr = (local.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week = 1 + Math.round(((target.valueOf() - firstThursday.valueOf()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default async function CheckinPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { checkins } = await getClientHome(session.user.id);
  const week = isoWeekNow(session.profile?.timezone ?? "America/Edmonton");
  const alreadyThisWeek = checkins.some((c) => c.iso_week === week);

  return <CheckinFlow history={checkins} alreadyThisWeek={alreadyThisWeek} />;
}
