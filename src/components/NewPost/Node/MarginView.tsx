import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { IS_SIMULATOR } from "../../../../config";
import { snapButtonValue } from "../../../lib/animations";
import { FocusType, POST_WIDTH } from "../../../lib/buildPost";
import { SnapDirection, PostBlockType } from "../../../lib/enums";
import { COLORS } from "../../../lib/styles";
import {
  IconCircleArrowDown,
  IconCircleArrowLeft,
  IconCircleArrowRight,
  IconCircleArrowUp
} from "../../Icon";
import { CAROUSEL_HEIGHT } from "../NewPostFormat";
import { BoundsRect } from "../../../lib/Rect";
import { Rectangle } from "../../../lib/Rectangle";
import { SnapGuides } from "./SnapGuides";

const SPACING = 16;
const backgroundColor = COLORS.primaryDark;
const SIZE = 2;

const styles = StyleSheet.create({
  top: {
    backgroundColor,
    position: "absolute",
    width: "100%",
    height: SIZE,
    top: SPACING,
    left: 0
  },
  bottom: {
    backgroundColor,
    position: "absolute",
    width: "100%",
    height: SIZE,
    bottom: SPACING,
    left: 0
  },
  right: {
    backgroundColor,
    position: "absolute",
    width: SIZE,
    height: "100%",
    top: 0,
    right: SPACING
  },
  left: {
    backgroundColor,
    position: "absolute",
    width: SIZE,
    height: "100%",
    top: 0,
    left: SPACING
  },
  center: {
    backgroundColor,
    position: "absolute",
    height: SIZE,
    width: "100%",
    top: "50%",
    transform: [{ translateY: SIZE * -0.5 }],
    left: 0,
    right: 0
  },
  middle: {
    backgroundColor,
    position: "absolute",
    width: SIZE,
    height: "100%",
    left: "50%",
    top: 0,
    bottom: 0,
    transform: [{ translateX: SIZE * -0.5 }]
  }
});

const Lines = {
  Top: React.memo(({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.top, { opacity }]}
    />
  )),
  Bottom: React.memo(({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.bottom, { opacity }]}
    />
  )),
  Left: React.memo(({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.left, { opacity }]}
    />
  )),
  Right: React.memo(({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.right, { opacity }]}
    />
  )),
  Center: React.memo(({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.center, { opacity }]}
    />
  )),
  Middle: React.memo(({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.middle, { opacity }]}
    />
  ))
};

export const MarginView = ({
  focusTypeValue,
  x,
  width,
  scale,
  isMovingValue,
  rotate = 0,
  currentScale,
  postBottom,
  onChangeSnapPoint,
  velocityX,
  // absoluteX: x,
  // absoluteY: y,
  type,
  frame,
  velocityY,
  contentViewRef,
  block,
  focusType,
  y,
  height,
  blocks,
  positions,
  snapPoint,
  bottom,
  minY = 10,
  minX = 10
}: {
  blocks: Array<PostBlockType>;
}) => {
  const isVisible = focusType === FocusType.panning;
  if (!isVisible) {
    return null;
  }

  return (
    <>
      <Animated.View
        // needsOffscreenAlphaCompositing={isVisible}
        // renderToHardwareTextureAndroid={isVisible}
        // shouldRasterizeIOS={isVisible}
        style={{
          height: bottom,
          width: "100%",
          position: "absolute",
          display: isVisible ? "flex" : "none",
          zIndex: -1
        }}
        pointerEvents="none"
      >
        {/* <Lines.Top opacity={1} />
      <Lines.Bottom opacity={1} />
      <Lines.Left opacity={1} />
      <Lines.Right opacity={1} />
      <Lines.Middle opacity={1} />

      <Lines.Center opacity={1} /> */}
      </Animated.View>
      {isVisible && frame && (
        <>
          <SnapGuides
            blocks={blocks}
            block={block}
            positions={positions}
            snapPoint={snapPoint}
            velocityX={velocityX}
            currentScale={currentScale}
            velocityY={velocityY}
            x={x}
            y={y}
            isMovingValue={isMovingValue}
            onChange={onChangeSnapPoint}
          />
        </>
      )}
    </>
  );
};
