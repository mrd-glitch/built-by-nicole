import React from "react";

/** Square-cornered filter / attribute chip. Unlike Badge it can be selected or removed. */
export interface TagProps {
  selected?: boolean;
  /** Makes the tag a toggle button. */
  onSelect?: (e: React.MouseEvent) => void;
  /** Adds a trailing remove control. */
  onRemove?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}
export declare function Tag(props: TagProps): JSX.Element;
