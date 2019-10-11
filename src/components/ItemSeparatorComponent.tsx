import { View, StyleSheet } from "react-native";
import { COLORS } from "../lib/styles";
import React from "react";

const styles = StyleSheet.create({
  followerSeparator: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    backgroundColor: COLORS.muted,
    opacity: 0.05
  }
});

export const ITEM_SEPARATOR_HEIGHT = StyleSheet.hairlineWidth;

export const ItemSeparatorComponent = () => (
  <View style={styles.followerSeparator} />
);

export default ItemSeparatorComponent;
