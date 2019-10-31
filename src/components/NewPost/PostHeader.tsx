import * as React from "react";
import { View, StyleSheet } from "react-native";
import { CAROUSEL_HEIGHT } from "./NewPostFormat";
import FormatPicker from "./FormatPicker";
import LinearGradient from "react-native-linear-gradient";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import {
  BackButton,
  BackButtonBehavior,
  useBackButtonBehavior
} from "../Button";
import { SPACING, COLORS } from "../../lib/styles";
import Animated from "react-native-reanimated";

export const CAROUSEL_BACKGROUND = "rgba(0, 0, 10, 0.97)";

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: "visible",
    height: CAROUSEL_HEIGHT
  },
  content: {
    height: CAROUSEL_HEIGHT,
    flexDirection: "row",
    overflow: "visible",
    backgroundColor: CAROUSEL_BACKGROUND,
    flexShrink: 0,
    shadowRadius: 1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowColor: "rgb(0, 0, 30)",
    shadowOpacity: 0.8,

    position: "relative"
  },
  backButtonLayer: {
    position: "absolute",
    width: "100%",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: CAROUSEL_HEIGHT
  },
  backButtonGradientContainer: {
    zIndex: 0,
    flex: 0,
    width: "100%",
    height: CAROUSEL_HEIGHT
  },
  backButton: {
    alignSelf: "center"
  },
  backButtonContainer: {
    zIndex: 1,
    alignSelf: "center",
    top: 0,
    left: SPACING.normal,

    height: CAROUSEL_HEIGHT,
    paddingTop: TOP_Y,
    flexDirection: "row",
    alignItems: "center"
  }
});

const BackButtonGradient = ({
  width = SCREEN_DIMENSIONS.width,
  height = CAROUSEL_HEIGHT
}) => (
  <LinearGradient
    // useAngle
    width={width}
    height={height}
    pointerEvents="none"
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    locations={[0.0, 0.4]}
    colors={["rgba(0,0,0, 0.95)", "rgba(0,0,0, 0)"]}
  />
);

const BackButtonLayer = () => {
  const backButtonBehavior = useBackButtonBehavior();

  return (
    <View pointerEvents="box-none" style={styles.backButtonLayer}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.backButtonGradientContainer]}
      >
        <BackButtonGradient />
      </View>

      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFill, styles.backButtonContainer]}
      >
        <BackButton
          color="white"
          style={styles.backButton}
          behavior={BackButtonBehavior.close}
        />
      </View>
    </View>
  );
};

export const PostHeader = React.forwardRef(
  (
    {
      defaultFormat,
      translateY = 0,
      onChangeFormat,
      controlsOpacityValue: opacity
    },
    ref
  ) => {
    return (
      <Animated.View
        style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}
      >
        <View style={styles.content}>
          <FormatPicker
            defaultFormat={defaultFormat}
            ref={ref}
            onChangeFormat={onChangeFormat}
          />

          <BackButtonLayer />
        </View>
      </Animated.View>
    );
  }
);
