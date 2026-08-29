import React from "react";

/**
 * Uppercase tab bar with a 3px pink active rule.
 * @startingPoint section="Navigation" subtitle="Tab bar, light and inverted" viewport="700x150"
 */
export interface TabItem {
  id: string;
  label: string;
  /** Optional leading `<Icon />`. */
  icon?: React.ReactNode;
  /** Optional mono-typeset count after the label. */
  count?: number;
}
export interface TabsProps {
  /** Tab list. Plain strings are accepted and used as both id and label. */
  items: Array<TabItem | string>;
  /** Active tab id. Defaults to the first item. */
  value?: string;
  onChange?: (id: string) => void;
  invert?: boolean;
  /** Stretch tabs to fill the row — mobile only. */
  fill?: boolean;
  className?: string;
}
export declare function Tabs(props: TabsProps): JSX.Element;
