"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NSBadge } from "@/components/NSBadge";

const links = [
  { href: "/admin", label: "Feed", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/clients", label: "Clients", icon: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0" },
  { href: "/admin/applications", label: "Applications", icon: "M9 12h6m-6 4h6M7 3h7l5 5v13H7z" },
  { href: "/admin/programs", label: "Programs", icon: "M3 12h2m14 0h2M7 8v8m10-8v8M7 12h10" },
  { href: "/admin/meal-plans", label: "Meals", icon: "M8 3v7a2 2 0 0 0 2 2v9M8 3v4m8-4c-2 1-3 3-3 6v3h3v9" },
];

// Desktop sidebar keeps the full list; the mobile dock shows the five that matter daily.
const sidebarOnly = [{ href: "/admin/exercises", label: "Exercise library", icon: "" }];

export function AdminNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <>
      <nav className="admin-nav" aria-label="Admin">
        <div className="admin-nav__brand">
          <NSBadge tone="paper" size={36} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: "var(--weight-extrabold)",
              fontSize: "var(--text-xs)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-wider)",
              color: "var(--paper-50)",
              whiteSpace: "nowrap",
            }}
          >
            Coach HQ
          </span>
        </div>
        <div className="admin-nav__tabs">
          {[...links, ...sidebarOnly].map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""} aria-current={isActive(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="admin-nav__foot">
          <Link href="/" style={{ padding: 0 }}>
            View site →
          </Link>
        </div>
      </nav>

      {/* Mobile: floating dock, same pattern clients already know */}
      <nav className="dock admin-dock" aria-label="Admin">
        {links.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`dock__item${active ? " dock__item--active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={l.label}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={l.icon} />
              </svg>
              {active && <span className="dock__label">{l.label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
