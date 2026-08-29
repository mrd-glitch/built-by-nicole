import React from "react";

/** Ink label on hover / focus. One short line, no rich content. */
export interface TooltipProps {
  label: string;
  placement?: "top" | "bottom" | "left" | "right";
  /** The trigger — usually an `IconButton`. */
  children: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
