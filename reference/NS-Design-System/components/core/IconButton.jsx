import React from "react";
import { Button } from "./Button.jsx";

const CSS = `
.ns-iconbtn{aspect-ratio:1;padding:0;border-radius:var(--radius-circle)}
.ns-iconbtn.ns-btn--sm{width:36px;min-height:36px}
.ns-iconbtn.ns-btn--md{width:44px;min-height:44px}
.ns-iconbtn.ns-btn--lg{width:56px;min-height:56px}
`;

export function IconButton({ label, size = "md", className = "", children, ...rest }) {
  React.useEffect(() => {
    if (document.getElementById("ns-iconbutton-css")) return;
    const el = document.createElement("style");
    el.id = "ns-iconbutton-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return (
    <Button size={size} className={`ns-iconbtn ${className}`} aria-label={label} {...rest}>
      {children}
    </Button>
  );
}
