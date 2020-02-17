import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  TouchableOpacity,
  BorderlessButton
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { IconAddText, IconCameraRoll, IconSearch, IconShuffle } from "../Icon";

export enum ToolbarType {
  default = "default",
  text = "text",
  panning = "panning"
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",

    overflow: "visible",

    alignItems: "center",
    paddingLeft: 20,
    flex: 1,
    maxWidth: "100%"
  },
  spacer: {
    width: 20,
    height: 0,
    opacity: 0
  },
  buttonContainer: {
    position: "relative",
    justifyContent: "center",
    height: 44,
    width: 48,
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
  <BorderlessButton style={styles.touchable} onPress={onPress}>
    <View style={styles.buttonContainer}>{icon}</View>
  </BorderlessButton>
);

export const TextToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      icon={<IconAddText size={20} color="white" />}
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
      icon={<IconCameraRoll size={20} color="white" />}
      size={30}
      isActive={isActive}
      color="white"
      onPress={onPress}
    />
  );
};

const SearchToolbarbutton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      icon={<IconSearch size={24} color="white" />}
      size={36}
      isActive={isActive}
      color="white"
      onPress={onPress}
    />
  );
};

const ExampleToolbarButton = ({ onPress }) => (
  <ToolbarButton
    icon={<IconShuffle size={20} color="white" />}
    size={36}
    isActive={false}
    color="white"
    onPress={onPress}
  />
);

export enum ToolbarButtonType {
  search = "sticker",
  text = "text",
  gif = "gif",
  redact = "redact",
  draw = "draw",
  plus = "plus",
  photo = "photo"
}

export const DEFAULT_TOOLBAR_BUTTON_TYPE = "text";

export const DefaultToolbar = React.memo(
  ({ activeButton, onPress, children, hasExamples, onPressExample }) => {
    const onPressText = React.useCallback(
      () => onPress(ToolbarButtonType.text),
      [onPress]
    );

    const onPressSearch = React.useCallback(
      () => onPress(ToolbarButtonType.search),
      [onPress]
    );

    const onPressRedact = React.useCallback(
      () => onPress(ToolbarButtonType.redact),
      [onPress]
    );

    const onPressDraw = React.useCallback(
      () => onPress(ToolbarButtonType.draw),
      [onPress]
    );

    const onPressPlus = React.useCallback(
      () => onPress(ToolbarButtonType.plus),
      [onPress]
    );

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
        <View style={styles.spacer} />
        <PhotoToolbarButton
          isActive={activeButton === ToolbarButtonType.photo}
          onPress={onPressPhoto}
        />
        <View style={styles.spacer} />
        <SearchToolbarbutton
          isActive={activeButton === ToolbarButtonType.search}
          onPress={onPressSearch}
        />
        {hasExamples && (
          <>
            <View style={styles.spacer} />
            <ExampleToolbarButton isActive={false} onPress={onPressExample} />
          </>
        )}
      </>
    );

    return <View style={styles.container}>{_children}</View>;
  }
);

export default DefaultToolbar;
