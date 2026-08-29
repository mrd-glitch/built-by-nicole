import React from "react";
import type { ButtonProps } from "./Button";

/** Circular icon-only action. Always pass `label`. */
export interface IconButtonProps extends Omit<ButtonProps, "block" | "iconStart" | "iconEnd"> {
  /** Accessible name — required, the button has no visible text. */
  label: string;
  /** A single `<Icon />`. */
  children?: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
