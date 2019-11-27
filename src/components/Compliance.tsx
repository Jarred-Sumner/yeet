import * as React from "react";
import { StyleSheet, View } from "react-native";
import { BASE_HOSTNAME } from "../../config";
import { Link } from "../components/Link";
import { MediumText } from "../components/Text";
import { SPACING } from "../lib/styles";

const styles = StyleSheet.create({
  caption: {
    paddingHorizontal: SPACING.normal,
    color: "#ccc",
    marginTop: SPACING.normal,
    flexDirection: "row",
    flexWrap: "wrap"
  },
  color: {
    color: "#ccc"
  }
});

export const Compliance = () => (
  <View style={styles.caption}>
    <MediumText>By continuing, you agree to the </MediumText>
    <Link
      TextComponent={MediumText}
      style={styles.color}
      href={BASE_HOSTNAME + "/terms-of-service.html"}
    >
      terms & conditions
    </Link>
    <MediumText> and </MediumText>
    <Link
      TextComponent={MediumText}
      style={styles.color}
      href={BASE_HOSTNAME + "/privacy-policy.html"}
    >
      privacy policy
    </Link>
    <MediumText>.</MediumText>
  </View>
);

export default Compliance;
