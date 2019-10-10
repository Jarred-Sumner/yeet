import { pointBox as isPointInside } from "intersects";
import { PixelRatio } from "react-native";

export type DimensionsRect = {
  width: number;
  height: number;
};

export type BoundsRect = DimensionsRect & {
  x: number;
  y: number;
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

export const scaleToWidth = (
  width: number,
  dimensions: Partial<BoundsRect>
): BoundsRect => {
  return {
    x:
      typeof dimensions.x === "number"
        ? (width / dimensions.width) * dimensions.x
        : 0,
    width,
    y:
      typeof dimensions.y === "number"
        ? (width / dimensions.width) * dimensions.y
        : 0,
    height: PixelRatio.roundToNearestPixel(
      (width / dimensions.width) * dimensions.height
    )
  };
};

export const pxBoundsToPoint = (rect: Partial<BoundsRect>, ratio: number) => {
  const { width = 0, height = 0, x = 0, y = 0 } = rect;
  return {
    width: width / ratio,
    height: height / ratio,
    x: x / ratio,
    y: y / ratio
  };
};
