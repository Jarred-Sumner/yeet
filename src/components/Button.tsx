import * as React from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated
} from "react-native";
import { SemiBoldText } from "./Text";
import { SPACING, COLORS } from "../lib/styles";

const styles = StyleSheet.create({
  primaryColor: {
    backgroundColor: COLORS.primary
  },
  buttonContainer: {
    borderRadius: 4,
    height: 46,
    paddingHorizontal: SPACING.normal,
    width: 300,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    fontSize: 18
  }
});

export const Button = ({ children, onPress, disabled, style }) => {
  const scaleTransformValue = React.useRef(new Animated.Value(1));
  const handlePressIn = React.useCallback(() => {
    Animated.spring(scaleTransformValue.current, {
      toValue: 1.05,
      useNativeDriver: true
    }).start();
  }, [scaleTransformValue]);

  const handlePressOut = React.useCallback(() => {
    Animated.spring(scaleTransformValue.current, {
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [scaleTransformValue]);

  return (
    <TouchableWithoutFeedback
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.buttonContainer,
          styles.primaryColor,
          style,
          {
            opacity: scaleTransformValue.current.interpolate({
              inputRange: [1.0, 1.05],
              outputRange: [1.0, 0.8]
            }),
            transform: [
              {
                scale: scaleTransformValue.current
              }
            ]
          }
        ]}
      >
        <SemiBoldText style={styles.buttonText}>{children}</SemiBoldText>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
