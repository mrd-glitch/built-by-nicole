import React from "react";

const CSS = `
.ns-card{position:relative;border-radius:var(--radius-card);background:var(--surface-card);color:var(--text-body);border:1px solid var(--border-hairline);box-shadow:var(--shadow-1);transition:var(--transition-surface);overflow:hidden;text-align:left;display:block;width:100%;font-family:var(--font-body)}
.ns-card--invert{background:var(--surface-card-invert);color:var(--text-invert-muted);border-color:var(--border-invert)}
.ns-card--accent{background:var(--grad-flyer-diag);color:var(--text-on-accent);border-color:transparent}
.ns-card--highlight{background:var(--highlight);color:var(--text-on-highlight);border-color:transparent}
.ns-card--flat{box-shadow:none;background:var(--surface-sunken);border-color:transparent}
.ns-card--interactive{cursor:pointer}
.ns-card--interactive:hover{box-shadow:var(--shadow-3);transform:translateY(-2px)}
.ns-card--interactive:active{transform:translateY(0);box-shadow:var(--shadow-2)}
.ns-card--interactive:focus-visible{outline:none;box-shadow:var(--focus-shadow)}
.ns-card__media{display:block;width:100%;object-fit:cover;background:var(--surface-sunken)}
.ns-card__body{padding:var(--pad-card)}
.ns-card__body--lg{padding:var(--pad-card-lg)}
.ns-card__body--none{padding:0}
`;

export function Card({
  tone = "default",
  padding = "md",
  interactive = false,
  media,
  mediaHeight = 180,
  onClick,
  className = "",
  children,
  ...rest
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-card-css")) return;
    const el = document.createElement("style");
    el.id = "ns-card-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const cls = [
    "ns-card",
    tone !== "default" ? `ns-card--${tone}` : "",
    interactive || onClick ? "ns-card--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const bodyCls = `ns-card__body${padding === "lg" ? " ns-card__body--lg" : padding === "none" ? " ns-card__body--none" : ""}`;
  const Comp = onClick ? "button" : "div";
  return (
    <Comp className={cls} onClick={onClick} type={onClick ? "button" : undefined} {...rest}>
      {media ? <img className="ns-card__media" src={media} alt="" style={{ height: mediaHeight }} /> : null}
      <div className={bodyCls}>{children}</div>
    </Comp>
  );
}
