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
    borderRadius: 2,
    backgroundColor: "#666",
    paddingHorizontal: SPACING.half / 2,
    paddingVertical: SPACING.half / 2,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center"
  },
  text: {
    color: "#eee",
    fontSize: 14
  }
});

export const DurationLabel = React.memo(({ duration, style }) => {
  return (
    <View style={[styles.container, style]}>
      <MediumText style={styles.text}>{formatSeconds(duration)}</MediumText>
    </View>
  );
});
