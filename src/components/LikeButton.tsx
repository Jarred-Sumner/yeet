import React from "react";
import { View, StyleSheet } from "react-native";
import { IconHeart } from "./Icon";
import { SPACING, COLORS } from "../lib/styles";
import { Text } from "../components/Text";

export enum LikeButtonSize {
  default = "default",
  half = "half"
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  textShadow: {
    textShadowRadius: 1,
    textShadowColor: "#333"
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
    marginBottom: SPACING.normal,
    color: "white"
  },
  defaultSizeText: {
    fontSize: 24,
    color: "white"
  }
});

export class LikeButton extends React.Component {
  render() {
    const { size, count } = this.props;

    const iconStyle =
      size === LikeButtonSize.default
        ? styles.defaultSizeIcon
        : styles.halfSizeIcon;
    const textStyle =
      size === LikeButtonSize.default
        ? styles.defaultSizeText
        : styles.halfSizeText;

    return (
      <View style={styles.container}>
        <IconHeart style={[iconStyle, styles.textShadow]} />
        <Text style={textStyle}>{count}</Text>
      </View>
    );
  }
}
