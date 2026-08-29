"use client";

import { useState } from "react";
import { updateToggles } from "@/lib/actions";

interface ToggleProfile {
  id: string;
  first_name: string;
  show_macros: boolean;
  show_calories: boolean;
  food_journal_enabled: boolean;
  status: string;
}

const toggleDefs = [
  { key: "show_macros", label: "Show macros" },
  { key: "show_calories", label: "Show calories" },
  { key: "food_journal_enabled", label: "Food journal" },
] as const;

export function ClientToggles({ client }: { client: ToggleProfile }) {
  const [state, setState] = useState({
    show_macros: client.show_macros,
    show_calories: client.show_calories,
    food_journal_enabled: client.food_journal_enabled,
  });
  const [error, setError] = useState<string | null>(null);

  async function flip(key: (typeof toggleDefs)[number]["key"]) {
    const nextVal = !state[key];
    setState({ ...state, [key]: nextVal });
    const res = await updateToggles(client.id, { [key]: nextVal });
    if (res?.error) {
      setState((s) => ({ ...s, [key]: !nextVal }));
      setError(res.error);
    } else {
      setError(null);
    }
  }

  return (
    <section className="card">
      <h2 className="eyebrow">Feature toggles</h2>
      <div className="mt-3 grid gap-3">
        {toggleDefs.map((t) => (
          <div key={t.key} className="flex items-center justify-between">
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{t.label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={state[t.key]}
              aria-label={t.label}
              onClick={() => flip(t.key)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: state[t.key] ? "var(--pink-500)" : "var(--grey-300)",
                position: "relative",
                transition: "background var(--dur-fast) var(--ease-standard)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: state[t.key] ? 23 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--white)",
                  transition: "left var(--dur-fast) var(--ease-standard)",
                }}
              />
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2" style={{ color: "var(--danger)", fontSize: "var(--text-xs)" }}>
          {error}
        </p>
      )}
      <p className="mt-3" style={{ fontSize: "var(--text-2xs)", color: "var(--text-faint)" }}>
        Applies instantly to what {client.first_name || "the client"} sees.
      </p>
    </section>
  );
}
