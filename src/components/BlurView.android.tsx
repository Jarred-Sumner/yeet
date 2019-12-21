import { BlurView as BlurViewComponent } from "@react-native-community/blur";
import * as React from "react";
import { View, StyleSheet, findNodeHandle } from "react-native";

const styles = StyleSheet.create({
  container: { position: "relative", overflow: "visible" },
  blur: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0 ,0, 0.85)"
  }
});

export const BlurView = ({
  children,
  blurAmount,
  blurType,
  viewRef,
  style,
  blurStyle
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.blur} pointerEvents="none" />
      {children}
    </View>
  );
};
