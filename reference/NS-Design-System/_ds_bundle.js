/* @ds-bundle: {"format":4,"namespace":"NSDesignSystem_14b176","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Radio","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"6aae6e372b2c","components/core/Button.jsx":"4ac99481e842","components/core/Card.jsx":"5c8c1fd2cc04","components/core/Icon.jsx":"83ed270b2f5e","components/core/IconButton.jsx":"4341f48c5248","components/core/Logo.jsx":"b69901bf6a32","components/core/Tag.jsx":"d824a577688f","components/feedback/Dialog.jsx":"588822b35bc3","components/feedback/Toast.jsx":"7b940e540a38","components/feedback/Tooltip.jsx":"71cd8b7b3c00","components/forms/Checkbox.jsx":"501df945d481","components/forms/Input.jsx":"125b8e0f564c","components/forms/Select.jsx":"10e24bac27fa","components/forms/Switch.jsx":"1d370e465c15","components/navigation/Tabs.jsx":"8be592e1c037","ui_kits/social/Templates.jsx":"0592271f5f18","ui_kits/website/App.jsx":"e3227c2268b4","ui_kits/website/HomePage.jsx":"8916e46a45d3","ui_kits/website/InnerPages.jsx":"186f594a461f","ui_kits/website/SiteChrome.jsx":"cac20ae6fa69"},"inlinedExternals":[],"unexposedExports":[{"name":"useFieldStyles","sourcePath":"components/forms/Input.jsx"}]} */

