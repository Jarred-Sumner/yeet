import { pointBox as isPointInside } from "intersects";
export type BoundsRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const totalX = (rect: BoundsRect) => {
  return rect.x + rect.width;
};

export const totalY = (rect: BoundsRect) => {
  return rect.y + rect.height;
};

export const isSameSize = (a: BoundsRect, b: BoundsRect) => {
  return totalX(a) === totalX(b) && totalY(a) === totalY(b);
};

export const isTapInside = (
  rect: BoundsRect,
  { x, y }: { x: number; y: number }
) => {
  return isPointInside(x, y, rect.x, rect.y, rect.width, rect.height);
};
