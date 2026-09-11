"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminSendPasswordReset, adminSetTempPassword, setClientAccess } from "@/lib/actions";

/* Coach HQ: get a locked-out client back in, or pause their access. */
export function AccountAccess({ clientId, email, status }: { clientId: string; email: string; status: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [temp, setTemp] = useState<string | null>(null);
  const [confirmPause, setConfirmPause] = useState(false);
  const router = useRouter();
  const paused = status === "paused";

  async function run(key: string, fn: () => Promise<{ error?: string; ok?: boolean; temp?: string; email?: string }>) {
    setBusy(key);
    setMsg(null);
    const res = await fn();
    setBusy(null);
    if (res?.error) return setMsg(res.error);
    if (res?.temp) setTemp(res.temp);
    if (res?.email) setMsg(`Reset link sent to ${res.email}. Good for one hour.`);
    router.refresh();
  }

  return (
    <section className="card">
      <h2 className="eyebrow">Account access</h2>
      <p className="mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
        {email}
      </p>

      <div className="mt-3 grid gap-2">
        <button type="button" className="btn btn--quiet btn--sm" disabled={busy != null || paused} onClick={() => run("reset", () => adminSendPasswordReset(clientId))}>
          {busy === "reset" ? "Sending..." : "Email a password reset link"}
        </button>
        <button type="button" className="btn btn--quiet btn--sm" disabled={busy != null || paused} onClick={() => run("temp", () => adminSetTempPassword(clientId))}>
          {busy === "temp" ? "Setting..." : "Set a temporary password"}
        </button>
        {temp && (
          <div className="card--sunken card" style={{ padding: "var(--space-3)" }}>
            <p className="eyebrow" style={{ fontSize: 9 }}>
              Temporary password — shown once
            </p>
            <p className="metric mt-1" style={{ fontSize: "var(--text-lg)", color: "var(--pink-700)", userSelect: "all" }}>
              {temp}
            </p>
            <p className="mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              Text it to them. They log in with it, then tap “Change password” at the bottom of their Home screen.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4" style={{ borderTop: "var(--rule-hairline)", paddingTop: "var(--space-3)" }}>
        {!paused ? (
          confirmPause ? (
            <div className="grid gap-2">
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-strong)" }}>
                Pause access? They can&apos;t log in until you resume. Nothing is deleted.
              </p>
              <div className="flex gap-2">
                <button type="button" className="btn btn--primary btn--sm" disabled={busy != null} onClick={() => run("pause", () => setClientAccess(clientId, true))}>
                  {busy === "pause" ? "Pausing..." : "Yes, pause"}
                </button>
                <button type="button" className="btn btn--quiet btn--sm" onClick={() => setConfirmPause(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn--ghost btn--sm w-full" onClick={() => setConfirmPause(true)}>
              Remove access (pause client)
            </button>
          )
        ) : (
          <div className="grid gap-2">
            <span className="chip chip--ink" style={{ justifySelf: "start" }}>Access paused</span>
            <button type="button" className="btn btn--primary btn--sm" disabled={busy != null} onClick={() => run("resume", () => setClientAccess(clientId, false))}>
              {busy === "resume" ? "Resuming..." : "Resume access"}
            </button>
          </div>
        )}
      </div>

      {msg && (
        <p className="mt-3" style={{ fontSize: "var(--text-xs)", color: msg.includes("sent") ? "var(--pink-700)" : "var(--danger)" }}>
          {msg}
        </p>
      )}
    </section>
  );
}
