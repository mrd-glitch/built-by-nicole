"use client";

import { useState } from "react";
import { sendMessage } from "@/lib/actions";

export function ReplyBox({ clientId, placeholder }: { clientId: string; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    const res = await sendMessage(clientId, draft);
    setBusy(false);
    if (res?.error) return setError(res.error);
    setError(null);
    setDraft("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button type="button" className="btn btn--primary btn--sm" onClick={send} disabled={busy}>
          {busy ? "..." : "Send"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2" style={{ color: "var(--danger)", fontSize: "var(--text-xs)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
