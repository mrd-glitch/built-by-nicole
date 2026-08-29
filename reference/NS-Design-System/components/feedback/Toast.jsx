import React from "react";

const CSS = `
.ns-toast{display:flex;align-items:flex-start;gap:var(--space-3);background:var(--ink-900);color:var(--text-invert);border-radius:var(--radius-md);box-shadow:var(--shadow-4);padding:14px 16px;font-family:var(--font-body);font-size:var(--text-sm);max-width:420px;animation:ns-toast-in var(--dur-slow) var(--ease-out)}
.ns-toast__dot{flex:none;width:8px;height:8px;border-radius:var(--radius-circle);margin-top:6px;background:var(--accent)}
.ns-toast--success .ns-toast__dot{background:var(--success)}
.ns-toast--warning .ns-toast__dot{background:var(--highlight)}
.ns-toast--danger .ns-toast__dot{background:var(--accent)}
.ns-toast__title{font-weight:var(--weight-bold);letter-spacing:var(--tracking-tight);color:var(--paper-50)}
.ns-toast__msg{color:var(--text-invert-muted);margin-top:2px}
.ns-toast__x{appearance:none;border:0;background:none;color:var(--grey-400);cursor:pointer;font-size:14px;padding:2px;line-height:1}
.ns-toast__x:hover{color:var(--paper-50)}
@keyframes ns-toast-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
`;

export function Toast({ tone = "accent", title, children, onDismiss, className = "", ...rest }) {
  React.useEffect(() => {
    if (document.getElementById("ns-toast-css")) return;
    const el = document.createElement("style");
    el.id = "ns-toast-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return (
    <div className={`ns-toast ns-toast--${tone} ${className}`} role="status" {...rest}>
      <span className="ns-toast__dot" />
      <div style={{ flex: 1 }}>
        {title ? <div className="ns-toast__title">{title}</div> : null}
        {children ? <div className="ns-toast__msg">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button type="button" className="ns-toast__x" aria-label="Dismiss" onClick={onDismiss}>
          ✕
        </button>
      ) : null}
    </div>
  );
}
