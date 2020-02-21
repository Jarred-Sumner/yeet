import * as React from "react";
import { StyleSheet, View } from "react-native";
import { BorderlessButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { TOP_Y } from "../../../config";
import { COLORS, SPACING } from "../../lib/styles";
import { BackButton, useBackButtonBehavior } from "../Button";
import { IconChevronRight } from "../Icon";
import { MediumText } from "../Text";
import { CAROUSEL_HEIGHT } from "./NewPostFormat";

export const CAROUSEL_BACKGROUND = "rgba(15, 10, 15, 0.97)";

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
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal,
    overflow: "visible"
  },
  finishLabel: {
    fontSize: 14,
    color: "rgb(204, 204, 204)"
  },
  finishChevron: {
    marginLeft: 8
  },
  content: {
    height: CAROUSEL_HEIGHT,
    flexDirection: "row",
    paddingLeft: SPACING.normal,
    paddingTop: TOP_Y,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",

    justifyContent: "space-between",
    overflow: "visible",
    flexShrink: 0,
    shadowRadius: 1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowColor: "rgb(0, 0, 30)",
    shadowOpacity: 0.25,

    position: "relative"
  }
});

export const PostHeader = React.memo(({ onFinish }) => {
  const backButtonBehavior = useBackButtonBehavior();

  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <BackButton
          color={COLORS.muted}
          style={styles.backButton}
          size={14}
          behavior={backButtonBehavior}
        />

        <BorderlessButton onPress={onFinish}>
          <Animated.View style={styles.finishButton}>
            <MediumText style={styles.finishLabel}>Finish</MediumText>
            <IconChevronRight
              style={styles.finishChevron}
              color={COLORS.muted}
              size={12}
            />
          </Animated.View>
        </BorderlessButton>
      </View>
    </View>
  );
});
