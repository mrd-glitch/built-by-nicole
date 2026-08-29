/* NS Coaching badge — vector recreation of the official logo (docs/brand-source/).
   tone: "paper" = paper marks for dark backgrounds, "ink" = ink marks for light
   backgrounds, "pink" = filled pink disc with white marks (alt fill). */

const TONES = {
  paper: { ring: "#FAFAF8", text: "#FAFAF8", dash: "#FF1F6B", disc: "none" },
  ink: { ring: "#0D0D0F", text: "#0D0D0F", dash: "#FF1F6B", disc: "none" },
  pink: { ring: "none", text: "#FFFFFF", dash: "#FFFFFF", disc: "#FF1F6B" },
} as const;

export function NSBadge({
  tone = "ink",
  size = 40,
  coaching = true,
  className,
}: {
  tone?: keyof typeof TONES;
  size?: number;
  coaching?: boolean;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="NS Coaching"
    >
      {t.disc !== "none" && <circle cx="100" cy="100" r="97" fill={t.disc} />}
      {t.ring !== "none" && <circle cx="100" cy="100" r="93" fill="none" stroke={t.ring} strokeWidth="4.5" />}
      <text
        x="100"
        y={coaching ? 96 : 106}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={t.text}
        style={{
          fontFamily: "var(--font-display), 'Helvetica Neue', Arial, sans-serif",
          fontWeight: 900,
          fontSize: coaching ? 62 : 76,
          letterSpacing: "-0.02em",
        }}
      >
        NS
      </text>
      <rect x="86" y={coaching ? 126 : 138} width="28" height="5.5" rx="2.75" fill={t.dash} />
      {coaching && (
        <text
          x="103"
          y="156"
          textAnchor="middle"
          fill={t.text}
          style={{
            fontFamily: "var(--font-display), 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 700,
            fontSize: 13.5,
            letterSpacing: "0.38em",
          }}
        >
          COACHING
        </text>
      )}
    </svg>
  );
}
