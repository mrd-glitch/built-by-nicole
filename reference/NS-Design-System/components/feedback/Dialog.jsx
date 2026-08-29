import React from "react";

const CSS = `
.ns-dialog__scrim{position:fixed;inset:0;background:var(--surface-scrim);backdrop-filter:var(--blur-scrim);display:flex;align-items:center;justify-content:center;padding:var(--space-6);z-index:60;animation:ns-fade var(--dur-base) var(--ease-standard)}
.ns-dialog{position:relative;background:var(--surface-card);border-radius:var(--radius-sheet);box-shadow:var(--shadow-4);width:100%;max-width:520px;max-height:88vh;overflow:auto;font-family:var(--font-body);animation:ns-rise var(--dur-slow) var(--ease-out)}
.ns-dialog--invert{background:var(--ink-800);color:var(--text-invert-muted)}
.ns-dialog--sm{max-width:400px}
.ns-dialog--lg{max-width:760px}
.ns-dialog__head{display:flex;align-items:flex-start;gap:var(--space-4);padding:var(--pad-card-lg) var(--pad-card-lg) 0}
.ns-dialog__title{font-family:var(--font-display);font-weight:var(--weight-extrabold);font-size:var(--text-xl);letter-spacing:var(--tracking-tight);line-height:var(--leading-heading);color:var(--text-strong);flex:1;margin:0}
.ns-dialog--invert .ns-dialog__title{color:var(--text-invert)}
.ns-dialog__body{padding:var(--space-4) var(--pad-card-lg)}
.ns-dialog__foot{display:flex;gap:var(--space-3);justify-content:flex-end;flex-wrap:wrap;padding:var(--space-4) var(--pad-card-lg) var(--pad-card-lg)}
.ns-dialog__x{appearance:none;border:0;background:none;cursor:pointer;color:var(--text-muted);font-size:18px;line-height:1;padding:6px;margin:-6px}
.ns-dialog__x:hover{color:var(--text-strong)}
@keyframes ns-fade{from{opacity:0}to{opacity:1}}
@keyframes ns-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
`;

export function Dialog({ open = false, title, size = "md", invert = false, onClose, footer, children }) {
  React.useEffect(() => {
    if (document.getElementById("ns-dialog-css")) return;
    const el = document.createElement("style");
    el.id = "ns-dialog-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  React.useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ns-dialog__scrim" onClick={onClose}>
      <div
        className={`ns-dialog ns-dialog--${size}${invert ? " ns-dialog--invert" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title || onClose ? (
          <div className="ns-dialog__head">
            {title ? <h2 className="ns-dialog__title">{title}</h2> : <span style={{ flex: 1 }} />}
            {onClose ? (
              <button type="button" className="ns-dialog__x" aria-label="Close" onClick={onClose}>
                ✕
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="ns-dialog__body">{children}</div>
        {footer ? <div className="ns-dialog__foot">{footer}</div> : null}
      </div>
    </div>
  );
}
