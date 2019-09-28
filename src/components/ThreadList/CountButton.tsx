import React from "react";
import { View, StyleSheet } from "react-native";
import { IconHeart } from "../Icon";
import { SPACING, COLORS } from "../../lib/styles";
import { Text, MediumText } from "../Text";
import { BaseButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
    paddingHorizontal: SPACING.normal
  },
  textShadow: {
    textShadowRadius: 1,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    padding: 3,
    margin: -3,
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
    color: "white"
  },
  textContainer: {
    marginTop: SPACING.normal,
    position: "relative"
  }
});

export class CountButton extends React.Component {
  static defaultProps = {
    Icon: IconHeart
  };

  render() {
    const {
      size,
      count,
      nextCount,
      Icon,
      color,
      iconNode,
      onPress,
      iconSize
    } = this.props;

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
}

export default CountButton;
