import React from "react";
import { View, StyleSheet } from "react-native";
import { IconHeart } from "../Icon";
import { SPACING, COLORS } from "../../lib/styles";
import { Text, MediumText, LETTER_SPACING_MAPPING } from "../Text";
import { BaseButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible"
  },
  textShadow: {
    textShadowRadius: 1,
    textShadowColor: "rgba(0, 0, 0, 0.75)",

    shadowOpacity: 0,
    overflow: "visible",
    textShadowOffset: { width: 0, height: 0 }
  },

  icon: {
    fontSize: 26,
    color: "white"
  },
  text: {
    fontSize: 18,
    letterSpacing: LETTER_SPACING_MAPPING["18"],
    color: "white"
  },
  textContainer: {
    marginLeft: SPACING.normal,
    position: "relative"
  }
});

export const CountButton = React.memo(
  ({ count, Icon, color, iconNode, onPress, iconSize }) => {
    return (
      <BaseButton disallowInterruption onPress={onPress}>
        <View style={styles.container}>
          {iconNode ? (
            iconNode
          ) : (
            <Icon
              style={[
                styles.icon,
                styles.textShadow,
                iconSize && { fontSize: iconSize },
                color && { color }
              ].filter(Boolean)}
            />
          )}
          {typeof count === "number" ? (
            <View style={styles.textContainer}>
              <MediumText style={styles.text}>{count || 0}</MediumText>
            </View>
          ) : null}
        </View>
      </BaseButton>
    );
  }
);

export default CountButton;
