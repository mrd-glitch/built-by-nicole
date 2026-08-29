import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/lib/data";
import { logout } from "@/lib/actions";
import { NSBadge } from "@/components/NSBadge";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (session?.role === "admin") redirect("/admin");
  const firstName = session?.profile?.first_name || session?.profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="portal" style={{ paddingBottom: 96 }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4"
        style={{
          height: 60,
          background: "linear-gradient(180deg, rgb(250 250 248 / 0.92), rgb(250 250 248 / 0.75))",
          backdropFilter: "blur(16px) saturate(1.5)",
          WebkitBackdropFilter: "blur(16px) saturate(1.5)",
          borderBottom: "1px solid rgb(255 255 255 / 0.7)",
        }}
      >
        <div className="flex items-center gap-3">
          <NSBadge tone="ink" size={40} />
          <span style={{ fontFamily: "var(--font-numeric)", fontWeight: 700, fontSize: "var(--text-lg)", letterSpacing: "-0.02em", color: "var(--text-strong)" }}>
            Hey, {firstName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/messages"
            aria-label="Messages with Nicole"
            className="relative flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: "50%", background: "rgb(255 255 255 / 0.7)", border: "1px solid rgb(255 255 255 / 0.85)", boxShadow: "0 2px 8px rgb(13 13 15 / 0.06)", borderBottom: "none" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-900)" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5Z" />
            </svg>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Log out"
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: "50%", background: "rgb(255 255 255 / 0.7)", border: "1px solid rgb(255 255 255 / 0.85)", boxShadow: "0 2px 8px rgb(13 13 15 / 0.06)", cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--grey-500)" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </header>
      {children}
      <BottomNav />
    </div>
  );
}
