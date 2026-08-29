import React from "react";

/** Square 22px checkbox, 2px ink border, pink fill when checked. */
export interface CheckboxProps {
  label?: React.ReactNode;
  /** Secondary line under the label. */
  hint?: string;
  invert?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
export declare function Radio(props: CheckboxProps): JSX.Element;
