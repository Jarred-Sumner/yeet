import * as React from "react";
import { View, StyleSheet, Image } from "react-native";
import { SPACING } from "../../lib/styles";
import { TOP_Y } from "../../../config";
import { BitmapIconLogo } from "../BitmapIcon";
import { CurrentUserAvatar } from "../Avatar";

export const FEED_HEADER_HEIGHT = 58;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: FEED_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingVertical: SPACING.half,
    paddingHorizontal: SPACING.double
  },
  leftSide: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start"
  },
  rightSide: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end"
  }
});

export const FeedHeader = () => {
  return (
    <View style={styles.header}>
      <View style={styles.leftSide}>
        <BitmapIconLogo resizeMode="contain" width={102} height={28} />
      </View>
      <View style={styles.rightSide}>
        <CurrentUserAvatar size={42} />
      </View>
    </View>
  );
};
