import * as React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useLayout } from "react-native-hooks";
import { COLORS, SPACING } from "../../lib/styles";
import { IconButton } from "../Button";
import { IconDownload, IconSend, IconTrash } from "../Icon";
import { TapGestureHandler } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { interpolateColor } from "react-native-redash";
import { MAX_POST_HEIGHT } from "./NewPostFormat";
import { getInset } from "react-native-safe-area-view";
import euclideanDistance from "euclidean-distance";

const SCREEN_DIMENSIONS = Dimensions.get("screen");

const styles = StyleSheet.create({
  footerSide: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  footer: {
    flexDirection: "row",
    position: "absolute",
    paddingHorizontal: SPACING.double,
    paddingBottom: SPACING.normal,
    left: 0,
    right: 0,
    bottom: SPACING.normal,
    width: "100%",
    justifyContent: "space-between"
  },
  footerCenter: {
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingVertical: SPACING.half,
    bottom: 0,
    paddingBottom: SPACING.half
  }
});

const FooterButton = ({ Icon, onPress, color, size = 32 }) => {
  return (
    <IconButton
      size={size}
      Icon={Icon}
      color={color}
      type="fill"
      backgroundColor={COLORS.secondaryOpacity}
      onPress={onPress}
    />
  );
};

const NextButton = ({ onPress, waitFor }) => {
  return (
    <IconButton
      size={24}
      type="fill"
      onPress={onPress}
      Icon={IconSend}
      backgroundColor={COLORS.secondary}
    />
  );
};

export const EditorFooter = ({ onPressDownload, onPressSend, waitFor }) => (
  <View style={styles.footer}>
    <View style={[styles.footerSide]}>
      <IconButton
        onPress={onPressDownload}
        Icon={IconDownload}
        color="#fff"
        waitFor={waitFor}
        size={32}
        type="shadow"
      />
    </View>

    <View style={[styles.footerSide, styles.footerSideRight]}>
      <NextButton onPress={onPressSend} waitFor={waitFor} />
    </View>
  </View>
);

const DELETE_SIZE = 26;
const MID_Y_DELETE_BUTTON =
  MAX_POST_HEIGHT - getInset("bottom") - (DELETE_SIZE * 1.25) / 2;
const MID_X_DELETE_BUTTON = SCREEN_DIMENSIONS.width / 2;

const DELETE_RANGE = [
  euclideanDistance(
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON],
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON]
  ),
  euclideanDistance(
    [MID_X_DELETE_BUTTON - DELETE_SIZE, MID_Y_DELETE_BUTTON - DELETE_SIZE],
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON]
  ),
  euclideanDistance(
    [
      MID_X_DELETE_BUTTON - DELETE_SIZE * 1.5,
      MID_Y_DELETE_BUTTON - DELETE_SIZE * 1.5
    ],
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON]
  ),
  euclideanDistance([0, 0], [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON])
];

export const isDeletePressed = (x: number, y: number) => {
  const distance = euclideanDistance(
    [x, y],
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON]
  );

  return distance >= DELETE_RANGE[0] && distance <= DELETE_RANGE[1];
};

export const DeleteFooter = ({ onDelete, panY, panX }) => {
  const distance = React.useRef(new Animated.Value(0));

  const opacity = React.useRef(
    Animated.interpolate(
      distance.current,

      {
        inputRange: DELETE_RANGE,
        outputRange: [1, 1, 0.85, 0]
      }
    )
  );

  const scaleTransform = React.useRef(
    Animated.interpolate(
      distance.current,

      {
        inputRange: DELETE_RANGE,
        outputRange: [1.0, 1.0, 0.97, 0.95]
      }
    )
  );

  return (
    <View pointerEvents="none" style={[styles.footer, styles.footerCenter]}>
      <Animated.Code
        exec={Animated.block([
          Animated.set(
            distance.current,
            Animated.sqrt(
              Animated.add(
                Animated.multiply(
                  Animated.sub(MID_X_DELETE_BUTTON, panX),
                  Animated.sub(MID_X_DELETE_BUTTON, panX)
                ),
                Animated.multiply(
                  Animated.sub(MID_Y_DELETE_BUTTON, panY),
                  Animated.sub(MID_Y_DELETE_BUTTON, panY)
                )
              )
            )
          )
        ])}
      />
      <View
        style={[
          styles.footerSide,
          { alignItems: "center", justifyContent: "center" }
        ]}
      >
        <IconButton
          onPress={onDelete}
          Icon={IconTrash}
          color="#fff"
          size={DELETE_SIZE}
          backgroundColor={COLORS.primary}
          opacity={opacity.current}
          transform={[{ scale: scaleTransform.current }]}
          borderColor="#fff"
          type="fill"
        />
      </View>
    </View>
  );
};
