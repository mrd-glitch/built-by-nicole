"use client";

import { RemoveMealPlan } from "@/components/plans/RemoveMealPlan";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { assignMealPlanCopy, assignProgramCopy } from "@/lib/actions-builder";

interface TemplateVersion {
  id: string;
  version: number;
}
interface ProgramTemplate {
  id: string;
  name: string;
  weeks: number;
  days_per_week: number;
  program_versions: TemplateVersion[];
}
interface MealTemplate {
  id: string;
  name: string;
  target_calories: number | null;
  meal_plan_versions: TemplateVersion[];
}

function latestVersion(vs: TemplateVersion[]) {
  return [...vs].sort((a, b) => b.version - a.version)[0];
}

export function AssignPlans({
  clientId,
  clientName,
  program,
  meal,
  programTemplates,
  mealTemplates,
}: {
  clientId: string;
  clientName: string;
  program: {
    versionId: string;
    name: string;
    description: string | null;
    weeks: number;
    daysPerWeek: number;
  } | null;
  meal: {
    assignmentId: string;
    versionId: string;
    name: string;
    calories: number | null;
  } | null;
  programTemplates: ProgramTemplate[];
  mealTemplates: MealTemplate[];
}) {
  const [picker, setPicker] = useState<"program" | "meal" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function assign(kind: "program" | "meal", versionId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res =
      kind === "program"
        ? await assignProgramCopy(versionId, clientId)
        : await assignMealPlanCopy(versionId, clientId);
    setBusy(false);
    if (res && "error" in res && res.error) return setError(res.error);
    setPicker(null);
    router.refresh();
  }

  return (
    <section className="card">
      <h2 className="eyebrow">Plans</h2>
      <div className="mt-3 grid gap-3">
        {/* Workout program */}
        <div>
          <p className="field-label" style={{ marginBottom: 4 }}>
            Workout program
          </p>
          {program ? (
            <div className="flex items-center justify-between gap-2">
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    color: "var(--text-strong)",
                  }}
                >
                  {program.name}
                </p>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                  }}
                >
                  {program.daysPerWeek} days/week · {program.weeks} weeks
                </p>
              </div>
              <div className="flex gap-1">
                <Link
                  href={`/admin/programs/${program.versionId}`}
                  className="btn btn--quiet btn--sm"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="btn btn--quiet btn--sm"
                  onClick={() => setPicker("program")}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--sm w-full"
              onClick={() => setPicker("program")}
            >
              Assign from library
            </button>
          )}
        </div>

        {/* Meal plan */}
        <div
          style={{
            borderTop: "var(--rule-hairline)",
            paddingTop: "var(--space-3)",
          }}
        >
          <p className="field-label" style={{ marginBottom: 4 }}>
            Meal plan
          </p>
          {meal ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--text-sm)",
                      color: "var(--text-strong)",
                    }}
                  >
                    {meal.name}
                  </p>
                  {meal.calories != null && (
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {meal.calories} kcal target
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/admin/meal-plans/${meal.versionId}`}
                    className="btn btn--quiet btn--sm"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn--quiet btn--sm"
                    onClick={() => setPicker("meal")}
                  >
                    Change
                  </button>
                </div>
              </div>
              <RemoveMealPlan
                clientId={clientId}
                assignmentId={meal.assignmentId}
                clientName={clientName}
                planName={meal.name}
              />
            </>
          ) : (
            <div>
              <p
                className="mb-2"
                style={{ fontSize: 13, color: "var(--text-muted)" }}
              >
                No meal plan assigned.
              </p>
              <button
                type="button"
                className="btn btn--primary btn--sm w-full"
                onClick={() => setPicker("meal")}
              >
                Assign from library
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3"
          style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}
        >
          {error}
        </p>
      )}

      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: "var(--surface-scrim)" }}
          role="dialog"
          aria-label="Assign plan"
        >
          <div
            className="card flex w-full max-w-[440px] flex-col"
            style={{
              borderRadius: "var(--radius-sheet)",
              margin: "var(--space-4)",
              maxHeight: "75dvh",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: "var(--text-lg)" }}>
                {picker === "program"
                  ? "Assign workout program"
                  : "Assign meal plan"}
              </h2>
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={() => setPicker(null)}
              >
                Close
              </button>
            </div>
            <p
              className="mt-2"
              style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}
            >
              {clientName.split(" ")[0]} gets their own copy — tweak it after
              without touching the library master.
            </p>
            <div className="mt-4 grid gap-2 overflow-y-auto">
              {picker === "program" &&
                programTemplates.map((t) => {
                  const v = latestVersion(t.program_versions);
                  if (!v) return null;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="btn btn--quiet w-full justify-between"
                      onClick={() => assign("program", v.id)}
                      disabled={busy}
                    >
                      <span>{t.name}</span>
                      <span
                        style={{
                          fontSize: "var(--text-2xs)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {t.days_per_week}d × {t.weeks}w
                      </span>
                    </button>
                  );
                })}
              {picker === "meal" &&
                mealTemplates.map((t) => {
                  const v = latestVersion(t.meal_plan_versions);
                  if (!v) return null;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="btn btn--quiet w-full justify-between"
                      onClick={() => assign("meal", v.id)}
                      disabled={busy}
                    >
                      <span>{t.name}</span>
                      {t.target_calories != null && (
                        <span
                          style={{
                            fontSize: "var(--text-2xs)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {t.target_calories} kcal
                        </span>
                      )}
                    </button>
                  );
                })}
              {((picker === "program" && programTemplates.length === 0) ||
                (picker === "meal" && mealTemplates.length === 0)) && (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Library is empty — build one under{" "}
                  {picker === "program" ? "Programs" : "Meal plans"} first.
                </p>
              )}
            </div>
            {busy && (
              <p
                className="mt-3"
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-muted)",
                }}
              >
                Copying plan...
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
