import React from "react";

/**
 * NS Button.
 */
export interface ButtonProps {
  /** Visual treatment. `primary` = hot pink, `highlight` = brand yellow, `ink` = near-black. */
  variant?: "primary" | "highlight" | "ink" | "outline" | "outline-invert" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Fill the container width. */
  block?: boolean;
  /** Render as an anchor instead of a button. */
  href?: string;
  disabled?: boolean;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
