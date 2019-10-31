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
import {
  BitmapIconPlus,
  BitmapIconAddText,
  BitmapIconAddPhoto,
  BitmapIconAddSticker
} from "../BitmapIcon";

export enum ToolbarType {
  default = "default",
  text = "text",
  panning = "panning"
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-evenly",

    overflow: "visible",

    alignItems: "center",
    flex: 1,
    maxWidth: 240
  },
  buttonContainer: {
    position: "relative",
    flexShrink: 0,
    overflow: "visible"
  },
  plusIcon: {
    position: "absolute",
    bottom: 2,
    right: 2,
    overflow: "visible"
  }
});

export const ToolbarButton = ({ icon, size, onPress, color, isActive }) => (
  <TouchableOpacity style={styles.touchable} onPressIn={onPress}>
    <View style={styles.buttonContainer}>{icon}</View>
  </TouchableOpacity>
);

export const TextToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      icon={<BitmapIconAddText />}
      size={30}
      isActive={isActive}
      color="white"
      onPress={onPress}
    />
  );
};

const PhotoToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      icon={<BitmapIconAddPhoto />}
      size={30}
      isActive={isActive}
      color="white"
      onPress={onPress}
    />
  );
};

const StickerToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      icon={<BitmapIconAddSticker />}
      size={36}
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
      <StickerToolbarButton
        isActive={activeButton === ToolbarButtonType.sticker}
        onPress={onPressDraw}
      />
    </>
  );

  return (
    <Animated.View pointerEvents="box-none" style={styles.container}>
      {_children}
    </Animated.View>
  );
};

export default DefaultToolbar;
