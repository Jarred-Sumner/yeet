import chroma from "chroma-js";

export const COLORS = {
  background: "#070216",
  primary: "#3734EA",
  primaryDark: "#262499",
  primaryAlt: "#6E6CFC",
  input: chroma.blend("rgba(196, 196, 196, 0.2)", "#262499", "multiply").css(),
  mutedLabel: "rgba(255,255,255,0.6)",
  success: "#01B11E",
  warn: "#B15501",
  error: "#FF7575",
  secondaryOpacity: "rgba(26, 145, 255, 0.9)",
  secondary: "#1A91FF",
  muted: "#A4A4A4",
  white: "#fff",
  black: "#000"
};

export const SPACING = {
  normal: 16,
  half: 8,
  double: 32
};
