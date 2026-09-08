"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeClientMealPlan } from "@/lib/plans/actions";
import type { Result } from "@/lib/plans/model";
export function RemoveMealPlan({
  clientId,
  assignmentId,
  clientName,
  planName,
  remove = removeClientMealPlan,
  onRemoved,
}: {
  clientId: string;
  assignmentId: string;
  clientName: string;
  planName: string;
  remove?: (clientId: string, assignmentId: string) => Promise<Result<null>>;
  onRemoved?: () => void;
}) {
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  async function submit() {
    setBusy(true);
    try {
      const r = await remove(clientId, assignmentId);
      if (r.error) {
        setError(r.error);
        return;
      }
      setConfirm(false);
      onRemoved?.();
      router.refresh();
    } catch {
      setError(
        "The plan could not be removed. It is still assigned; please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3">
      {!confirm ? (
        <button
          className="btn btn--quiet btn--sm"
          onClick={() => setConfirm(true)}
        >
          Remove from client
        </button>
      ) : (
        <div className="card card--sunken">
          <p style={{ fontSize: 14 }}>
            Remove <strong>{planName}</strong> from {clientName}?
          </p>
          <p
            className="mt-2"
            style={{ fontSize: 13, color: "var(--text-muted)" }}
          >
            The library template and previous meal records will stay available.
          </p>
          {error && (
            <p role="alert" className="mt-2" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              className="btn btn--ghost btn--sm"
              disabled={busy}
              onClick={() => {
                setConfirm(false);
                setError("");
              }}
            >
              Keep plan
            </button>
            <button
              className="btn btn--primary btn--sm"
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy
                ? "Removing…"
                : error
                  ? "Retry removal"
                  : "Remove from client"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
