import React from "react";

/**
 * Content container: 14px radius, hairline border, tight ink-tinted shadow.
 */
export interface CardProps {
  /** `accent` uses the brand pink gradient lifted from the event flyers. */
  tone?: "default" | "invert" | "accent" | "highlight" | "flat";
  padding?: "none" | "md" | "lg";
  /** Adds hover lift; implied when `onClick` is set. */
  interactive?: boolean;
  /** Image URL rendered flush at the top of the card. */
  media?: string;
  mediaHeight?: number;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
