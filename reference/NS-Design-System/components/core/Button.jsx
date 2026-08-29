import React from "react";

const CSS = `
.ns-btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);border:var(--border-width-strong) solid transparent;border-radius:var(--radius-control);font-family:var(--type-ui-family);font-weight:var(--weight-bold);letter-spacing:var(--tracking-wide);text-transform:uppercase;cursor:pointer;text-decoration:none;transition:var(--transition-control);min-height:var(--touch-min);white-space:nowrap}
.ns-btn--sm{padding:var(--pad-control-y-sm) var(--pad-control-x-sm);font-size:var(--text-xs);min-height:36px}
.ns-btn--md{padding:var(--pad-control-y) var(--pad-control-x);font-size:var(--text-sm)}
.ns-btn--lg{padding:16px 34px;font-size:var(--text-md);letter-spacing:var(--tracking-wider)}
.ns-btn--block{width:100%}
.ns-btn--primary{background:var(--accent);color:var(--text-on-accent)}
.ns-btn--primary:hover{background:var(--accent-hover)}
.ns-btn--primary:active{background:var(--accent-press);transform:translateY(var(--press-translate));box-shadow:var(--shadow-inset-press)}
.ns-btn--highlight{background:var(--highlight);color:var(--text-on-highlight)}
.ns-btn--highlight:hover{background:var(--highlight-deep)}
.ns-btn--highlight:active{background:var(--highlight-deep);transform:translateY(var(--press-translate));box-shadow:var(--shadow-inset-press)}
.ns-btn--ink{background:var(--ink-900);color:var(--text-invert)}
.ns-btn--ink:hover{background:var(--ink-600)}
.ns-btn--ink:active{transform:translateY(var(--press-translate));box-shadow:var(--shadow-inset-press)}
.ns-btn--outline{background:transparent;color:var(--text-strong);border-color:var(--border-strong)}
.ns-btn--outline:hover{background:var(--ink-900);color:var(--text-invert)}
.ns-btn--outline:active{transform:translateY(var(--press-translate))}
.ns-btn--outline-invert{background:transparent;color:var(--text-invert);border-color:var(--paper-50)}
.ns-btn--outline-invert:hover{background:var(--paper-50);color:var(--text-strong)}
.ns-btn--ghost{background:transparent;color:var(--text-accent)}
.ns-btn--ghost:hover{background:var(--pink-100)}
.ns-btn:disabled,.ns-btn[aria-disabled=true]{opacity:0.38;cursor:not-allowed;transform:none;box-shadow:none}
.ns-btn:focus-visible{outline:none;box-shadow:var(--focus-shadow)}
`;

function useStyle(id, css) {
  React.useEffect(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }, []);
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  href,
  disabled = false,
  iconStart,
  iconEnd,
  className = "",
  children,
  ...rest
}) {
  useStyle("ns-button-css", CSS);
  const cls = ["ns-btn", `ns-btn--${variant}`, `ns-btn--${size}`, block ? "ns-btn--block" : "", className]
    .filter(Boolean)
    .join(" ");
  const inner = (
    <>
      {iconStart}
      {children}
      {iconEnd}
    </>
  );
  if (href) {
    return (
      <a className={cls} href={href} aria-disabled={disabled || undefined} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <button className={cls} disabled={disabled} {...rest}>
      {inner}
    </button>
  );
}
