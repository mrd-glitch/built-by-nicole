"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login } from "@/lib/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-5"
      style={{ background: "var(--ink-900)" }}
    >
      <Image src="/brand/ns-lockup-paper-pink-on-ink.png" alt="Built by Nicole" width={96} height={96} />
      <h1 className="mt-6 text-center" style={{ color: "var(--paper-50)", fontSize: "var(--text-xl)" }}>
        Welcome back.
      </h1>
      <p className="mt-2 text-center" style={{ color: "var(--grey-300)", fontSize: "var(--text-sm)" }}>
        The quiet work nobody sees starts here.
      </p>

      <form className="card mt-8 w-full max-w-[380px]" action={action}>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        <label className="field-label mt-4" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
        {state?.error && (
          <p role="alert" className="mt-3" style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>
            {state.error}
          </p>
        )}
        <button type="submit" className="btn btn--primary mt-6 w-full" disabled={pending}>
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center" style={{ color: "var(--grey-400)", fontSize: "var(--text-sm)" }}>
        Not a client yet?{" "}
        <Link href="/#apply" style={{ color: "var(--pink-300)" }}>
          Apply for coaching
        </Link>
      </p>
    </main>
  );
}
