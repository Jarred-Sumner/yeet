import * as React from "react";
import { View, StyleSheet } from "react-native";
import { BoldText } from "../Text";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    color: "white",
    textAlign: "center"
  }
});

export const DeniedPhotoPermission = () => (
  <View style={styles.container}>
    <BoldText style={styles.title}>Can't access photos</BoldText>
  </View>
);

export default DeniedPhotoPermission;
