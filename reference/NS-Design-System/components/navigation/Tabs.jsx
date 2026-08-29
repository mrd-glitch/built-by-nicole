import React from "react";

const CSS = `
.ns-tabs{display:flex;gap:var(--space-6);border-bottom:1px solid var(--border-hairline);font-family:var(--font-body)}
.ns-tabs--invert{border-bottom-color:var(--border-invert)}
.ns-tabs--fill{gap:0}
.ns-tab{appearance:none;background:none;border:0;border-bottom:3px solid transparent;padding:12px 2px 10px;font-size:var(--type-ui-size);font-weight:var(--weight-bold);letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--text-muted);cursor:pointer;transition:var(--transition-control);margin-bottom:-1px;display:inline-flex;align-items:center;gap:8px;min-height:var(--touch-min)}
.ns-tab:hover{color:var(--text-strong)}
.ns-tabs--invert .ns-tab:hover{color:var(--text-invert)}
.ns-tab--active{color:var(--text-strong);border-bottom-color:var(--accent)}
.ns-tabs--invert .ns-tab--active{color:var(--text-invert)}
.ns-tabs--fill .ns-tab{flex:1;justify-content:center;padding-inline:12px}
.ns-tab:focus-visible{outline:none;box-shadow:var(--focus-shadow)}
.ns-tab__count{font-family:var(--font-mono);font-size:var(--text-2xs);color:var(--text-faint)}
`;

export function Tabs({ items = [], value, onChange, invert = false, fill = false, className = "" }) {
  React.useEffect(() => {
    if (document.getElementById("ns-tabs-css")) return;
    const el = document.createElement("style");
    el.id = "ns-tabs-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const active = value ?? (items[0] && (items[0].id || items[0]));
  return (
    <div
      className={["ns-tabs", invert ? "ns-tabs--invert" : "", fill ? "ns-tabs--fill" : "", className].filter(Boolean).join(" ")}
      role="tablist"
    >
      {items.map((item) => {
        const id = item.id || item;
        const label = item.label || item;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === active}
            className={`ns-tab${id === active ? " ns-tab--active" : ""}`}
            onClick={() => onChange && onChange(id)}
          >
            {item.icon}
            {label}
            {item.count != null ? <span className="ns-tab__count">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
