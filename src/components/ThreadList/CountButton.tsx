import React from "react";
import { View, StyleSheet } from "react-native";
import { IconHeart } from "../Icon";
import { SPACING, COLORS } from "../../lib/styles";
import { Text, MediumText, LETTER_SPACING_MAPPING } from "../Text";
import {
  BaseButton,
  TouchableWithoutFeedback
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
    paddingHorizontal: 20
  },
  disabledContainer: {
    paddingHorizontal: 0
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
    marginTop: SPACING.normal,
    position: "relative"
  }
});

export const CountButton = React.memo(
  ({
    count,
    Icon,
    color,
    iconNode,
    onPress,
    onLongPress,
    iconSize,
    buttonRef,
    disabled = false
  }) => {
    return (
      <TouchableWithoutFeedback
        disabled={disabled}
        onLongPress={onLongPress}
        ref={buttonRef}
        onPress={onPress}
      >
        <View
          style={
            disabled || !onPress
              ? [styles.container, styles.disabledContainer]
              : styles.container
          }
        >
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
      </TouchableWithoutFeedback>
    );
  }
);

export default CountButton;
