import React from "react";
import { useFieldStyles } from "./Input.jsx";

export function Select({ label, hint, error, required = false, invert = false, options = [], className = "", id, children, ...rest }) {
  useFieldStyles();
  const uid = React.useId();
  const fid = id || uid;
  return (
    <label className="ns-field" htmlFor={fid}>
      {label ? (
        <span className={`ns-field__label${invert ? " ns-field__label--invert" : ""}`}>
          {label}
          {required ? <span className="ns-field__req"> *</span> : null}
        </span>
      ) : null}
      <span className="ns-field__wrap">
        <select
          id={fid}
          className={["ns-field__control", invert ? "ns-field__control--invert" : "", error ? "ns-field__control--error" : "", className]
            .filter(Boolean)
            .join(" ")}
          style={{ appearance: "none", paddingRight: 38, cursor: "pointer" }}
          {...rest}
        >
          {children ||
            options.map((o) => {
              const value = typeof o === "string" ? o : o.value;
              const text = typeof o === "string" ? o : o.label;
              return (
                <option key={value} value={value}>
                  {text}
                </option>
              );
            })}
        </select>
        <span className="ns-field__adorn" aria-hidden="true">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        </span>
      </span>
      {error ? <span className="ns-field__hint ns-field__hint--error">{error}</span> : hint ? <span className="ns-field__hint">{hint}</span> : null}
    </label>
  );
}
