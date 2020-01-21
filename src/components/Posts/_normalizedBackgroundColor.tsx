import chroma from "chroma-js";
import { memoize } from "lodash";

const _normalizedBackgroundColor = (color: string) =>
  chroma(color)
    .alpha(0.15)
    .css();
export const normalizeBackgroundColor = memoize(_normalizedBackgroundColor);
