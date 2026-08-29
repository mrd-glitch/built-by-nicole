/* Rule-based Client Snapshot from intake answers (PLAN.md decision 4). */

export interface Snapshot {
  goalType: string;
  suggestedSplit: string;
  frequency: string;
  platesTarget: string;
  redFlags: string[];
}

export function buildSnapshot(a: Record<string, string>): Snapshot {
  const days = a.daysPerWeek?.startsWith("5") ? 5 : parseInt(a.daysPerWeek || "3", 10) || 3;

  const goalMap: Record<string, string> = {
    "Lose body fat": "Fat loss",
    "Build strength & muscle": "Strength & muscle",
    "Improve energy & habits": "Habits & energy",
    "Post-partum rebuild": "Rebuild",
    "General health & consistency": "Consistency",
  };
  const goalType = goalMap[a.goal] ?? "General";

  const suggestedSplit =
    days <= 3 ? "Full body" : days === 4 ? "Upper / lower" : "Upper / lower + pump day";

  const platesTarget =
    goalType === "Fat loss" ? "3 plates, 1 snack" :
    goalType === "Rebuild" ? "3 plates, 2 snacks" :
    "3 plates, 2 snacks";

  const redFlags: string[] = [];
  const injuries = (a.injuries || "").toLowerCase();
  if (injuries && !["none", "no", "n/a", "na", ""].includes(injuries.trim())) {
    redFlags.push(`Injury noted: ${a.injuries.slice(0, 60)}`);
  }
  const life = (a.lifestyle || "").toLowerCase();
  if (/(sleep|5h|6h|tired|exhaust)/.test(life)) redFlags.push("Low sleep: watch recovery");
  if (a.goal === "Post-partum rebuild") redFlags.push("Post-partum: core/floor progression first");
  if ((a.nutritionHabits || "").toLowerCase().includes("skip")) redFlags.push("Skipped meals pattern");
  if (a.experience === "Brand new") redFlags.push("Beginner: technique-first block");

  return {
    goalType,
    suggestedSplit,
    frequency: `${days}x/week`,
    platesTarget,
    redFlags,
  };
}
