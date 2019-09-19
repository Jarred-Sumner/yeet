import * as React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "../Button";
import Animated from "react-native-reanimated";
import { SPACING, COLORS } from "../../lib/styles";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  IconText,
  IconRedact,
  IconDraw,
  IconPhoto,
  IconSticker,
  IconPlus,
  IconBack,
  IconClose
} from "../Icon";
import { TOP_Y } from "../../../config";

export enum ToolbarType {
  default = "default",
  text = "text",
  panning = "panning"
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: TOP_Y + SPACING.half,
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
  <TouchableOpacity onPressIn={onPress}>
    <View style={styles.buttonContainer}>
      <Icon size={size} style={[styles.buttonIcon, { color }]} />
    </View>
  </TouchableOpacity>
);

export const TextToolbarButton = ({ isActive, onPress }) => {
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

const PhotoToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      Icon={IconPhoto}
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

const BackToolbarButton = ({ isActive, onPress, Icon }) => (
  <ToolbarButton
    onPress={onPress}
    type={"shadow"}
    color="white"
    size={24}
    Icon={Icon}
  />
);

export enum ToolbarButtonType {
  sticker = "sticker",
  text = "text",
  redact = "redact",
  draw = "draw",
  plus = "plus",
  photo = "photo"
}

export const DEFAULT_TOOLBAR_BUTTON_TYPE = "text";

export const DefaultToolbar = ({
  activeButton,
  onPress,
  children,
  onBack,
  isModal,
  type = ToolbarType.default
}) => {
  const onPressText = React.useCallback(() => onPress(ToolbarButtonType.text), [
    onPress
  ]);

  const onPressSticker = React.useCallback(
    () => onPress(ToolbarButtonType.sticker),
    [onPress]
  );

  const onPressRedact = React.useCallback(
    () => onPress(ToolbarButtonType.redact),
    [onPress]
  );

  const onPressDraw = React.useCallback(() => onPress(ToolbarButtonType.draw), [
    onPress
  ]);

  const onPressPlus = React.useCallback(() => onPress(ToolbarButtonType.plus), [
    onPress
  ]);

  const onPressPhoto = React.useCallback(
    () => onPress(ToolbarButtonType.photo),
    [onPress]
  );

  const _children = children || (
    <>
      <TextToolbarButton
        isActive={activeButton === ToolbarButtonType.text}
        onPress={onPressText}
      />
      <PhotoToolbarButton
        isActive={activeButton === ToolbarButtonType.photo}
        onPress={onPressPhoto}
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
    <Animated.View pointerEvents="box-none" style={styles.container}>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.side, styles.leftSide]}
      >
        <BackToolbarButton
          onPress={onBack}
          Icon={type === ToolbarType.default && !isModal ? IconBack : IconClose}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[styles.side, styles.rightSide]}
      >
        {_children}
      </Animated.View>
    </Animated.View>
  );
};

export default DefaultToolbar;
