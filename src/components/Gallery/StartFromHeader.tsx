import * as React from "react";
import Animated from "react-native-reanimated";
import { View, StyleSheet } from "react-native";
import { TOP_Y } from "../../../config";
import { COLORS, SPACING } from "../../lib/styles";
import { SafeAreaContext } from "react-native-safe-area-context";
import { BackButtonBehavior, BackButton } from "../Button";
import { BorderlessButton } from "react-native-gesture-handler";
import { IconChevronRight } from "../Icon";
import { Text, MediumText } from "../Text";

export const TOP_HEADER = 48;

const styles = StyleSheet.create({
  header: {
    flex: 0,
    paddingTop: TOP_Y,
    height: TOP_HEADER + TOP_Y,
    flexDirection: "row",
    position: "absolute",
    width: "100%",

    alignItems: "center",
    backgroundColor: COLORS.background
  },
  headerSide: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  headerTitle: {
    fontSize: 16,
    color: COLORS.mutedLabel,
    textAlign: "center",
    marginLeft: -24
  },
  headerRight: {
    justifyContent: "flex-end"
  },
  headerLeft: {
    justifyContent: "flex-start",
    paddingHorizontal: SPACING.normal,
    width: 48
  },

  headerCenter: {
    justifyContent: "center"
  },
  headerTextButon: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal
  },
  headerButtonLabel: {
    color: COLORS.mutedLabel,
    marginRight: SPACING.half
  }
});

export const StartFromHeader = ({
  scrollY
}: {
  scrollY: Animated.Value<number>;
}) => {
  const behavior = BackButtonBehavior.close;

  return (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: scrollY.interpolate({
            inputRange: [0, TOP_Y],
            outputRange: [1, 0],
            extrapolate: Animated.Extrapolate.CLAMP
          }),
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, TOP_Y],
                outputRange: [0, -TOP_Y],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            }
          ]
        }
      ]}
    >
      <View style={[styles.headerSide, styles.headerLeft]}>
        <BackButton behavior={behavior} size={17} color={COLORS.mutedLabel} />
      </View>

      <View style={[styles.headerSide, styles.headerCenter]}>
        <Text style={styles.headerTitle}>Start from</Text>
      </View>

      <View style={[styles.headerSide, styles.headerRight]}>
        <BorderlessButton>
          <View style={styles.headerTextButon}>
            <MediumText style={styles.headerButtonLabel}>Skip</MediumText>
            <IconChevronRight size={12} color={COLORS.mutedLabel} />
          </View>
        </BorderlessButton>
      </View>
    </Animated.View>
  );
};
