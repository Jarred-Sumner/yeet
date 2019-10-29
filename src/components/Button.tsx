import * as React from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Easing,
  StyleProp
} from "react-native";
import Animated, { Transitioning, Transition } from "react-native-reanimated";
import { SemiBoldText, LETTER_SPACING_MAPPING } from "./Text";
import { SPACING, COLORS } from "../lib/styles";
import {
  BorderlessButton,
  TouchableHighlight
} from "react-native-gesture-handler";
import { sendLightFeedback, sendSuccessNotification } from "../lib/Vibration";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import tinycolor from "tinycolor2";
import { useNavigation } from "react-navigation-hooks";
import { IconBack, IconClose } from "./Icon";

const styles = StyleSheet.create({
  color_primaryColor: {
    backgroundColor: COLORS.primary
  },
  color_secondaryColor: {
    backgroundColor: COLORS.secondary
  },
  color_secondaryOpacityColor: {
    backgroundColor: COLORS.secondaryOpacity
  },
  color_muted: {
    backgroundColor: "#444"
  },
  buttonContainer: {
    borderRadius: 4,
    height: 50,
    overflow: "visible",
    paddingHorizontal: SPACING.normal,
    maxWidth: 300,
    width: "100%",
    flex: 0,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 18,
    letterSpacing: LETTER_SPACING_MAPPING["18"]
  }
});

const BUTTON_COLOR_STYLE = {
  [COLORS.primary]: styles.color_primaryColor,
  [COLORS.secondary]: styles.color_secondaryColor,
  [COLORS.secondaryOpacity]: styles.color_secondaryOpacityColor,
  [COLORS.muted]: styles.color_muted
};

export const Button = ({
  children,
  onPress,
  disabled,
  style,
  color = COLORS.primary
}) => {
  const scaleTransformValue = React.useRef(new Animated.Value(1));
  const handlePressIn = React.useCallback(() => {
    Animated.timing(scaleTransformValue.current, {
      duration: 100,
      easing: Easing.ease,
      toValue: 1.05
    }).start();
  }, [scaleTransformValue.current]);

  const handlePressOut = React.useCallback(() => {
    Animated.timing(scaleTransformValue.current, {
      duration: 100,
      easing: Easing.ease,
      toValue: 1
    }).start();
  }, [scaleTransformValue.current]);

  return (
    <TouchableHighlight
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      underlayColor={color}
      style={{
        overflow: "visible",
        flexDirection: "row",
        flex: 0,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <Animated.View
        style={[
          styles.buttonContainer,
          BUTTON_COLOR_STYLE[color],
          style,
          {
            opacity: scaleTransformValue.current.interpolate({
              inputRange: [1.0, 1.05],
              outputRange: [1.0, 0.8],
              extrapolate: Animated.Extrapolate.CLAMP
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
    </TouchableHighlight>
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

export enum BackButtonBehavior {
  none = "none",
  back = "back",
  close = "close"
}

export const useBackButtonBehavior = (): BackButtonBehavior => {
  const navigation = useNavigation();

  if (navigation.isFirstRouteInParent()) {
    return BackButtonBehavior.close;
  } else {
    return BackButtonBehavior.back;
  }
};

export const BackButton = ({
  behavior = BackButtonBehavior.none,
  style,
  routeName,
  size = 24,
  ...otherProps
}: {
  behavior: BackButtonBehavior;
  style?: StyleProp<View> | null;
  routeName?: string;
  size?: number;
}) => {
  const navigation = useNavigation();

  const handlePress = React.useCallback(() => {
    if (behavior === BackButtonBehavior.back) {
      navigation.goBack(routeName);
    } else if (behavior === BackButtonBehavior.close) {
      navigation.goBack(routeName);
    }
  }, [behavior, navigation]);

  if (behavior === BackButtonBehavior.none) {
    return null;
  }

  const IconComponent =
    behavior === BackButtonBehavior.back ? IconBack : IconClose;

  return (
    <IconButton
      {...otherProps}
      Icon={IconComponent}
      size={size}
      type="shadow"
      onPress={handlePress}
      // iconStyle={style}
    />
  );
};
