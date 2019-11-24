import * as React from "react";
import { View, StyleSheet } from "react-native";
import { BoldText } from "../Text";
import { Button } from "../Button";
import { SPACING } from "../../lib/styles";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    color: "white",
    textAlign: "center",
    marginBottom: SPACING.normal
  }
});

export const RequestPhotoPermission = ({ onPress }) => (
  <View style={styles.container}>
    <BoldText style={styles.title}>Allow access to photos?</BoldText>
    <Button onPress={onPress}>Allow access</Button>
  </View>
);

export default RequestPhotoPermission;
