"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/app", label: "Home", icon: "M4 11.5 12 4l8 7.5M6 10v9h4v-5h4v5h4v-9" },
  { href: "/app/fitness", label: "Fitness", icon: "M3 12h2m14 0h2M7 8v8m10-8v8M7 12h10" },
  { href: "/app/nutrition", label: "Nutrition", icon: "M8 3v7a2 2 0 0 0 2 2v9M8 3v4m8-4c-2 1-3 3-3 6v3h3v9" },
  { href: "/app/checkin", label: "Check-in", icon: "M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" },
  { href: "/app/progress", label: "Progress", icon: "M4 19l5-6 4 3 7-9M15 7h5v5" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="dock" aria-label="Main">
      {tabs.map((t) => {
        const active = t.href === "/app" ? path === "/app" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`dock__item${active ? " dock__item--active" : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={t.label}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={t.icon} />
            </svg>
            {active && <span className="dock__label">{t.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
