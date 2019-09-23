import React from "react";
import { View, StyleSheet } from "react-native";
import { IconHeart } from "./Icon";
import { SPACING, COLORS } from "../lib/styles";
import { Text, MediumText } from "./Text";
import { BaseButton } from "react-native-gesture-handler";

export enum VerticalIconButtonSize {
  default = "default",
  half = "half"
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible"
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
  halfSizeIcon: {
    fontSize: 10,
    marginBottom: SPACING.half,
    color: "white"
  },
  halfSizeText: {
    fontSize: 12,
    color: "white"
  },
  defaultSizeIcon: {
    fontSize: 26,
    marginBottom: SPACING.half,
    color: "white"
  },
  defaultSizeText: {
    fontSize: 18,
    color: "white"
  }
});

export class VerticalIconButton extends React.Component {
  static defaultProps = {
    Icon: IconHeart
  };

  render() {
    const { size, count, Icon, onPress, iconSize } = this.props;

    const iconStyle =
      size === VerticalIconButtonSize.default
        ? styles.defaultSizeIcon
        : styles.halfSizeIcon;
    const textStyle =
      size === VerticalIconButtonSize.default
        ? styles.defaultSizeText
        : styles.halfSizeText;

    return (
      <BaseButton disallowInterruption onPress={onPress}>
        <View style={styles.container}>
          <Icon
            style={[
              iconStyle,
              styles.textShadow,
              iconSize && { fontSize: iconSize }
            ].filter(Boolean)}
          />
          <MediumText style={textStyle}>{count || 1}</MediumText>
        </View>
      </BaseButton>
    );
  }
}
