import React from "react";

/** Lucide glyph via the Iconify web component. Substituted set — NS shipped no icon assets. */
export function Icon({ name, size = 20, strokeWidth = 2, color = "currentColor", label, style, ...rest }) {
  return React.createElement("iconify-icon", {
    icon: `lucide:${name}`,
    width: size,
    height: size,
    "aria-label": label,
    "aria-hidden": label ? undefined : "true",
    role: label ? "img" : undefined,
    style: { color, display: "inline-flex", flex: "none", "--iconify-stroke-width": strokeWidth, ...style },
    ...rest,
  });
}
