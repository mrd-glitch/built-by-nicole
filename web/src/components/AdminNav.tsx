"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NSBadge } from "@/components/NSBadge";

const links = [
  { href: "/admin", label: "Feed" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/meal-plans", label: "Meal plans" },
  { href: "/admin/exercises", label: "Exercise library" },
];

export function AdminNav() {
  const path = usePathname();
  return (
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
        {links.map((l) => {
          const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              {l.label}
            </Link>
          );
        })}
      </div>
      <div className="admin-nav__foot">
        <Link href="/" style={{ padding: 0 }}>
          View site →
        </Link>
      </div>
    </nav>
  );
}
