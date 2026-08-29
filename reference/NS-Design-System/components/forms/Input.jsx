import React from "react";

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

export function useFieldStyles() {
  React.useEffect(() => {
    if (document.getElementById("ns-field-css")) return;
    const el = document.createElement("style");
    el.id = "ns-field-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

export function Input({
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
  const controlCls = [
    "ns-field__control",
    invert ? "ns-field__control--invert" : "",
    error ? "ns-field__control--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <label className="ns-field" htmlFor={fid}>
      {label ? (
        <span className={`ns-field__label${invert ? " ns-field__label--invert" : ""}`}>
          {label}
          {required ? <span className="ns-field__req"> *</span> : null}
        </span>
      ) : null}
      <span className="ns-field__wrap">
        <Comp
          id={fid}
          className={controlCls}
          rows={as === "textarea" ? rows : undefined}
          aria-invalid={error ? true : undefined}
          style={as === "textarea" ? { resize: "vertical", lineHeight: "var(--leading-body)" } : undefined}
          {...rest}
        />
        {adornment ? <span className="ns-field__adorn">{adornment}</span> : null}
      </span>
      {error ? (
        <span className="ns-field__hint ns-field__hint--error">{error}</span>
      ) : hint ? (
        <span className="ns-field__hint">{hint}</span>
      ) : null}
    </label>
  );
}
