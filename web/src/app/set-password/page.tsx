"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { NSBadge } from "@/components/NSBadge";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setPending(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) return setError(error.message);
    router.push("/app");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5" style={{ background: "var(--ink-900)" }}>
      <NSBadge tone="paper" size={96} />
      <h1 className="mt-6 text-center" style={{ color: "var(--paper-50)", fontSize: "var(--text-xl)" }}>
        You&apos;re in. Set your password.
      </h1>
      <form className="card mt-8 w-full max-w-[380px]" onSubmit={submit}>
        <label className="field-label" htmlFor="pw">
          New password
        </label>
        <input id="pw" type="password" className="input" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="field-label mt-4" htmlFor="pw2">
          Type it again
        </label>
        <input id="pw2" type="password" className="input" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && (
          <p role="alert" className="mt-3" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary mt-6 w-full" disabled={pending}>
          {pending ? "Saving..." : "Save and enter"}
        </button>
      </form>
    </main>
  );
}
