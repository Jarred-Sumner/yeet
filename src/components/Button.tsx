import { useActionSheet } from "@expo/react-native-action-sheet";
import * as React from "react";
import { StyleProp, StyleSheet, View } from "react-native";
import { BorderlessButton, RectButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useNavigation, useNavigationParam } from "react-navigation-hooks";
import { COLORS, SPACING } from "../lib/styles";
import { sendLightFeedback, sendSuccessNotification } from "../lib/Vibration";
import {
  IconChevronLeft,
  IconClose,
  IconEllipsis,
  IconEllipsisAlt
} from "./Icon";
import { LETTER_SPACING_MAPPING, SemiBoldText } from "./Text";

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
  disabled = false,
  style,
  color = COLORS.primary
}) => {
  const scaleTransformValue = React.useRef(new Animated.Value(1));

  return (
    <RectButton
      disabled={disabled}
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
        style={[styles.buttonContainer, BUTTON_COLOR_STYLE[color], style]}
      >
        <SemiBoldText style={styles.buttonText}>{children}</SemiBoldText>
      </Animated.View>
    </RectButton>
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
  borderWidth = 1,
  style,
  iconStyle,
  color = "white",
  hitSlop = { left: 20, right: 20, top: 20, bottom: 20 },
  waitFor,
  enabled = true,
  isLoading = false,
  containerSize: _containerSize,
  borderRadius,
  rectangle = false,
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
      borderRadius: borderRadius ?? containerSize / 2
    });

    iconWrapperStyles.push(StyleSheet.absoluteFill);

    return (
      <BorderlessButton
        waitFor={waitFor}
        enabled={enabled && !isLoading}
        disallowInterruption
        hitSlop={hitSlop}
        onPress={handlePress}
      >
        <Animated.View style={containerStyles}>
          <Animated.View
            style={{
              backgroundColor,
              width: containerSize,
              height: containerSize,
              borderRadius: borderRadius ?? containerSize / 2,
              borderColor,
              borderWidth: borderColor ? borderWidth : undefined,
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
  const isModal = useNavigationParam("isModal") ?? false;

  if (navigation.isFirstRouteInParent() || isModal) {
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
  alwaysChevron,
  onPress,
  ...otherProps
}: {
  behavior: BackButtonBehavior;
  style?: StyleProp<View> | null;
  routeName?: string;
  size?: number;
}) => {
  const navigation = useNavigation();

  const handlePress = React.useCallback(async () => {
    typeof onPress === "function" && (await onPress());

    if (behavior === BackButtonBehavior.back) {
      navigation.goBack(routeName);
    } else if (behavior === BackButtonBehavior.close) {
      navigation.goBack();
      navigation.dismiss();
    }
  }, [behavior, navigation, onPress]);

  if (behavior === BackButtonBehavior.none) {
    return null;
  }

  const IconComponent =
    behavior === BackButtonBehavior.back || alwaysChevron
      ? IconChevronLeft
      : IconClose;

  return (
    <IconButton
      {...otherProps}
      Icon={IconComponent}
      size={size}
      type="shadow"
      onPress={handlePress}
      iconStyle={style}
    />
  );
};

export const IconButtonEllipsis = ({
  size = 4,
  color = "white",
  containerSize,
  onPress,
  onOption,
  options,
  vertical,
  ...otherProps
}) => {
  const actionSheet = useActionSheet();

  const handlePress = React.useCallback(() => {
    const _options = [...options, "Cancel"];
    const cancelButtonIndex = _options.length - 1;
    actionSheet.showActionSheetWithOptions(
      {
        options: _options,
        cancelButtonIndex
      },
      index => {
        if (index === cancelButtonIndex) {
          return;
        }

        const option = _options[index];

        onOption(option);
      }
    );
  }, [actionSheet, options, onOption]);

  return (
    <IconButton
      {...otherProps}
      onPress={options && onOption ? handlePress : onPress}
      Icon={vertical ? IconEllipsisAlt : IconEllipsis}
      size={size}
      containerSize={containerSize}
      color={color}
      type="shadow"
    />
  );
};
