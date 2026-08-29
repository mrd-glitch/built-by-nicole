import React from "react";

/** The NS brush-ring mark. Square-aspect PNGs with transparency. */
export interface LogoProps {
  /**
   * `lockup-*` includes the NS letters; `swirl-*` is the ring alone.
   * Pick the one whose colours contrast with the background you place it on.
   */
  variant?:
    | "lockup-on-paper"
    | "lockup-on-ink"
    | "lockup-pink-leading"
    | "swirl-ink-pink"
    | "swirl-paper-pink"
    | "swirl-pink-paper";
  /** Rendered square size in px. Minimum 32 for the lockup, 24 for the ring. */
  size?: number;
  /** Path to the logo folder, relative to the page. */
  basePath?: string;
  style?: React.CSSProperties;
}
export declare function Logo(props: LogoProps): JSX.Element;
