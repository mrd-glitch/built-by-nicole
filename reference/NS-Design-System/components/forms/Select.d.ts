import React from "react";

/** Native select in the NS field shell. */
export interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  invert?: boolean;
  /** Strings, or `{value,label}` pairs. Ignored if you pass `<option>` children. */
  options?: Array<string | { value: string; label: string }>;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  id?: string;
  children?: React.ReactNode;
}
export declare function Select(props: SelectProps): JSX.Element;
