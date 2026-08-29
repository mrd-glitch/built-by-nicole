import React from "react";

/** Transient ink notification. Status is carried by a small coloured dot, never a coloured border. */
export interface ToastProps {
  tone?: "accent" | "success" | "warning" | "danger";
  title?: React.ReactNode;
  /** Supporting line. */
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}
export declare function Toast(props: ToastProps): JSX.Element;
