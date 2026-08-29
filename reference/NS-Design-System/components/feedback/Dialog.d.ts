import React from "react";

/** Centred modal over a 72% ink scrim with a 3px blur. Rises 16px on open. */
export interface DialogProps {
  open?: boolean;
  title?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  invert?: boolean;
  /** Renders a close ✕, closes on scrim click and Escape. */
  onClose?: () => void;
  /** Right-aligned action row, usually two `<Button>`s. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
