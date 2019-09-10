import * as React from "react";
import { View, StyleSheet, KeyboardAvoidingView, Keyboard } from "react-native";
import Animated, { Transition, Transitioning } from "react-native-reanimated";
import { ActiveLayer } from "./ActiveLayer";
import { Toolbar, ToolbarButtonType } from "../Toolbar";
import { IconText } from "../../Icon";
import {
  BaseButton,
  TapGestureHandler,
  State as GestureState
} from "react-native-gesture-handler";
import { COLORS, SPACING } from "../../../lib/styles";
import { TextInput } from "../Text/TextInput";
import { FocusBlockType } from "../NewPostFormat";

const { block, cond, set, eq, sub } = Animated;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});

const toolbarButtonStyles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 6,
    overflow: "visible",

    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 7,
    marginHorizontal: 15 - 6
  },
  icon: {
    color: "#666"
  }
});

const ActiveToolbarButton = ({ onClose }) => (
  <BaseButton onPress={onClose}>
    <Animated.View style={toolbarButtonStyles.container}>
      <IconText size={26} style={toolbarButtonStyles.icon} />
    </Animated.View>
  </BaseButton>
);

const TextToolbar = props => {
  return (
    <Toolbar>
      <ActiveToolbarButton />
    </Toolbar>
  );
};

export class TextLayer extends React.Component {
  state = {
    isFocused: false,
    coords: { x: -1, y: -1 },
    isInsertingInput: false,
    value: ""
  };
  backdropOpacityValue = new Animated.Value(0);

  render() {
    const {
      onPressToolbarButton,
      footer,
      waitFor,
      isFocused,
      width,
      controlsOpacity,
      isTappingEnabled,
      isNodeFocused,
      focusType,
      keyboardVisibleValue,
      focusTypeValue,
      height,
      nodeListRef,
      onBack
    } = this.props;

    return (
      <ActiveLayer
        footer={footer}
        width={width}
        height={height}
        controlsOpacity={controlsOpacity}
        toolbar={
          <Animated.View style={{ opacity: controlsOpacity }}>
            {isNodeFocused && <TextToolbar />}

            {!isNodeFocused && (
              <Toolbar
                activeButton={ToolbarButtonType.text}
                onChange={onPressToolbarButton}
                onBack={onBack}
              />
            )}
          </Animated.View>
        }
      ></ActiveLayer>
    );
  }
}

export default TextLayer;
