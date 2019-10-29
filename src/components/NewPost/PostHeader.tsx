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
import { SPACING } from "../../lib/styles";

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    height: CAROUSEL_HEIGHT
  },
  content: {
    height: CAROUSEL_HEIGHT,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    flexShrink: 0,

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
    top: (CAROUSEL_HEIGHT - TOP_Y) / 2 - SPACING.half,
    left: SPACING.normal,

    height: CAROUSEL_HEIGHT,
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
    end={{ x: 0.5, y: 1 }}
    angle={90}
    angleCenter={{ x: 0.0, y: 0.0 }}
    locations={[0.0, 0.25, 0.5]}
    colors={["rgba(0,0,0, 1)", "rgba(0,0,0, 1)", "rgba(0,0,0, 0)"]}
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
          behavior={backButtonBehavior}
        />
      </View>
    </View>
  );
};

export const PostHeader = ({ defaultFormat, onChangeFormat }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <FormatPicker
          defaultFormat={defaultFormat}
          onChangeFormat={onChangeFormat}
        />

        <BackButtonLayer />
      </View>
    </View>
  );
};
