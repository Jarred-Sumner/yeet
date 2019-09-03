import * as React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "../Button";
import Animated from "react-native-reanimated";
import { SPACING, COLORS } from "../../lib/styles";
import { BorderlessButton } from "react-native-gesture-handler";
import {
  IconText,
  IconRedact,
  IconDraw,
  IconSticker,
  IconPlus,
  IconBack
} from "../Icon";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15 / 2,
    alignItems: "center",
    flex: 1
  },
  side: {
    flexDirection: "row"
  },
  buttonContainer: {},
  buttonIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    paddingVertical: SPACING.normal,
    paddingHorizontal: 15
  }
});

export const ToolbarButton = ({ Icon, size, onPress, color, isActive }) => (
  <BorderlessButton onPress={onPress}>
    <View style={styles.buttonContainer}>
      <Icon size={size} style={[styles.buttonIcon, { color }]} />
    </View>
  </BorderlessButton>
);

const TextToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      Icon={IconText}
      size={24}
      isActive={isActive}
      color="white"
      onPress={onPress}
    />
  );
};

const PlusToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      Icon={IconPlus}
      size={24}
      isActive={isActive}
      color="white"
      onPress={onPress}
    />
  );
};

const DrawToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      Icon={IconDraw}
      size={24}
      isActive={isActive}
      color="white"
      onPress={onPress}
    />
  );
};

const StickerToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      Icon={IconSticker}
      size={38}
      isActive={isActive}
      color="white"
      onPress={onPress}
    />
  );
};

const BackToolbarButton = ({ isActive, onPress }) => (
  <ToolbarButton
    onPress={onPress}
    type={"shadow"}
    color="white"
    size={24}
    Icon={IconBack}
  />
);

export enum ToolbarButtonType {
  sticker = "sticker",
  text = "text",
  redact = "redact",
  draw = "draw",
  plus = "plus"
}

export const DEFAULT_TOOLBAR_BUTTON_TYPE = "text";

export const Toolbar = ({ activeButton, onChange, children, onBack }) => {
  const onPressText = React.useCallback(
    () => onChange(ToolbarButtonType.text),
    [onChange]
  );

  const onPressSticker = React.useCallback(
    () => onChange(ToolbarButtonType.sticker),
    [onChange]
  );

  const onPressRedact = React.useCallback(
    () => onChange(ToolbarButtonType.redact),
    [onChange]
  );

  const onPressDraw = React.useCallback(
    () => onChange(ToolbarButtonType.draw),
    [onChange]
  );

  const onPressPlus = React.useCallback(
    () => onChange(ToolbarButtonType.plus),
    [onChange]
  );

  const _children = children || (
    <>
      <TextToolbarButton
        isActive={activeButton === ToolbarButtonType.text}
        onPress={onPressText}
      />
      <DrawToolbarButton
        isActive={activeButton === ToolbarButtonType.draw}
        onPress={onPressDraw}
      />
      <PlusToolbarButton
        isActive={activeButton === ToolbarButtonType.plus}
        onPress={onPressPlus}
      />
    </>
  );

  return (
    <Animated.View style={styles.container}>
      <Animated.View style={[styles.side, styles.leftSide]}>
        <BackToolbarButton onPress={onBack} />
      </Animated.View>

      <Animated.View style={[styles.side, styles.rightSide]}>
        {_children}
      </Animated.View>
    </Animated.View>
  );
};

export default Toolbar;
