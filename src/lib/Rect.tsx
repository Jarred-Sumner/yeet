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
  dimensions: DimensionsRect
): DimensionsRect => {
  return {
    width,
    height: PixelRatio.roundToNearestPixel(
      (width / dimensions.width) * dimensions.height
    )
  };
};
