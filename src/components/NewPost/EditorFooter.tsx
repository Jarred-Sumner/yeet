import euclideanDistance from "euclidean-distance";
import * as React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { interpolateColor } from "react-native-redash";
import { getInset } from "react-native-safe-area-view";
import { COLORS, SPACING } from "../../lib/styles";
import { IconButton } from "../Button";
import { IconDownload, IconSend, IconTrash } from "../Icon";
import { MAX_POST_HEIGHT } from "./NewPostFormat";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../../config";

export const FOOTER_HEIGHT = BOTTOM_Y + 50 + SPACING.half * 2;

const styles = StyleSheet.create({
  footerSide: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  footer: {
    flexDirection: "row",
    position: "absolute",
    paddingRight: SPACING.normal,
    paddingBottom: BOTTOM_Y,
    height: FOOTER_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
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

export const EditorFooter = ({
  onPressDownload,
  onPressSend,
  waitFor,
  toolbar
}) => (
  <View pointerEvents="box-none" style={styles.footer}>
    {toolbar}

    <View
      pointerEvents="box-none"
      style={[styles.footerSide, styles.footerSideRight]}
    >
      <NextButton onPress={onPressSend} waitFor={waitFor} />
    </View>
  </View>
);

const DELETE_SIZE = 26;
const MID_Y_DELETE_BUTTON =
  MAX_POST_HEIGHT - BOTTOM_Y - (DELETE_SIZE * 1.25) / 2;
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
        outputRange: [1, 1, 0.95, 0.5]
      }
    )
  );

  const scaleTransform = React.useRef(
    Animated.interpolate(
      distance.current,

      {
        inputRange: DELETE_RANGE,
        outputRange: [1.01, 1.0, 0.97, 0.95]
      }
    )
  );

  const backgroundColor = React.useRef(
    interpolateColor(
      distance.current,
      {
        inputRange: DELETE_RANGE,
        outputRange: [
          {
            r: 120,
            g: 120,
            b: 120
          },
          {
            r: 75,
            g: 75,
            b: 75
          },
          {
            r: 50,
            g: 50,
            b: 50
          },
          {
            r: 0,
            g: 0,
            b: 0
          }
        ]
      },
      "rgb"
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
        pointerEvents="none"
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
          backgroundColor={backgroundColor.current}
          opacity={opacity.current}
          transform={[{ scale: scaleTransform.current }]}
          borderColor="#fff"
          type="fill"
        />
      </View>
    </View>
  );
};
