import React from "react";

const FILES = {
  "swirl-ink-pink": "swirl-ink-pink.png",
  "swirl-paper-pink": "swirl-paper-pink.png",
  "swirl-pink-paper": "swirl-pink-paper.png",
  "lockup-on-paper": "ns-lockup-ink-pink-on-paper.png",
  "lockup-on-ink": "ns-lockup-paper-pink-on-ink.png",
  "lockup-pink-leading": "ns-lockup-pink-leading-on-ink.png",
};

/** Renders a supplied NS brand mark. Never redraw the mark — always point at these files. */
export function Logo({ variant = "lockup-on-paper", size = 96, basePath = "assets/logos", style, ...rest }) {
  return (
    <img
      src={`${basePath}/${FILES[variant] || FILES["lockup-on-paper"]}`}
      alt="NS"
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size, objectFit: "contain", ...style }}
      {...rest}
    />
  );
}
