import * as React from "react";
import { StyleSheet, View } from "react-native";
import { BaseButton } from "react-native-gesture-handler";
import { COLORS, SPACING } from "../../lib/styles";
import { SemiBoldText, Text } from "../Text";
import { IconChevronRight } from "../Icon";

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.half,
    paddingHorizontal: SPACING.normal,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    color: "#fff",
    fontSize: 14
  },
  chevron: {
    fontSize: 10,
    color: "#666",
    alignSelf: "center",
    alignItems: "center"
  },
  right: {
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row"
  },
  viewAll: {
    color: COLORS.muted,
    fontSize: 14,
    alignItems: "center",
    marginRight: SPACING.half
  }
});

export const SectionHeader = ({ label, onPress }) => (
  <BaseButton exclusive enabled={!!onPress} onPress={onPress}>
    <View style={styles.container}>
      <SemiBoldText style={styles.title}>{label}</SemiBoldText>
      <View style={styles.right}>
        <Text style={styles.viewAll}>View all</Text>
        <IconChevronRight style={styles.chevron} color="#ccc" />
      </View>
    </View>
  </BaseButton>
);
export default SectionHeader;
