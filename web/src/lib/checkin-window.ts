/* Sat-Mon check-in window (due Sunday). Sat/Sun = on time for the current ISO
   week. Monday = late for the week that just ended. Otherwise locked unless
   Nicole reopened that week. */

export function isoWeekOfDate(d: Date, tz: string): string {
  const local = new Date(d.toLocaleString("en-US", { timeZone: tz }));
  const target = new Date(local.valueOf());
  const dayNr = (local.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week = 1 + Math.round(((target.valueOf() - firstThursday.valueOf()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export interface CheckinWindow {
  state: "open" | "late" | "locked";
  targetWeek: string; // the ISO week this check-in would count for
}

export function checkinWindow(tz: string, now = new Date()): CheckinWindow {
  const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const dow = local.getDay(); // 0 Sun .. 6 Sat
  const thisWeek = isoWeekOfDate(now, tz);
  const prevWeek = isoWeekOfDate(new Date(now.getTime() - 7 * 86400000), tz);
  if (dow === 6 || dow === 0) return { state: "open", targetWeek: thisWeek };
  if (dow === 1) return { state: "late", targetWeek: prevWeek };
  return { state: "locked", targetWeek: prevWeek };
}
