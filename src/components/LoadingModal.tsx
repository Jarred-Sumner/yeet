import * as React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { Modal } from "./Modal";
import { SPACING, COLORS } from "../lib/styles";
import { SemiBoldText, Text } from "./Text";
import { Button } from "./Button";

const loadingModalStyles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)"
  }
});

const LoadingModalComponent = ({ visible }) => {
  return (
    <View style={loadingModalStyles.container}>
      <ActivityIndicator animating={visible} size="large" color="white" />
    </View>
  );
};

export const LoadingModal = React.memo(({ visible, onDismiss }) => {
  return <LoadingModalComponent visible={visible} />;
});

export default LoadingModal;
