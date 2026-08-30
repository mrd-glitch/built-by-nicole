"use client";

import { useState } from "react";
import { reopenCheckin } from "@/lib/actions";

export function ReopenCheckin({ clientId, week }: { clientId: string; week: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  return (
    <button
      type="button"
      className="btn btn--quiet btn--sm"
      disabled={state !== "idle"}
      onClick={async () => {
        setState("busy");
        await reopenCheckin(clientId, week);
        setState("done");
      }}
    >
      {state === "done" ? `Reopened ${week} ✓` : state === "busy" ? "Reopening..." : `Reopen ${week} check-in`}
    </button>
  );
}
