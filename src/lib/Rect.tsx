import { pointBox as isPointInside } from "intersects";
import { PixelRatio } from "react-native";
import { YeetImageRect } from "./imageSearch";
import fill from "aspect-fill";
import fit from "aspect-fit";

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
  point: { x: number; y: number }
) => {
  if (!rect || !point) {
    return false;
  }

  const { x, y } = point;

  return isPointInside(x, y, rect.x, rect.y, rect.width, rect.height);
};

export const scaleToWidth = (
  width: number,
  dimensions: Partial<BoundsRect>,
  roundToNearestPixel = PixelRatio.roundToNearestPixel
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
    height: (width / dimensions.width) * dimensions.height
  };
};

export const scaleToHeight = (
  height: number,
  dimensions: Partial<BoundsRect>,
  roundToNearestPixel = PixelRatio.roundToNearestPixel
): BoundsRect => {
  return {
    x:
      typeof dimensions.x === "number"
        ? (height / dimensions.height) * dimensions.x
        : 0,
    height,
    y:
      typeof dimensions.y === "number"
        ? (height / dimensions.height) * dimensions.y
        : 0,
    width: (height / dimensions.height) * dimensions.width
  };
};

export const scaleRectToWidth = (
  width: number,
  dimensions: Partial<BoundsRect>
): YeetImageRect => {
  const bounds = scaleToWidth(width, dimensions);

  return {
    ...bounds,
    maxX: bounds.width,
    maxY: bounds.height
  };
};

export const scaleRectToHeight = (
  height: number,
  dimensions: Partial<BoundsRect>
): YeetImageRect => {
  const bounds = scaleToHeight(height, dimensions);

  return {
    ...bounds,
    maxX: bounds.width,
    maxY: bounds.height
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

export const pcCoordsToPx = (
  { x, y }: { x: number; y; number },
  size: Partial<BoundsRect>
) => {
  return {
    x: PixelRatio.getPixelSizeForLayoutSize(x * size.width),
    y: PixelRatio.getPixelSizeForLayoutSize(y * size.height)
  };
};

export function intersectRect(r1: BoundsRect, r2: BoundsRect) {
  return !(
    r2.x > r1.width + r1.x ||
    r2.width + r2.x < r1.x ||
    r2.y > r1.height + r1.y ||
    r2.height + r2.y < r1.y
  );
}

export const scaleRectAspectFit = (
  parent: Partial<BoundsRect>,
  dimensions: Partial<BoundsRect>
) => {
  const { width, height, scale } = fit(
    dimensions.width,
    dimensions.height,
    parent.width,
    parent.height
  );

  return {
    x: 0,
    y: 0,
    width,
    height
  };
};

export const scaleRectAspectFill = (
  parent: Partial<BoundsRect>,
  dimensions: Partial<BoundsRect>
) => {
  const { width, height, scale } = fill(
    dimensions.width,
    dimensions.height,
    parent.width,
    parent.height
  );

  return {
    x: 0,
    y: 0,
    width,
    height
  };
};

export const scaleRectByFactor = (
  scale: number,
  bounds: BoundsRect
): BoundsRect => {
  const point = (typeof bounds.x === "number" ||
    typeof bounds.y === "number") && {
    x: (bounds.x || 0) * scale,
    y: (bounds.y || 0) * scale
  };

  const size = (typeof bounds.width === "number" ||
    typeof bounds.height === "number") && {
    width: bounds.width * scale,
    height: bounds.height * scale
  };

  return {
    ...point,
    ...size
  };
};
