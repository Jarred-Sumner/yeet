import * as React from "react";
import { View, StyleSheet } from "react-native";
import { format, addSeconds } from "date-fns";
import { SPACING, COLORS } from "../../../lib/styles";
import { MediumText } from "../../Text";

function formatSeconds(seconds) {
  var helperDate = addSeconds(new Date(0), seconds);
  return format(helperDate, "mm:ss");
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center"
  },
  text: {
    color: "#fff",
    fontSize: 14,
    textShadowColor: "black",

    textShadowRadius: 1
  }
});

export const DurationLabel = React.memo(({ duration, style }) => {
  return (
    <View style={[styles.container, style]}>
      <MediumText style={styles.text}>{formatSeconds(duration)}</MediumText>
    </View>
  );
});
