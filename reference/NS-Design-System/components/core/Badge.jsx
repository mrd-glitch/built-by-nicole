import React from "react";

const CSS = `
.ns-badge{display:inline-flex;align-items:center;gap:6px;border-radius:var(--radius-badge);font-family:var(--font-body);font-size:var(--text-2xs);font-weight:var(--weight-bold);letter-spacing:var(--tracking-wider);text-transform:uppercase;padding:5px 11px;line-height:1;border:1px solid transparent;white-space:nowrap}
.ns-badge--accent{background:var(--accent);color:var(--text-on-accent)}
.ns-badge--highlight{background:var(--highlight);color:var(--text-on-highlight)}
.ns-badge--ink{background:var(--ink-900);color:var(--text-invert)}
.ns-badge--soft{background:var(--pink-100);color:var(--text-accent)}
.ns-badge--neutral{background:var(--surface-sunken);color:var(--text-muted)}
.ns-badge--success{background:var(--success-soft);color:oklch(0.42 0.12 152)}
.ns-badge--outline{background:transparent;color:var(--text-strong);border-color:var(--border-strong)}
.ns-badge--outline-invert{background:transparent;color:var(--text-invert);border-color:var(--border-invert)}
.ns-badge__dot{width:6px;height:6px;border-radius:var(--radius-circle);background:currentColor}
`;

export function Badge({ tone = "accent", dot = false, className = "", children, ...rest }) {
  React.useEffect(() => {
    if (document.getElementById("ns-badge-css")) return;
    const el = document.createElement("style");
    el.id = "ns-badge-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return (
    <span className={`ns-badge ns-badge--${tone} ${className}`} {...rest}>
      {dot ? <span className="ns-badge__dot" /> : null}
      {children}
    </span>
  );
}
