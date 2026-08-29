import React from "react";

const CSS = `
.ns-choice{display:inline-flex;align-items:flex-start;gap:10px;font-family:var(--font-body);font-size:var(--text-base);color:var(--text-body);cursor:pointer;line-height:1.35;padding:4px 0;min-height:32px}
.ns-choice--invert{color:var(--text-invert-muted)}
.ns-choice input{position:absolute;opacity:0;width:0;height:0}
.ns-choice__box{flex:none;width:22px;height:22px;border:2px solid var(--border-strong);background:var(--surface-card);display:flex;align-items:center;justify-content:center;transition:var(--transition-control);margin-top:1px}
.ns-choice--check .ns-choice__box{border-radius:var(--radius-xs)}
.ns-choice--radio .ns-choice__box{border-radius:var(--radius-circle)}
.ns-choice--invert .ns-choice__box{border-color:var(--paper-50);background:transparent}
.ns-choice input:checked + .ns-choice__box{background:var(--accent);border-color:var(--accent)}
.ns-choice input:focus-visible + .ns-choice__box{box-shadow:var(--focus-shadow)}
.ns-choice input:disabled + .ns-choice__box{opacity:0.35}
.ns-choice__mark{opacity:0;color:#fff;display:flex}
.ns-choice input:checked + .ns-choice__box .ns-choice__mark{opacity:1}
.ns-choice--radio .ns-choice__mark{width:8px;height:8px;border-radius:var(--radius-circle);background:#fff}
.ns-choice__text{display:flex;flex-direction:column;gap:2px}
.ns-choice__hint{font-size:var(--text-xs);color:var(--text-muted)}
`;

function useChoiceStyles() {
  React.useEffect(() => {
    if (document.getElementById("ns-choice-css")) return;
    const el = document.createElement("style");
    el.id = "ns-choice-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

export function Checkbox({ label, hint, invert = false, className = "", ...rest }) {
  useChoiceStyles();
  return (
    <label className={`ns-choice ns-choice--check${invert ? " ns-choice--invert" : ""} ${className}`}>
      <input type="checkbox" {...rest} />
      <span className="ns-choice__box">
        <span className="ns-choice__mark">
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
            <path d="M1 5l3.6 3.6L12 1.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
          </svg>
        </span>
      </span>
      <span className="ns-choice__text">
        <span>{label}</span>
        {hint ? <span className="ns-choice__hint">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Radio({ label, hint, invert = false, className = "", ...rest }) {
  useChoiceStyles();
  return (
    <label className={`ns-choice ns-choice--radio${invert ? " ns-choice--invert" : ""} ${className}`}>
      <input type="radio" {...rest} />
      <span className="ns-choice__box">
        <span className="ns-choice__mark" />
      </span>
      <span className="ns-choice__text">
        <span>{label}</span>
        {hint ? <span className="ns-choice__hint">{hint}</span> : null}
      </span>
    </label>
  );
}
