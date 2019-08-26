import * as React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "../Button";
import Animated from "react-native-reanimated";
import { SPACING, COLORS } from "../../lib/styles";
import { BorderlessButton } from "react-native-gesture-handler";
import { IconText, IconRedact, IconDraw, IconSticker } from "../Icon";

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

const ToolbarButton = ({ Icon, size, onPress, color, isActive }) => (
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

const RedactToolbarButton = ({ isActive, onPress }) => {
  return (
    <ToolbarButton
      Icon={IconRedact}
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

export class Toolbar extends React.Component {
  render() {
    return (
      <Animated.View style={styles.container}>
        <TextToolbarButton />
        <RedactToolbarButton />
        <DrawToolbarButton />
        <StickerToolbarButton />
      </Animated.View>
    );
  }
}

export default Toolbar;
