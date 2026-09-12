"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { NSBadge } from "@/components/NSBadge";

/* Reached from invite / reset links, or from "Change password" while logged in.
   The link's session always wins over whoever was already signed in on this
   device, so a coach opening a client's link never resets her own password. */
export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = new URLSearchParams(window.location.search).get("code");
      try {
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          window.history.replaceState(null, "", window.location.pathname);
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch {
        // fall through: getUser below decides what we show
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setReady(true);
    })();
  }, []);

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
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5" style={{ background: "var(--ink-900)" }}>
      <NSBadge tone="paper" size={96} />
      {!ready ? (
        <p className="mt-6" style={{ color: "var(--grey-300)", fontSize: "var(--text-sm)" }}>
          One second...
        </p>
      ) : !email ? (
        <>
          <h1 className="mt-6 text-center" style={{ color: "var(--paper-50)", fontSize: "var(--text-xl)" }}>
            That link has expired.
          </h1>
          <p className="mt-2 text-center" style={{ color: "var(--grey-300)", fontSize: "var(--text-sm)", maxWidth: 340 }}>
            Links are good for one hour. Request a fresh one and try again.
          </p>
          <Link href="/forgot" className="btn btn--primary mt-6">
            Send me a new link
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-center" style={{ color: "var(--paper-50)", fontSize: "var(--text-xl)" }}>
            Set your password.
          </h1>
          <p className="mt-2 text-center" style={{ color: "var(--grey-300)", fontSize: "var(--text-sm)" }}>
            for <span style={{ color: "var(--pink-300)" }}>{email}</span>
          </p>
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
        </>
      )}
    </main>
  );
}
