import React from "react";

const CSS = `
.ns-tag{display:inline-flex;align-items:center;gap:8px;border-radius:var(--radius-sm);border:1px solid var(--border-muted);background:var(--surface-card);color:var(--text-body);font-family:var(--font-body);font-size:var(--text-xs);font-weight:var(--weight-semibold);letter-spacing:var(--tracking-wide);text-transform:uppercase;padding:6px 10px;line-height:1;transition:var(--transition-control)}
.ns-tag--selected{background:var(--ink-900);border-color:var(--ink-900);color:var(--text-invert)}
.ns-tag--selectable{cursor:pointer}
.ns-tag--selectable:hover{border-color:var(--border-strong)}
.ns-tag--selected.ns-tag--selectable:hover{background:var(--ink-600);border-color:var(--ink-600)}
.ns-tag__x{display:inline-flex;align-items:center;justify-content:center;border:0;background:none;padding:0;margin:-2px -3px -2px 0;color:inherit;cursor:pointer;opacity:0.6;font-size:13px;line-height:1}
.ns-tag__x:hover{opacity:1}
.ns-tag:focus-visible{outline:none;box-shadow:var(--focus-shadow)}
`;

export function Tag({ selected = false, onSelect, onRemove, className = "", children, ...rest }) {
  React.useEffect(() => {
    if (document.getElementById("ns-tag-css")) return;
    const el = document.createElement("style");
    el.id = "ns-tag-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const selectable = Boolean(onSelect);
  const cls = ["ns-tag", selected ? "ns-tag--selected" : "", selectable ? "ns-tag--selectable" : "", className]
    .filter(Boolean)
    .join(" ");
  const Comp = selectable ? "button" : "span";
  return (
    <Comp
      className={cls}
      onClick={onSelect}
      type={selectable ? "button" : undefined}
      aria-pressed={selectable ? selected : undefined}
      {...rest}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          className="ns-tag__x"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
        >
          ✕
        </button>
      ) : null}
    </Comp>
  );
}
