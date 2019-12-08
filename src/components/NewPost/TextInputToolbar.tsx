import * as React from "react";
import { View, StyleSheet } from "react-native";
import TextPostBlock from "./TextPostBlock";
import { SCREEN_DIMENSIONS } from "../../../config";
import { COLORS, SPACING } from "../../lib/styles";

const styles = StyleSheet.create({
  container: {
    height: 50 + SPACING.normal,
    marginTop: SPACING.normal,
    width: SCREEN_DIMENSIONS.width,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(0, 0, 0, 0.85)"
  }
});

export const TextInputToolbar = ({
  block,

  onChange
}: {
  block: TextPostBlock;
  onChange: Function;
}) => {
  return <View style={styles.container}></View>;
};
