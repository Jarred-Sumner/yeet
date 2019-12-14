import * as React from "react";
import { StyleSheet, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import {
  BitmapIconAddGif,
  BitmapIconAddPhoto,
  BitmapIconAddSticker,
  BitmapIconAddText
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
    justifyContent: "center",
    flexShrink: 0,
    flexGrow: 1,
    height: 50,
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

const GifToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      icon={<BitmapIconAddGif />}
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
  gif = "gif",
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

  const onPressGif = React.useCallback(() => onPress(ToolbarButtonType.gif), [
    onPress
  ]);

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
        onPress={onPressSticker}
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
