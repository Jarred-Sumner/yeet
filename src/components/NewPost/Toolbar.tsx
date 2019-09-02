import * as React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "../Button";
import Animated from "react-native-reanimated";
import { SPACING, COLORS } from "../../lib/styles";
import { BorderlessButton } from "react-native-gesture-handler";
import { IconText, IconRedact, IconDraw, IconSticker, IconPlus } from "../Icon";

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-end",
    paddingTop: 15,
    alignItems: "center"
  },
  buttonContainer: {},
  buttonIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    paddingHorizontal: SPACING.normal,
    paddingVertical: 15
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
      size={26}
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
      size={40}
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
      size={37}
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

export enum ToolbarButtonType {
  sticker = "sticker",
  text = "text",
  redact = "redact",
  draw = "draw",
  plus = "plus"
}

export const DEFAULT_TOOLBAR_BUTTON_TYPE = "text";

export const Toolbar = ({ activeButton, onChange, children }) => {
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

  return <Animated.View style={styles.container}>{_children}</Animated.View>;
};

export default Toolbar;
