import * as React from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator
} from "react-native";
import Animated, { Transitioning, Transition } from "react-native-reanimated";
import { SemiBoldText } from "./Text";
import { SPACING, COLORS } from "../lib/styles";
import { BorderlessButton } from "react-native-gesture-handler";
import { sendLightFeedback, sendSuccessNotification } from "../lib/Vibration";

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

const buttonStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible",
    justifyContent: "center"
  },
  fill: {
    alignItems: "center",
    justifyContent: "center"
  },
  icon: {
    color: "white"
  },
  iconShadow: {
    textShadowColor: "black",
    textShadowRadius: 2,
    padding: 2,
    overflow: "visible",
    textShadowOffset: {
      width: 0,
      height: 0
    }
  }
});

export const IconButton = ({
  onPress,
  Icon,
  type = "plain",
  backgroundColor,
  borderColor,
  style,
  iconStyle,
  color = "white",
  waitFor,
  enabled = true,
  isLoading = false,
  containerSize: _containerSize,
  opacity = 1,
  transform,
  size = 24,
  iconNode,
  impact = null
}) => {
  const handlePress = React.useCallback(
    evt => {
      const pressed = onPress && onPress(evt);
      const impactFunction = {
        light: sendLightFeedback,
        success: sendSuccessNotification
      }[impact];

      if (impactFunction) {
        if (typeof pressed === "object" && typeof pressed.then === "function") {
          pressed.then(result => {
            impactFunction();
            return result;
          });
        } else {
          impactFunction();
        }
      }
    },
    [onPress, sendLightFeedback, sendSuccessNotification, impact]
  );
  const containerStyles = [style, buttonStyles.container];
  const iconStyles = [iconStyle, buttonStyles.icon];

  const iconWrapperStyles = [
    {
      justifyContent: "center",
      alignSelf: "center",
      alignItems: "center",
      flex: 1
    }
  ];

  if (color) {
    iconStyles.push({ color });
  }

  if (transform) {
    containerStyles.push({ transform });
  }

  const containerSize = _containerSize || size * 2.5;

  if (type === "fill") {
    containerStyles.push(buttonStyles.fill);
    containerStyles.push({
      position: "relative",
      overflow: "visible",
      width: containerSize,
      height: containerSize,
      borderRadius: containerSize / 2
    });

    iconWrapperStyles.push(StyleSheet.absoluteFill);

    return (
      <BorderlessButton
        waitFor={waitFor}
        enabled={enabled && !isLoading}
        disallowInterruption
        hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
        onPress={handlePress}
      >
        <Animated.View style={containerStyles}>
          <Animated.View
            style={{
              backgroundColor,
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              borderColor,
              borderWidth: borderColor ? 1 : undefined,
              opacity
            }}
          />
          <Animated.View style={iconWrapperStyles}>
            {iconNode || <Icon style={iconStyles} size={size} />}
          </Animated.View>
        </Animated.View>
      </BorderlessButton>
    );
  } else if (type === "shadow") {
    iconStyles.push(buttonStyles.iconShadow);

    return (
      <BorderlessButton
        waitFor={waitFor}
        enabled={enabled && !isLoading}
        disallowInterruption
        hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
        onPress={handlePress}
      >
        <Animated.View key={`isLoading-${isLoading}`} style={containerStyles}>
          {iconNode || <Icon style={iconStyles} size={size} />}
        </Animated.View>
      </BorderlessButton>
    );
  } else {
    return null;
  }
};