(() => {

const __ds_ns = (window.NSDesignSystem_14b176 = window.NSDesignSystem_14b176 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ns-badge{display:inline-flex;align-items:center;gap:6px;border-radius:var(--radius-badge);font-family:var(--font-body);font-size:var(--text-2xs);font-weight:var(--weight-bold);letter-spacing:var(--tracking-wider);text-transform:uppercase;padding:5px 11px;line-height:1;border:1px solid transparent;white-space:nowrap}
.ns-badge--accent{background:var(--accent);color:var(--text-on-accent)}
.ns-badge--highlight{background:var(--highlight);color:var(--text-on-highlight)}
.ns-badge--ink{background:var(--ink-900);color:var(--text-invert)}
.ns-badge--soft{background:var(--pink-100);color:var(--text-accent)}
.ns-badge--neutral{background:var(--surface-sunken);color:var(--text-muted)}
.ns-badge--success{background:var(--success-soft);color:oklch(0.42 0.12 152)}
.ns-badge--outline{background:transparent;color:var(--text-strong);border-color:var(--border-strong)}
.ns-badge--outline-invert{background:transparent;color:var(--text-invert);border-color:var(--border-invert)}
.ns-badge__dot{width:6px;height:6px;border-radius:var(--radius-circle);background:currentColor}
`;
function Badge({
  tone = "accent",
  dot = false,
  className = "",
  children,
  ...rest
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-badge-css")) return;
    const el = document.createElement("style");
    el.id = "ns-badge-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `ns-badge ns-badge--${tone} ${className}`
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    className: "ns-badge__dot"
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Button({
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
  const cls = ["ns-btn", `ns-btn--${variant}`, `ns-btn--${size}`, block ? "ns-btn--block" : "", className].filter(Boolean).join(" ");
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, iconStart, children, iconEnd);
  if (href) {
    return /*#__PURE__*/React.createElement("a", _extends({
      className: cls,
      href: href,
      "aria-disabled": disabled || undefined
    }, rest), inner);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    disabled: disabled
  }, rest), inner);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Card({
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
  const cls = ["ns-card", tone !== "default" ? `ns-card--${tone}` : "", interactive || onClick ? "ns-card--interactive" : "", className].filter(Boolean).join(" ");
  const bodyCls = `ns-card__body${padding === "lg" ? " ns-card__body--lg" : padding === "none" ? " ns-card__body--none" : ""}`;
  const Comp = onClick ? "button" : "div";
  return /*#__PURE__*/React.createElement(Comp, _extends({
    className: cls,
    onClick: onClick,
    type: onClick ? "button" : undefined
  }, rest), media ? /*#__PURE__*/React.createElement("img", {
    className: "ns-card__media",
    src: media,
    alt: "",
    style: {
      height: mediaHeight
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    className: bodyCls
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
/** Lucide glyph via the Iconify web component. Substituted set — NS shipped no icon assets. */
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = "currentColor",
  label,
  style,
  ...rest
}) {
  return React.createElement("iconify-icon", {
    icon: `lucide:${name}`,
    width: size,
    height: size,
    "aria-label": label,
    "aria-hidden": label ? undefined : "true",
    role: label ? "img" : undefined,
    style: {
      color,
      display: "inline-flex",
      flex: "none",
      "--iconify-stroke-width": strokeWidth,
      ...style
    },
    ...rest
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ns-iconbtn{aspect-ratio:1;padding:0;border-radius:var(--radius-circle)}
.ns-iconbtn.ns-btn--sm{width:36px;min-height:36px}
.ns-iconbtn.ns-btn--md{width:44px;min-height:44px}
.ns-iconbtn.ns-btn--lg{width:56px;min-height:56px}
`;
function IconButton({
  label,
  size = "md",
  className = "",
  children,
  ...rest
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-iconbutton-css")) return;
    const el = document.createElement("style");
    el.id = "ns-iconbutton-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return /*#__PURE__*/React.createElement(__ds_scope.Button, _extends({
    size: size,
    className: `ns-iconbtn ${className}`,
    "aria-label": label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const FILES = {
  "swirl-ink-pink": "swirl-ink-pink.png",
  "swirl-paper-pink": "swirl-paper-pink.png",
  "swirl-pink-paper": "swirl-pink-paper.png",
  "lockup-on-paper": "ns-lockup-ink-pink-on-paper.png",
  "lockup-on-ink": "ns-lockup-paper-pink-on-ink.png",
  "lockup-pink-leading": "ns-lockup-pink-leading-on-ink.png"
};

/** Renders a supplied NS brand mark. Never redraw the mark — always point at these files. */
function Logo({
  variant = "lockup-on-paper",
  size = 96,
  basePath = "assets/logos",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("img", _extends({
    src: `${basePath}/${FILES[variant] || FILES["lockup-on-paper"]}`,
    alt: "NS",
    width: size,
    height: size,
    style: {
      display: "block",
      width: size,
      height: size,
      objectFit: "contain",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Tag({
  selected = false,
  onSelect,
  onRemove,
  className = "",
  children,
  ...rest
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-tag-css")) return;
    const el = document.createElement("style");
    el.id = "ns-tag-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const selectable = Boolean(onSelect);
  const cls = ["ns-tag", selected ? "ns-tag--selected" : "", selectable ? "ns-tag--selectable" : "", className].filter(Boolean).join(" ");
  const Comp = selectable ? "button" : "span";
  return /*#__PURE__*/React.createElement(Comp, _extends({
    className: cls,
    onClick: onSelect,
    type: selectable ? "button" : undefined,
    "aria-pressed": selectable ? selected : undefined
  }, rest), children, onRemove ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ns-tag__x",
    "aria-label": "Remove",
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    }
  }, "\u2715") : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
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
function Dialog({
  open = false,
  title,
  size = "md",
  invert = false,
  onClose,
  footer,
  children
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-dialog-css")) return;
    const el = document.createElement("style");
    el.id = "ns-dialog-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  React.useEffect(() => {
    if (!open || !onClose) return;
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "ns-dialog__scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: `ns-dialog ns-dialog--${size}${invert ? " ns-dialog--invert" : ""}`,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === "string" ? title : undefined,
    onClick: e => e.stopPropagation()
  }, title || onClose ? /*#__PURE__*/React.createElement("div", {
    className: "ns-dialog__head"
  }, title ? /*#__PURE__*/React.createElement("h2", {
    className: "ns-dialog__title"
  }, title) : /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), onClose ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ns-dialog__x",
    "aria-label": "Close",
    onClick: onClose
  }, "\u2715") : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "ns-dialog__body"
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    className: "ns-dialog__foot"
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Toast({
  tone = "accent",
  title,
  children,
  onDismiss,
  className = "",
  ...rest
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-toast-css")) return;
    const el = document.createElement("style");
    el.id = "ns-toast-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `ns-toast ns-toast--${tone} ${className}`,
    role: "status"
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "ns-toast__dot"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "ns-toast__title"
  }, title) : null, children ? /*#__PURE__*/React.createElement("div", {
    className: "ns-toast__msg"
  }, children) : null), onDismiss ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ns-toast__x",
    "aria-label": "Dismiss",
    onClick: onDismiss
  }, "\u2715") : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const CSS = `
.ns-tip{position:relative;display:inline-flex}
.ns-tip__bubble{position:absolute;z-index:40;background:var(--ink-900);color:var(--paper-50);font-family:var(--font-body);font-size:var(--text-xs);font-weight:var(--weight-medium);line-height:1.4;padding:7px 10px;border-radius:var(--radius-sm);box-shadow:var(--shadow-3);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity var(--dur-fast) var(--ease-standard)}
.ns-tip__bubble--on{opacity:1}
.ns-tip__bubble--top{bottom:calc(100% + 8px);left:50%;transform:translateX(-50%)}
.ns-tip__bubble--bottom{top:calc(100% + 8px);left:50%;transform:translateX(-50%)}
.ns-tip__bubble--left{right:calc(100% + 8px);top:50%;transform:translateY(-50%)}
.ns-tip__bubble--right{left:calc(100% + 8px);top:50%;transform:translateY(-50%)}
`;
function Tooltip({
  label,
  placement = "top",
  children
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-tooltip-css")) return;
    const el = document.createElement("style");
    el.id = "ns-tooltip-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const [on, setOn] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    className: "ns-tip",
    onMouseEnter: () => setOn(true),
    onMouseLeave: () => setOn(false),
    onFocus: () => setOn(true),
    onBlur: () => setOn(false)
  }, children, /*#__PURE__*/React.createElement("span", {
    className: `ns-tip__bubble ns-tip__bubble--${placement}${on ? " ns-tip__bubble--on" : ""}`,
    role: "tooltip"
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Checkbox({
  label,
  hint,
  invert = false,
  className = "",
  ...rest
}) {
  useChoiceStyles();
  return /*#__PURE__*/React.createElement("label", {
    className: `ns-choice ns-choice--check${invert ? " ns-choice--invert" : ""} ${className}`
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "ns-choice__box"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ns-choice__mark"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "10",
    viewBox: "0 0 13 10",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 5l3.6 3.6L12 1.2",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "square"
  })))), /*#__PURE__*/React.createElement("span", {
    className: "ns-choice__text"
  }, /*#__PURE__*/React.createElement("span", null, label), hint ? /*#__PURE__*/React.createElement("span", {
    className: "ns-choice__hint"
  }, hint) : null));
}
function Radio({
  label,
  hint,
  invert = false,
  className = "",
  ...rest
}) {
  useChoiceStyles();
  return /*#__PURE__*/React.createElement("label", {
    className: `ns-choice ns-choice--radio${invert ? " ns-choice--invert" : ""} ${className}`
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "ns-choice__box"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ns-choice__mark"
  })), /*#__PURE__*/React.createElement("span", {
    className: "ns-choice__text"
  }, /*#__PURE__*/React.createElement("span", null, label), hint ? /*#__PURE__*/React.createElement("span", {
    className: "ns-choice__hint"
  }, hint) : null));
}
Object.assign(__ds_scope, { Checkbox, Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ns-field{display:flex;flex-direction:column;gap:6px;font-family:var(--font-body);width:100%}
.ns-field__label{font-family:var(--type-eyebrow-family);font-size:var(--type-eyebrow-size);font-weight:var(--type-eyebrow-weight);letter-spacing:var(--tracking-wider);text-transform:uppercase;color:var(--text-muted)}
.ns-field__label--invert{color:var(--text-invert-muted)}
.ns-field__req{color:var(--accent)}
.ns-field__control{font-family:var(--font-body);font-size:var(--text-base);color:var(--text-strong);background:var(--surface-card);border:1px solid var(--border-muted);border-radius:var(--radius-input);padding:12px 14px;min-height:var(--touch-min);width:100%;transition:border-color var(--dur-fast) var(--ease-standard),box-shadow var(--dur-fast) var(--ease-standard)}
.ns-field__control::placeholder{color:var(--text-faint)}
.ns-field__control:hover{border-color:var(--grey-400)}
.ns-field__control:focus{outline:none;border-color:var(--ink-900);box-shadow:var(--focus-shadow)}
.ns-field__control--invert{background:var(--ink-700);border-color:var(--border-invert);color:var(--text-invert)}
.ns-field__control--invert:hover{border-color:var(--grey-500)}
.ns-field__control--invert:focus{border-color:var(--paper-50)}
.ns-field__control--error{border-color:var(--danger)}
.ns-field__control:disabled{background:var(--surface-sunken);color:var(--text-faint);cursor:not-allowed}
.ns-field__hint{font-size:var(--text-xs);color:var(--text-muted)}
.ns-field__hint--error{color:var(--danger);font-weight:var(--weight-semibold)}
.ns-field__wrap{position:relative;display:flex;align-items:center}
.ns-field__adorn{position:absolute;right:12px;display:flex;color:var(--text-faint);pointer-events:none}
`;
function useFieldStyles() {
  React.useEffect(() => {
    if (document.getElementById("ns-field-css")) return;
    const el = document.createElement("style");
    el.id = "ns-field-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}
function Input({
  label,
  hint,
  error,
  required = false,
  invert = false,
  adornment,
  as = "input",
  rows = 4,
  className = "",
  id,
  ...rest
}) {
  useFieldStyles();
  const uid = React.useId();
  const fid = id || uid;
  const Comp = as === "textarea" ? "textarea" : "input";
  const controlCls = ["ns-field__control", invert ? "ns-field__control--invert" : "", error ? "ns-field__control--error" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("label", {
    className: "ns-field",
    htmlFor: fid
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: `ns-field__label${invert ? " ns-field__label--invert" : ""}`
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    className: "ns-field__req"
  }, " *") : null) : null, /*#__PURE__*/React.createElement("span", {
    className: "ns-field__wrap"
  }, /*#__PURE__*/React.createElement(Comp, _extends({
    id: fid,
    className: controlCls,
    rows: as === "textarea" ? rows : undefined,
    "aria-invalid": error ? true : undefined,
    style: as === "textarea" ? {
      resize: "vertical",
      lineHeight: "var(--leading-body)"
    } : undefined
  }, rest)), adornment ? /*#__PURE__*/React.createElement("span", {
    className: "ns-field__adorn"
  }, adornment) : null), error ? /*#__PURE__*/React.createElement("span", {
    className: "ns-field__hint ns-field__hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "ns-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { useFieldStyles, Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  hint,
  error,
  required = false,
  invert = false,
  options = [],
  className = "",
  id,
  children,
  ...rest
}) {
  __ds_scope.useFieldStyles();
  const uid = React.useId();
  const fid = id || uid;
  return /*#__PURE__*/React.createElement("label", {
    className: "ns-field",
    htmlFor: fid
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: `ns-field__label${invert ? " ns-field__label--invert" : ""}`
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    className: "ns-field__req"
  }, " *") : null) : null, /*#__PURE__*/React.createElement("span", {
    className: "ns-field__wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fid,
    className: ["ns-field__control", invert ? "ns-field__control--invert" : "", error ? "ns-field__control--error" : "", className].filter(Boolean).join(" "),
    style: {
      appearance: "none",
      paddingRight: 38,
      cursor: "pointer"
    }
  }, rest), children || options.map(o => {
    const value = typeof o === "string" ? o : o.value;
    const text = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: value,
      value: value
    }, text);
  })), /*#__PURE__*/React.createElement("span", {
    className: "ns-field__adorn",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "8",
    viewBox: "0 0 12 8",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1.5 6 6.5l5-5",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "square"
  })))), error ? /*#__PURE__*/React.createElement("span", {
    className: "ns-field__hint ns-field__hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "ns-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Switch({
  label,
  invert = false,
  labelPosition = "end",
  className = "",
  ...rest
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-switch-css")) return;
    const el = document.createElement("style");
    el.id = "ns-switch-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const control = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "ns-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ns-switch__knob"
  })));
  return /*#__PURE__*/React.createElement("label", {
    className: `ns-switch${invert ? " ns-switch--invert" : ""} ${className}`
  }, labelPosition === "start" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, label), control) : /*#__PURE__*/React.createElement(React.Fragment, null, control, /*#__PURE__*/React.createElement("span", null, label)));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
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
function Tabs({
  items = [],
  value,
  onChange,
  invert = false,
  fill = false,
  className = ""
}) {
  React.useEffect(() => {
    if (document.getElementById("ns-tabs-css")) return;
    const el = document.createElement("style");
    el.id = "ns-tabs-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  const active = value ?? (items[0] && (items[0].id || items[0]));
  return /*#__PURE__*/React.createElement("div", {
    className: ["ns-tabs", invert ? "ns-tabs--invert" : "", fill ? "ns-tabs--fill" : "", className].filter(Boolean).join(" "),
    role: "tablist"
  }, items.map(item => {
    const id = item.id || item;
    const label = item.label || item;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      type: "button",
      role: "tab",
      "aria-selected": id === active,
      className: `ns-tab${id === active ? " ns-tab--active" : ""}`,
      onClick: () => onChange && onChange(id)
    }, item.icon, label, item.count != null ? /*#__PURE__*/React.createElement("span", {
      className: "ns-tab__count"
    }, item.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/social/Templates.jsx
try { (() => {
const {
  Logo,
  Badge,
  Button
} = window.NSDesignSystem_14b176;
const Square = ({
  children,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    width: 360,
    height: 360,
    position: "relative",
    overflow: "hidden",
    borderRadius: "var(--radius-media)",
    boxShadow: "var(--shadow-3)",
    ...style
  }
}, children);

/* Challenge announce — Cinzel over the flyer gradient, as on the supplied Misogi artwork. */
function ChallengeAnnounce() {
  return /*#__PURE__*/React.createElement(Square, {
    style: {
      background: "var(--grad-flyer)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      padding: 30,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-serif-display)",
      fontWeight: 600,
      fontSize: 12,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--ink-900)",
      whiteSpace: "nowrap"
    }
  }, "Saturday, June 21"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-serif-display)",
      fontWeight: 700,
      fontSize: 34,
      lineHeight: 1.12,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: "var(--ink-900)"
    }
  }, "Women\u2019s", /*#__PURE__*/React.createElement("br", null), "Misogi 3.0"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      borderTop: "2px solid rgb(13 13 15 / .5)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-serif-display)",
      fontSize: 14,
      letterSpacing: "0.16em",
      color: "rgb(13 13 15 / .78)",
      whiteSpace: "nowrap"
    }
  }, "6 AM \u2013 6 PM")), /*#__PURE__*/React.createElement(Logo, {
    variant: "swirl-ink-pink",
    size: 46,
    basePath: "../../assets/logos",
    style: {
      position: "absolute",
      bottom: 16,
      left: "50%",
      transform: "translateX(-50%)",
      opacity: 0.9
    }
  }));
}

/* Programme promo — ink card, photo, display type, one pink CTA. */
function ProgrammePromo() {
  return /*#__PURE__*/React.createElement(Square, {
    style: {
      background: "var(--ink-900)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/photography/gym-dumbbell-rack.jpeg",
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg,rgb(13 13 15 / .35) 0%,rgb(13 13 15 / .95) 72%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      padding: 26,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "swirl-paper-pink",
    size: 40,
    basePath: "../../assets/logos"
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "highlight"
  }, "4 spots")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.26em",
      textTransform: "uppercase",
      color: "var(--pink-300)"
    }
  }, "March cohort"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: 44,
      lineHeight: 0.94,
      letterSpacing: "-0.03em",
      textTransform: "uppercase",
      color: "var(--paper-50)",
      marginTop: 10
    }
  }, "Off-season", /*#__PURE__*/React.createElement("br", null), "strength"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--grey-300)",
      marginTop: 12
    }
  }, "12 WEEKS \xB7 4 DAYS/WK \xB7 $249"))));
}

/* Neon club title — the Mom's Club treatment: display + script, yellow glow on ink. */
function NeonClubTitle() {
  return /*#__PURE__*/React.createElement(Square, {
    style: {
      background: "radial-gradient(120% 90% at 50% 10%, #2B2B31 0%, #0D0D0F 70%)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: 52,
      letterSpacing: "-0.02em",
      textTransform: "uppercase",
      color: "#FF8FA8",
      textShadow: "var(--glow-pink)"
    }
  }, "Mom\u2019s"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-script)",
      fontSize: 82,
      lineHeight: 0.9,
      color: "#FFF6B0",
      textShadow: "var(--glow-yellow)",
      marginTop: -4
    }
  }, "Club"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--grey-400)",
      marginTop: 20,
      whiteSpace: "nowrap"
    }
  }, "Tuesdays \xB7 9:15 AM \xB7 35 min")), /*#__PURE__*/React.createElement(Logo, {
    variant: "swirl-paper-pink",
    size: 34,
    basePath: "../../assets/logos",
    style: {
      position: "absolute",
      bottom: 18,
      right: 18,
      opacity: 0.85
    }
  }));
}

/* Quote card — paper, pink rule, no photo. */
function QuoteCard() {
  return /*#__PURE__*/React.createElement(Square, {
    style: {
      background: "var(--paper-50)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      padding: 30,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      borderTop: "var(--rule-accent)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 38,
      lineHeight: 1.04,
      letterSpacing: "-0.02em",
      color: "var(--ink-900)"
    }
  }, "Nothing changes if nothing changes."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      whiteSpace: "nowrap"
    }
  }, "NS Coaching"), /*#__PURE__*/React.createElement(Logo, {
    variant: "swirl-ink-pink",
    size: 38,
    basePath: "../../assets/logos"
  }))));
}
function SocialSheet() {
  const label = t => /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.26em",
      textTransform: "uppercase",
      color: "var(--text-faint)",
      marginTop: 10
    }
  }, t);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      padding: 28,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ChallengeAnnounce, null), label("Challenge announce")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ProgrammePromo, null), label("Programme promo")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(NeonClubTitle, null), label("Neon club title")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(QuoteCard, null), label("Quote card")));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(SocialSheet, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/social/Templates.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/App.jsx
try { (() => {
const {
  Dialog,
  Button,
  Badge,
  Toast
} = window.NSDesignSystem_14b176;
const {
  SiteHeader,
  SiteFooter,
  HomePage,
  ProgrammesPage,
  EventsPage,
  ApplyPage
} = window;
function App() {
  const [page, setPage] = React.useState("home");
  const [programme, setProgramme] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const go = p => {
    setPage(p);
    window.scrollTo(0, 0);
  };
  const fireToast = (title, body) => {
    setToast({
      title,
      body
    });
    window.setTimeout(() => setToast(null), 4200);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteHeader, {
    page: page,
    onNavigate: go
  }), page === "home" ? /*#__PURE__*/React.createElement(HomePage, {
    onNavigate: go,
    onOpen: setProgramme
  }) : null, page === "programmes" ? /*#__PURE__*/React.createElement(ProgrammesPage, {
    onOpen: setProgramme,
    onNavigate: go
  }) : null, page === "events" ? /*#__PURE__*/React.createElement(EventsPage, {
    onToast: fireToast
  }) : null, page === "apply" ? /*#__PURE__*/React.createElement(ApplyPage, {
    onToast: fireToast
  }) : null, /*#__PURE__*/React.createElement(SiteFooter, {
    onNavigate: go
  }), /*#__PURE__*/React.createElement(Dialog, {
    open: Boolean(programme),
    title: programme ? programme.name : "",
    onClose: () => setProgramme(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setProgramme(null)
    }, "Close"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setProgramme(null);
        go("apply");
      }
    }, "Apply for this"))
  }, programme ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: programme.photo,
    alt: "",
    style: {
      width: "100%",
      height: 180,
      objectFit: "cover",
      borderRadius: "var(--radius-media)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, programme.spots), /*#__PURE__*/React.createElement(Badge, {
    tone: "outline"
  }, programme.weeks, " weeks"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, programme.price)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.6,
      color: "var(--text-muted)"
    }
  }, programme.blurb)) : null), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      right: 24,
      bottom: 24,
      zIndex: 80
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    title: toast.title,
    onDismiss: () => setToast(null)
  }, toast.body)) : null);
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomePage.jsx
try { (() => {
const {
  Button,
  Card,
  Badge,
  Icon,
  Tag
} = window.NSDesignSystem_14b176;
const {
  Section,
  Eyebrow,
  Display
} = window;
const PROGRAMMES = [{
  id: "offseason",
  name: "Off-season strength",
  weeks: 12,
  price: "$249/mo",
  tag: "Group",
  photo: "../../assets/photography/gym-dumbbell-rack.jpeg",
  blurb: "Four sessions a week, real hypertrophy work, a check-in every Sunday. Built so you can still do it in week ten.",
  spots: "4 spots left"
}, {
  id: "prep",
  name: "Show prep, 1:1",
  weeks: 20,
  price: "$495/mo",
  tag: "1:1",
  photo: "../../assets/photography/stage-teal-suit-front.jpeg",
  blurb: "Peak week, posing, suit, tan. I hold a pro card, so I know what I'm asking you to do.",
  spots: "2 spots left"
}, {
  id: "moms",
  name: "Mom's Club",
  weeks: 8,
  price: "$99/mo",
  tag: "Group",
  photo: "../../assets/photography/coach-barn-door-seated.jpeg",
  blurb: "Thirty-five minutes, between drop-off and everything else. Show up with what you can.",
  spots: "Open"
}];
function Hero({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      minHeight: 640,
      display: "flex",
      alignItems: "flex-end",
      background: "var(--ink-900)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/photography/gym-mirror-selfie.jpeg",
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center 18%",
      opacity: 0.62
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(90deg,rgb(13 13 15 / .92) 0%,rgb(13 13 15 / .6) 55%,rgb(13 13 15 / .25) 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "0 var(--gutter-lg) 72px",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "invert"
  }, "Strength and habit coaching"), /*#__PURE__*/React.createElement(Display, {
    invert: true,
    size: 84,
    style: {
      marginTop: 14,
      maxWidth: 900
    }
  }, "Nothing changes", /*#__PURE__*/React.createElement("br", null), "if nothing changes"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 19,
      lineHeight: 1.55,
      color: "var(--grey-300)",
      maxWidth: 520,
      marginTop: 22
    }
  }, "You don't need more motivation. You need a weekly check-in and someone who won't let you off the hook."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      marginTop: 32,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: () => onNavigate("apply")
  }, "Start Your Check-In"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "outline-invert",
    onClick: () => onNavigate("programmes")
  }, "See how coaching works")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-12)",
      marginTop: 56,
      flexWrap: "wrap"
    }
  }, [["5th", "degree black belt"], ["WNBF", "pro bodybuilder"], ["Weekly", "check-in, no skipping"]].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 700,
      fontSize: 34,
      color: "var(--paper-50)",
      letterSpacing: "-0.015em"
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "var(--tracking-widest)",
      textTransform: "uppercase",
      color: "var(--grey-500)",
      marginTop: 4
    }
  }, l))))));
}
function ProgrammeCards({
  onOpen,
  items = PROGRAMMES
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: "var(--space-6)"
    }
  }, items.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.id,
    media: p.photo,
    mediaHeight: 200,
    onClick: () => onOpen(p)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: p.spots === "Open" ? "neutral" : "accent"
  }, p.spots), /*#__PURE__*/React.createElement(Badge, {
    tone: "outline"
  }, p.weeks, " weeks")), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: "var(--text-xl)",
      marginTop: 12
    }
  }, p.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.55,
      color: "var(--text-muted)",
      marginTop: 8
    }
  }, p.blurb), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 18,
      paddingTop: 14,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 700,
      fontSize: 16,
      color: "var(--text-strong)"
    }
  }, p.price), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--font-body)",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "var(--tracking-wide)",
      textTransform: "uppercase",
      color: "var(--text-accent)"
    }
  }, "Details ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 14
  }))))));
}
function CoachBlock() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "0.9fr 1.1fr",
      gap: "var(--space-16)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/photography/coach-portrait-arms-crossed.jpeg",
    alt: "",
    style: {
      width: "100%",
      borderRadius: "var(--radius-card)",
      objectFit: "cover",
      aspectRatio: "3/4"
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Your coach"), /*#__PURE__*/React.createElement(Display, {
    size: 52,
    style: {
      marginTop: 14
    }
  }, "I've done the work", /*#__PURE__*/React.createElement("br", null), "I'm asking you to do"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 18,
      lineHeight: 1.6,
      color: "var(--text-body)",
      marginTop: 20
    }
  }, "Fifth degree black belt. Taekwon-Do world champion. WNBF pro bodybuilder. None of that happened by accident, and none of it happened fast. I also coach mothers with 40 minutes, no babysitter and four hours of sleep. That plan looks nothing like mine, and it still works, because the quiet work nobody sees is the same work either way. Here's what you get from me: a plan you can actually run, and someone who notices when you go quiet."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      marginTop: 22,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "5th degree black belt"), /*#__PURE__*/React.createElement(Tag, null, "Taekwon-Do world champion"), /*#__PURE__*/React.createElement(Tag, null, "WNBF pro bodybuilder"), /*#__PURE__*/React.createElement(Tag, null, "Habit coach"))));
}
function EventStrip({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-10)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "invert"
  }, "Events"), /*#__PURE__*/React.createElement(Display, {
    invert: true,
    size: 52,
    style: {
      marginTop: 14
    }
  }, "Are you willing", /*#__PURE__*/React.createElement("br", null), "to do the work?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 18,
      lineHeight: 1.6,
      color: "var(--grey-300)",
      marginTop: 18,
      maxWidth: 460
    }
  }, "The Misogi Challenge is twelve hours of work nobody chooses alone. Mom's Club is thirty-five minutes and a lot of laughing. Both are open to everyone, and both ask the same question."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "highlight",
    onClick: () => onNavigate("events")
  }, "See what's coming"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/event-graphics/misogi-challenge-flyer.png",
    alt: "Misogi Challenge",
    style: {
      width: "50%",
      borderRadius: "var(--radius-media)",
      boxShadow: "var(--shadow-4)"
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/event-graphics/misogi-2-badge.png",
    alt: "Misogi 2.0",
    style: {
      width: "50%",
      borderRadius: "var(--radius-media)",
      boxShadow: "var(--shadow-4)",
      alignSelf: "flex-end"
    }
  })));
}
const QUOTES = [{
  q: "I stopped restarting. Fourteen months straight now. That has never happened before, not once.",
  n: "Kara M.",
  p: "Off-season strength"
}, {
  q: "I went quiet in week nine. She noticed and texted me. That message is the reason I made it to the stage.",
  n: "Danielle R.",
  p: "Show prep 1:1"
}, {
  q: "Thirty-five minutes, three mornings a week. It fits my life, so I actually do it.",
  n: "Steph L.",
  p: "Mom's Club"
}];
function Testimonials() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: "var(--space-6)"
    }
  }, QUOTES.map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.n,
    tone: "flat",
    padding: "lg"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "quote",
    size: 22,
    color: "var(--accent)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 17,
      lineHeight: 1.5,
      color: "var(--text-strong)",
      marginTop: 12
    }
  }, t.q), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      fontFamily: "var(--font-body)",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "var(--tracking-wide)",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, t.n, " \xB7 ", t.p))));
}
function CtaBand({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--grad-flyer-diag)",
      padding: "72px var(--gutter-lg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "var(--space-10)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Display, {
    size: 56,
    style: {
      color: "var(--ink-900)"
    }
  }, "March coaching", /*#__PURE__*/React.createElement("br", null), "opens Monday"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 18,
      color: "rgb(13 13 15 / .72)",
      marginTop: 14
    }
  }, "Six spots. They go when they go.")), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "ink",
    onClick: () => onNavigate("apply")
  }, "Start Your Check-In")));
}
function HomePage({
  onNavigate,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Hero, {
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(Eyebrow, null, "Coaching"), /*#__PURE__*/React.createElement(Display, {
    size: 52,
    style: {
      marginTop: 14,
      marginBottom: 36
    }
  }, "Show up with", /*#__PURE__*/React.createElement("br", null), "what you can"), /*#__PURE__*/React.createElement(ProgrammeCards, {
    onOpen: onOpen
  })), /*#__PURE__*/React.createElement(Section, {
    tone: "sunken"
  }, /*#__PURE__*/React.createElement(CoachBlock, null)), /*#__PURE__*/React.createElement(Section, {
    tone: "ink"
  }, /*#__PURE__*/React.createElement(EventStrip, {
    onNavigate: onNavigate
  })), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(Eyebrow, null, "Real people, real numbers"), /*#__PURE__*/React.createElement(Display, {
    size: 52,
    style: {
      marginTop: 14,
      marginBottom: 36
    }
  }, "The quiet work", /*#__PURE__*/React.createElement("br", null), "nobody sees"), /*#__PURE__*/React.createElement(Testimonials, null)), /*#__PURE__*/React.createElement(CtaBand, {
    onNavigate: onNavigate
  }));
}
Object.assign(window, {
  HomePage,
  ProgrammeCards,
  CoachBlock,
  EventStrip,
  Testimonials,
  CtaBand,
  Hero,
  PROGRAMMES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/InnerPages.jsx
try { (() => {
const {
  Button,
  Card,
  Badge,
  Icon,
  Tabs,
  Input,
  Select,
  Checkbox,
  Switch,
  Dialog,
  Toast,
  Tooltip,
  IconButton
} = window.NSDesignSystem_14b176;
const {
  Section,
  Eyebrow,
  Display,
  ProgrammeCards,
  PROGRAMMES
} = window;
function ProgrammesPage({
  onOpen,
  onNavigate
}) {
  const [tab, setTab] = React.useState("all");
  const items = tab === "all" ? PROGRAMMES : PROGRAMMES.filter(p => tab === "group" ? p.tag === "Group" : p.tag === "1:1");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, {
    pad: 64,
    tone: "sunken"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Coaching"), /*#__PURE__*/React.createElement(Display, {
    size: 64,
    style: {
      marginTop: 14
    }
  }, "Three ways in"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 19,
      lineHeight: 1.55,
      color: "var(--text-muted)",
      maxWidth: 600,
      marginTop: 18
    }
  }, "Every option includes the same weekly check-in. The difference is how much of my calendar you get. If it matters, it matters enough to put on the schedule.")), /*#__PURE__*/React.createElement(Section, {
    pad: 56
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      id: "all",
      label: "All",
      count: PROGRAMMES.length
    }, {
      id: "group",
      label: "Group"
    }, {
      id: "1:1",
      label: "One to one"
    }]
  })), /*#__PURE__*/React.createElement(ProgrammeCards, {
    items: items,
    onOpen: onOpen
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: "var(--space-6)"
    }
  }, [["calendar-check", "Weekly check-in", "A video reply every Sunday. I don't skip it, and I won't let you off the hook."], ["dumbbell", "Real hypertrophy work", "Sets, reps, RPE, and a demo video for every lift."], ["apple", "Food, not a diet", "Targets you can hit at a restaurant on a Friday."], ["message-circle", "Text access", "For the 9pm questions. Answered by me, not an assistant."]].map(([icon, title, body]) => /*#__PURE__*/React.createElement("div", {
    key: title
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 22,
    color: "var(--accent)"
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: "var(--text-md)",
      marginTop: 10
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.55,
      color: "var(--text-muted)",
      marginTop: 6
    }
  }, body))))), /*#__PURE__*/React.createElement(Section, {
    tone: "ink",
    pad: 64
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "var(--space-8)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Display, {
    invert: true,
    size: 44
  }, "Not sure which one?"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline-invert",
    size: "lg",
    onClick: () => onNavigate("apply")
  }, "Send me your situation"))));
}
const EVENTS = [{
  id: "misogi3",
  name: "Women's Misogi 3.0",
  date: "June 21, 2026",
  time: "6 AM – 6 PM",
  art: "../../assets/event-graphics/misogi-2-badge.png",
  blurb: "Twelve hours. One thing you're sure you can't do. Forty women finding out otherwise.",
  spots: "18 of 40 taken",
  price: "$65"
}, {
  id: "misogi-mar",
  name: "All Womens Misogi Challenge",
  date: "March 9, 2026",
  time: "10 AM – 10 PM",
  art: "../../assets/event-graphics/misogi-challenge-flyer.png",
  blurb: "The original. Sandbags, a long walk, and the part in hour eight where it gets funny again.",
  spots: "Sold out",
  price: "$65"
}, {
  id: "moms",
  name: "Mom's Club, spring block",
  date: "Tuesdays from April 7",
  time: "9:15 AM",
  art: "../../assets/event-graphics/moms-club-neon.png",
  blurb: "Thirty-five minutes, kids welcome in the corner, nobody cares what you look like. Show up with what you can.",
  spots: "Open",
  price: "$99/mo"
}];
function EventsPage({
  onToast
}) {
  const [open, setOpen] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, {
    pad: 64,
    tone: "ink"
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "invert"
  }, "Events"), /*#__PURE__*/React.createElement(Display, {
    invert: true,
    size: 64,
    style: {
      marginTop: 14
    }
  }, "Show up. Find out.")), /*#__PURE__*/React.createElement(Section, {
    pad: 56
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-6)"
    }
  }, EVENTS.map(e => /*#__PURE__*/React.createElement(Card, {
    key: e.id,
    padding: "none"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "220px 1fr auto",
      gap: "var(--space-8)",
      alignItems: "center",
      padding: "var(--pad-card)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: e.art,
    alt: "",
    style: {
      width: "100%",
      height: 170,
      objectFit: "cover",
      borderRadius: "var(--radius-media)"
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: e.spots === "Sold out" ? "neutral" : "accent"
  }, e.spots), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, e.date.toUpperCase(), " \xB7 ", e.time)), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-serif-display)",
      fontWeight: 700,
      fontSize: 28,
      letterSpacing: "var(--tracking-wide)",
      textTransform: "uppercase",
      marginTop: 12
    }
  }, e.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.55,
      color: "var(--text-muted)",
      marginTop: 10,
      maxWidth: 520
    }
  }, e.blurb)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "stretch",
      minWidth: 150
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 700,
      fontSize: 20,
      textAlign: "center",
      color: "var(--text-strong)"
    }
  }, e.price), /*#__PURE__*/React.createElement(Button, {
    disabled: e.spots === "Sold out",
    onClick: () => setOpen(e)
  }, e.spots === "Sold out" ? "Sold out" : "Save my spot"), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Add to calendar",
    placement: "left"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Add to calendar",
    variant: "outline",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar-plus",
    size: 16
  }))))))))), /*#__PURE__*/React.createElement(Dialog, {
    open: Boolean(open),
    title: open ? open.name : "",
    onClose: () => setOpen(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setOpen(null)
    }, "Not now"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setOpen(null);
        onToast("You're in", "Check your email for the kit list.");
      }
    }, "Lock it in"))
  }, open ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.55,
      color: "var(--text-muted)"
    }
  }, open.blurb), /*#__PURE__*/React.createElement(Input, {
    label: "Full name",
    placeholder: "First and last"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Have you done one before?",
    options: ["First one", "Second", "Third or more"]
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "I understand this is twelve hours long",
    hint: "It's longer than you think. That's the point."
  })) : null));
}
function ApplyPage({
  onToast
}) {
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement(Section, {
    pad: 64
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.2fr 0.8fr",
      gap: "var(--space-16)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Apply"), /*#__PURE__*/React.createElement(Display, {
    size: 56,
    style: {
      marginTop: 14
    }
  }, "Tell me where", /*#__PURE__*/React.createElement("br", null), "you actually are"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 18,
      lineHeight: 1.6,
      color: "var(--text-muted)",
      marginTop: 18,
      maxWidth: 520
    }
  }, "Not where you think you should be. Sleep, schedule, injuries, the last three programmes you quit. I read every one of these myself and reply within two days."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-4)",
      marginTop: 34
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "First name",
    placeholder: "Nikki",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Last name",
    placeholder: "S.",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    placeholder: "you@email.com",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Phone",
    placeholder: "(555) 019-4432"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Programme",
    options: ["Off-season strength", "Show prep 1:1", "Mom's Club", "Not sure yet"]
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Training age",
    options: ["Brand new", "Under a year", "1–3 years", "3+ years"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "What's getting in the way?",
    as: "textarea",
    rows: 5,
    placeholder: "Be honest. This is the part that tells me what to change first."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Text me session reminders",
    hint: "Two a week. That's it.",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "I have a competition date in mind"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      display: "flex",
      gap: "var(--space-3)",
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: () => {
      setSent(true);
      onToast("Application sent", "I'll reply within two days.");
    }
  }, "Start Your Check-In"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 13,
      color: "var(--text-faint)"
    }
  }, "No payment today.")), sent ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    title: "Application sent"
  }, "The reply comes from me, not an assistant.")) : null), /*#__PURE__*/React.createElement(Card, {
    tone: "invert",
    padding: "lg"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "highlight"
  }, "March cohort"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: "var(--text-xl)",
      color: "var(--paper-50)",
      marginTop: 14
    }
  }, "What happens next"), /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: "16px 0 0",
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, [["01", "I read it and reply in two days."], ["02", "Fifteen minute call. No pitch, no pressure."], ["03", "Your plan and your first check-in date, by Monday."]].map(([n, t]) => /*#__PURE__*/React.createElement("li", {
    key: n,
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 700,
      fontSize: 13,
      color: "var(--pink-300)"
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1.5,
      color: "var(--grey-300)"
    }
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      paddingTop: 18,
      borderTop: "1px solid var(--border-invert)",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Send me the free week first",
    invert: true,
    labelPosition: "start"
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Add me to the events list",
    invert: true,
    defaultChecked: true,
    labelPosition: "start"
  })))));
}
Object.assign(window, {
  ProgrammesPage,
  EventsPage,
  ApplyPage,
  EVENTS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/InnerPages.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteChrome.jsx
try { (() => {
const {
  Logo,
  Button,
  Icon
} = window.NSDesignSystem_14b176;
const NAV = [{
  id: "home",
  label: "Home"
}, {
  id: "programmes",
  label: "Coaching"
}, {
  id: "events",
  label: "Events"
}, {
  id: "apply",
  label: "Apply"
}];
function SiteHeader({
  page,
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 30,
      height: "var(--nav-height)",
      background: "var(--ink-900)",
      borderBottom: "1px solid var(--border-invert)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "0 var(--gutter-lg)",
      height: "100%",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-10)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate("home"),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "none",
      border: 0,
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "swirl-paper-pink",
    size: 38,
    basePath: "../../assets/logos"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: 19,
      letterSpacing: "0.02em",
      color: "var(--paper-50)"
    }
  }, "NS")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: "var(--space-8)",
      flex: 1
    }
  }, NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    onClick: () => onNavigate(n.id),
    style: {
      background: "none",
      border: 0,
      padding: "6px 0",
      cursor: "pointer",
      fontFamily: "var(--font-body)",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "var(--tracking-wide)",
      textTransform: "uppercase",
      color: page === n.id ? "var(--paper-50)" : "var(--grey-400)",
      borderBottom: page === n.id ? "2px solid var(--accent)" : "2px solid transparent"
    }
  }, n.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--grey-400)",
      whiteSpace: "nowrap"
    }
  }, "NEXT START \xB7 MAR 3"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "highlight",
    onClick: () => onNavigate("apply")
  }, "Start your check-in"))));
}
function SiteFooter({
  onNavigate
}) {
  const col = (title, links) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "var(--tracking-widest)",
      textTransform: "uppercase",
      color: "var(--grey-500)"
    }
  }, title), links.map(l => /*#__PURE__*/React.createElement("button", {
    key: l,
    onClick: () => onNavigate("programmes"),
    style: {
      background: "none",
      border: 0,
      padding: 0,
      textAlign: "left",
      cursor: "pointer",
      fontFamily: "var(--font-body)",
      fontSize: 14,
      color: "var(--grey-300)"
    }
  }, l)));
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--ink-900)",
      padding: "64px var(--gutter-lg) 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
      gap: "var(--space-10)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Logo, {
    variant: "lockup-on-ink",
    size: 72,
    basePath: "../../assets/logos"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 15,
      lineHeight: 1.55,
      color: "var(--grey-400)",
      marginTop: 16,
      maxWidth: 280
    }
  }, "Strength and habit coaching for women with full lives. Real accountability, a tested process, no hype.")), col("Coaching", ["Off-season strength", "Show prep", "Group training", "Nutrition"]), col("Events", ["Misogi Challenge", "Mom's Club", "Team meet-ups"]), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "var(--tracking-widest)",
      textTransform: "uppercase",
      color: "var(--grey-500)"
    }
  }, "Follow"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, ["instagram", "facebook", "youtube", "mail"].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      border: "1px solid var(--border-invert)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--grey-300)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i,
    size: 17
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "40px auto 0",
      paddingTop: 20,
      borderTop: "1px solid var(--border-invert)",
      display: "flex",
      justifyContent: "space-between",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--grey-500)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 NS COACHING"), /*#__PURE__*/React.createElement("span", null, "BUILT TO LAST")));
}
function Section({
  children,
  tone = "paper",
  pad = 96,
  style
}) {
  const bg = tone === "ink" ? "var(--ink-900)" : tone === "sunken" ? "var(--surface-sunken)" : "var(--bg-page)";
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: bg,
      padding: `${pad}px var(--gutter-lg)`,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto"
    }
  }, children));
}
function Eyebrow({
  children,
  tone = "accent"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "var(--tracking-widest)",
      textTransform: "uppercase",
      color: tone === "accent" ? "var(--text-accent)" : "var(--pink-300)"
    }
  }, children);
}
function Display({
  children,
  size = 68,
  invert = false,
  style
}) {
  return /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: size,
      lineHeight: 0.96,
      letterSpacing: "var(--tracking-tightest)",
      textTransform: "uppercase",
      color: invert ? "var(--paper-50)" : "var(--text-strong)",
      margin: 0,
      ...style
    }
  }, children);
}
Object.assign(window, {
  SiteHeader,
  SiteFooter,
  Section,
  Eyebrow,
  Display,
  NAV
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteChrome.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
