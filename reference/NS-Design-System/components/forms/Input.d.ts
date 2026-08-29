import React from "react";

/**
 * Labelled text field. Square corners (4px) — the pill shape belongs to buttons only.
 */
export interface InputProps {
  /** Uppercase eyebrow label above the control. */
  label?: string;
  /** Helper text under the control. Replaced by `error` when that is set. */
  hint?: string;
  error?: string;
  required?: boolean;
  /** Dark-background styling. */
  invert?: boolean;
  /** Trailing decorative node, e.g. a unit or an `<Icon />`. */
  adornment?: React.ReactNode;
  as?: "input" | "textarea";
  rows?: number;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  id?: string;
}
export declare function Input(props: InputProps): JSX.Element;
