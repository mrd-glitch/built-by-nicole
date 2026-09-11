import type { MealImport } from "@/lib/plans/import/coaching";
import styles from "../plans.module.css";
export function MealImportPreview({
  meal,
  privateNotes = false,
}: {
  meal: MealImport;
  privateNotes?: boolean;
}) {
  const t = meal.targets;
  return (
    <section className={styles.importSummary} aria-label="Meal plan review">
      <h2>{meal.name}</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{meal.intro}</p>
      {meal.schedule && (
        <p style={{ whiteSpace: "pre-wrap" }}>
          <strong>Schedule: </strong>
          {meal.schedule}
        </p>
      )}
      <p>
        Daily targets:{" "}
        {t.calories === null ? "Calories not specified" : `${t.calories} kcal`}
        {(t.mode === "grams"
          ? [
              ["Protein", t.protein_g],
              ["Carbs", t.carbs_g],
              ["Fat", t.fat_g],
            ]
          : [
              ["Protein", t.protein_pct],
              ["Carbs", t.carbs_pct],
              ["Fat", t.fat_pct],
            ]
        ).map(
          ([label, value]) =>
            value !== null && (
              <span key={label}>
                {" "}
                · {label} {value}
                {t.mode === "grams" ? "g" : "%"}
              </span>
            ),
        )}
      </p>
      {meal.meals.map((m, i) => (
        <section key={i} className={styles.importWeek}>
          <h3>{m.name}</h3>
          {m.note && <p style={{ whiteSpace: "pre-wrap" }}>{m.note}</p>}
          <ul>
            {m.items.map((item, j) => (
              <li key={j}>
                <strong>{item.name}</strong> · {item.portion}
              </li>
            ))}
          </ul>
          {m.options.length > 0 && (
            <>
              <p>Choose one complete meal:</p>
              <ol>
                {m.options.map((o, j) => (
                  <li key={j}>
                    {o.text}
                    {o.tag && (
                      <small>
                        {" "}
                        · {o.tag === "zero_prep" ? "Zero prep" : "Rough day"}
                      </small>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      ))}
      {privateNotes && meal.coach_notes.length > 0 && (
        <details className={styles.privateNotes}>
          <summary>
            Private meal notes for Nicole · never shown to clients
          </summary>
          {meal.coach_notes.map((n, i) => (
            <p key={i}>
              {n.meal ? `Meal ${n.meal}` : "Plan"}: {n.text}
            </p>
          ))}
        </details>
      )}
    </section>
  );
}
