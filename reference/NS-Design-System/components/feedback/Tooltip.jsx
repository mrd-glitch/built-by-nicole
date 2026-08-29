import React from "react";

const CSS = `
.ns-tip{position:relative;display:inline-flex}
.ns-tip__bubble{position:absolute;z-index:40;background:var(--ink-900);color:var(--paper-50);font-family:var(--font-body);font-size:var(--text-xs);font-weight:var(--weight-medium);line-height:1.4;padding:7px 10px;border-radius:var(--radius-sm);box-shadow:var(--shadow-3);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity var(--dur-fast) var(--ease-standard)}
.ns-tip__bubble--on{opacity:1}
.ns-tip__bubble--top{bottom:calc(100% + 8px);left:50%;transform:translateX(-50%)}
.ns-tip__bubble--bottom{top:calc(100% + 8px);left:50%;transform:translateX(-50%)}
.ns-tip__bubble--left{right:calc(100% + 8px);top:50%;transform:translateY(-50%)}
.ns-tip__bubble--right{left:calc(100% + 8px);top:50%;transform:translateY(-50%)}
`;

export function Tooltip({ label, placement = "top", children }) {
  React.useEffect(() => {
    if (document.getElementById("ns-tooltip-css")) return;
    const el = document.createElement("style");
    el.id = "ns-tooltip-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const [on, setOn] = React.useState(false);
  return (
    <span
      className="ns-tip"
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
    >
      {children}
      <span className={`ns-tip__bubble ns-tip__bubble--${placement}${on ? " ns-tip__bubble--on" : ""}`} role="tooltip">
        {label}
      </span>
    </span>
  );
}
