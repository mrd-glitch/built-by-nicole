"use client";
import { resolveSetTypes, setTypeLabel, type SetType } from "@/lib/plans/model";
import styles from "./plans.module.css";

export function SetTypeEditor({ name, count, types, onChange }: {
  name: string;
  count: number;
  types?: SetType[];
  onChange: (types: SetType[]) => void;
}) {
  const validCount = Number.isInteger(count) && count >= 1 && count <= 30;
  const resolved = resolveSetTypes(types, validCount ? count : 0);
  const warmups = resolved.filter((type) => type === "warmup").length;
  const firstWarmups = resolved.every((type, i) => type === (i < warmups ? "warmup" : "working"));
  function update(next: SetType[]) {
    // Keep labels for higher set numbers used by other weeks.
    onChange([...next, ...(types?.slice(next.length) ?? [])]);
  }
  return (
    <div className={styles.setSetup}>
      <label>
        Warm-up sets
        <select className="input" aria-label={`${name} warm-up sets`} disabled={!validCount}
          value={firstWarmups ? String(warmups) : "custom"}
          onChange={(event) => update(resolved.map((_, i) => i < Number(event.target.value) ? "warmup" : "working"))}>
          {!firstWarmups && <option value="custom" disabled>Custom arrangement</option>}
          <option value="0">None · all working sets</option>
          {resolved.map((_, i) => <option key={i} value={i + 1}>{i === 0 ? "First set is a warm-up" : `First ${i + 1} sets are warm-ups`}</option>)}
        </select>
      </label>
      <details className={styles.setDetails}>
        <summary>Label individual sets{validCount ? ` · ${warmups} warm-up / ${count - warmups} working` : ""}</summary>
        <p className={styles.hint}>Warm-ups are included in the total set count. Labels follow the same set numbers across weeks; additional sets start as working sets.</p>
        <div className={styles.setTypeGrid}>
          {resolved.map((type, i) => <label key={i}>
            Set {i + 1}
            <select className="input" aria-label={`${name} set ${i + 1} type`} value={type}
              onChange={(event) => update(resolved.map((current, index) => index === i ? event.target.value as SetType : current))}>
              {(["warmup", "working"] as const).map((option) => <option key={option} value={option}>{setTypeLabel(option)}</option>)}
            </select>
          </label>)}
        </div>
      </details>
    </div>
  );
}
