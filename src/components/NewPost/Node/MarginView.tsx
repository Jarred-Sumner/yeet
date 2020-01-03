import * as React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../../../lib/styles";
import Animated from "react-native-reanimated";
import { FocusType } from "../../../lib/buildPost";

const SPACING = 10;
const backgroundColor = COLORS.secondary;
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
  Top: ({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.top, { opacity }]}
    />
  ),
  Bottom: ({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.bottom, { opacity }]}
    />
  ),
  Left: ({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.left, { opacity }]}
    />
  ),
  Right: ({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.right, { opacity }]}
    />
  ),
  Center: ({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.center, { opacity }]}
    />
  ),
  Middle: ({ opacity }) => (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      pointerEvents="none"
      style={[styles.middle, { opacity }]}
    />
  )
};

export const MarginView = ({
  focusTypeValue,
  x,
  width,
  scale,
  rotate,
  velocityX,
  velocityY,
  contentViewRef,
  focusType,
  y,
  height,
  bottom,
  minY = 10,
  minX = 10
}) => {
  const isVisible = focusType === FocusType.panning;
  return (
    <Animated.View
      needsOffscreenAlphaCompositing={isVisible}
      renderToHardwareTextureAndroid={isVisible}
      shouldRasterizeIOS={isVisible}
      style={{
        height: bottom,
        width: "100%",
        opacity: isVisible ? 0.5 : 0,
        position: "absolute",
        zIndex: -1
      }}
      pointerEvents="none"
    >
      <Lines.Top opacity={1} />
      <Lines.Bottom opacity={1} />
      <Lines.Left opacity={1} />
      <Lines.Right opacity={1} />
      <Lines.Middle opacity={1} />

      <Lines.Center opacity={1} />
    </Animated.View>
  );
};
