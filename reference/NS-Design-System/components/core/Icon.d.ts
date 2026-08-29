import React from "react";

/** Icon glyph. Requires the Iconify script: https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js */
export interface IconProps {
  /** Lucide icon name, e.g. `dumbbell`, `arrow-right`, `flame`. */
  name: string;
  /** Pixel box. 20 for UI, 24 for nav, 16 inside dense rows. */
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** Accessible label. Omit for decorative icons (renders aria-hidden). */
  label?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
