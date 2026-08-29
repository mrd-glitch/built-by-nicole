/* Month grid like her current app's consistency calendar.
   Dots: pink = workout logged, yellow ring day = check-in submitted. */

export function ConsistencyCalendar({
  workoutDates,
  checkinDates,
  timezone = "America/Edmonton",
}: {
  workoutDates: string[]; // ISO timestamps
  checkinDates: string[];
  timezone?: string;
}) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7; // Monday-first

  const workoutDays = new Set(
    workoutDates.map((d) => {
      const l = new Date(new Date(d).toLocaleString("en-US", { timeZone: timezone }));
      return l.getMonth() === month && l.getFullYear() === year ? l.getDate() : -1;
    }),
  );
  const checkinDays = new Set(
    checkinDates.map((d) => {
      const l = new Date(new Date(d).toLocaleString("en-US", { timeZone: timezone }));
      return l.getMonth() === month && l.getFullYear() === year ? l.getDate() : -1;
    }),
  );

  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const activeDays = new Set([...workoutDays, ...checkinDays]);
  activeDays.delete(-1);

  return (
    <section className="card" style={{ padding: "var(--space-4)" }}>
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">{monthName}</h2>
        <span className="metric" style={{ fontSize: "var(--text-xs)", color: "var(--pink-700)" }}>
          {activeDays.size} active days
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} style={{ fontSize: 9, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.1em" }}>
            {d}
          </span>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === now.getDate();
          const worked = workoutDays.has(day);
          const checked = checkinDays.has(day);
          return (
            <span
              key={day}
              className="metric flex items-center justify-center"
              style={{
                aspectRatio: "1",
                borderRadius: "50%",
                fontSize: 11,
                background: worked ? "var(--pink-500)" : checked ? "var(--highlight)" : "transparent",
                color: worked ? "var(--white)" : checked ? "var(--ink-900)" : isToday ? "var(--pink-700)" : "var(--text-muted)",
                border: isToday && !worked && !checked ? "1.5px solid var(--pink-500)" : "none",
                fontWeight: isToday || worked || checked ? 700 : 400,
              }}
              aria-label={`Day ${day}${worked ? ", workout logged" : ""}${checked ? ", check-in submitted" : ""}`}
            >
              {day}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4" style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--pink-500)", display: "inline-block" }} /> workout
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--highlight)", display: "inline-block" }} /> check-in
        </span>
      </div>
    </section>
  );
}
