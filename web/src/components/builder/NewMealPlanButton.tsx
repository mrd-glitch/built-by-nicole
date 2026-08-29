"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMealPlan } from "@/lib/actions-builder";

export function NewMealPlanButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function create() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await createMealPlan(name.trim());
    setBusy(false);
    if (res && "versionId" in res) router.push(`/admin/meal-plans/${res.versionId}`);
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--primary btn--sm" onClick={() => setOpen(true)}>
        New plan
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: "var(--surface-scrim)" }} role="dialog" aria-label="New meal plan">
      <div className="card w-full max-w-[420px]" style={{ borderRadius: "var(--radius-sheet)", margin: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--text-lg)" }}>New meal plan</h2>
        <label className="field-label mt-4" htmlFor="mp-name">
          Name
        </label>
        <input
          id="mp-name"
          className="input"
          placeholder="3 plates, 2 snacks"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          autoFocus
        />
        <div className="mt-6 flex gap-2">
          <button type="button" className="btn btn--primary flex-1" onClick={create} disabled={busy || !name.trim()}>
            {busy ? "Creating..." : "Create"}
          </button>
          <button type="button" className="btn btn--quiet" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
