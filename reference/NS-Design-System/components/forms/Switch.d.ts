import React from "react";

/** 46×26 pill toggle for instant-effect settings. */
export interface SwitchProps {
  label?: React.ReactNode;
  invert?: boolean;
  /** `start` pushes the label left and the track right — use inside settings rows. */
  labelPosition?: "start" | "end";
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}
export declare function Switch(props: SwitchProps): JSX.Element;
