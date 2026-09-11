"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions";
import { NSBadge } from "@/components/NSBadge";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5" style={{ background: "var(--ink-900)" }}>
      <NSBadge tone="paper" size={96} />
      <h1 className="mt-6 text-center" style={{ color: "var(--paper-50)", fontSize: "var(--text-xl)" }}>
        Forgot your password?
      </h1>
      <p className="mt-2 text-center" style={{ color: "var(--grey-300)", fontSize: "var(--text-sm)", maxWidth: 340 }}>
        Happens to everyone. Enter your email and we&apos;ll send a link to set a new one.
      </p>

      {state?.ok ? (
        <div className="card mt-8 w-full max-w-[380px] text-center">
          <p style={{ fontWeight: 600, color: "var(--text-strong)" }}>Check your email.</p>
          <p className="mt-2" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            If that address has an account, a reset link from Nicole is on its way. It&apos;s good for one hour — check spam if it&apos;s slow.
          </p>
          <Link href="/login" className="btn btn--quiet mt-5 w-full">
            Back to login
          </Link>
        </div>
      ) : (
        <form className="card mt-8 w-full max-w-[380px]" action={action}>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" autoFocus />
          <button type="submit" className="btn btn--primary mt-6 w-full" disabled={pending}>
            {pending ? "Sending..." : "Send reset link"}
          </button>
          <Link href="/login" className="mt-4 block text-center" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Back to login
          </Link>
        </form>
      )}
    </main>
  );
}
