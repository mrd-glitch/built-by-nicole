import React from "react";

/** Small uppercase status pill. */
export interface BadgeProps {
  tone?: "accent" | "highlight" | "ink" | "soft" | "neutral" | "success" | "outline" | "outline-invert";
  /** Leading status dot in the current text colour. */
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
