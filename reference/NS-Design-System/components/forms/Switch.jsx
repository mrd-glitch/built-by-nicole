import React from "react";

const CSS = `
.ns-switch{display:inline-flex;align-items:center;gap:12px;font-family:var(--font-body);font-size:var(--text-base);color:var(--text-body);cursor:pointer;min-height:var(--touch-min)}
.ns-switch--invert{color:var(--text-invert-muted)}
.ns-switch input{position:absolute;opacity:0;width:0;height:0}
.ns-switch__track{flex:none;width:46px;height:26px;border-radius:var(--radius-pill);background:var(--grey-300);position:relative;transition:background-color var(--dur-base) var(--ease-standard)}
.ns-switch--invert .ns-switch__track{background:var(--grey-600)}
.ns-switch__knob{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:var(--radius-circle);background:#fff;box-shadow:var(--shadow-1);transition:transform var(--dur-base) var(--ease-snap)}
.ns-switch input:checked + .ns-switch__track{background:var(--accent)}
.ns-switch input:checked + .ns-switch__track .ns-switch__knob{transform:translateX(20px)}
.ns-switch input:focus-visible + .ns-switch__track{box-shadow:var(--focus-shadow)}
.ns-switch input:disabled + .ns-switch__track{opacity:0.4}
`;

export function Switch({ label, invert = false, labelPosition = "end", className = "", ...rest }) {
  React.useEffect(() => {
    if (document.getElementById("ns-switch-css")) return;
    const el = document.createElement("style");
    el.id = "ns-switch-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const control = (
    <>
      <input type="checkbox" role="switch" {...rest} />
      <span className="ns-switch__track">
        <span className="ns-switch__knob" />
      </span>
    </>
  );
  return (
    <label className={`ns-switch${invert ? " ns-switch--invert" : ""} ${className}`}>
      {labelPosition === "start" ? (
        <>
          <span style={{ flex: 1 }}>{label}</span>
          {control}
        </>
      ) : (
        <>
          {control}
          <span>{label}</span>
        </>
      )}
    </label>
  );
}
