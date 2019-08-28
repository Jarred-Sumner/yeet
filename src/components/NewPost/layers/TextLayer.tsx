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

  handleChangeText = value => this.setState({ value });
  toggleActive = ({ nativeEvent: { state: gestureState, ...data } }) => {
    if (gestureState === GestureState.END && !this.props.isFocused) {
      this.props.insertTextNode({ x: data.x, y: data.y });
    } else if (this.props.isFocused && gestureState === GestureState.END) {
      // Works around issue with blur
      Keyboard.dismiss();
    }
  };

  render() {
    const {
      onPressToolbarButton,
      footer,
      waitFor,
      isFocused,
      width,
      controlsOpacity,
      height,
      nodeListRef
    } = this.props;

    return (
      <ActiveLayer
        footer={footer}
        width={width}
        height={height}
        controlsOpacity={controlsOpacity}
        toolbar={
          <>
            {isFocused && <TextToolbar />}

            {!isFocused && (
              <Toolbar
                activeButton={ToolbarButtonType.text}
                onChange={onPressToolbarButton}
              />
            )}
          </>
        }
      >
        <TapGestureHandler
          waitFor={waitFor}
          onHandlerStateChange={this.toggleActive}
          enabled={this.props.isTappingEnabled}
        >
          <Animated.View
            ref={nodeListRef}
            style={{
              width,
              height,
              backgroundColor: isFocused ? "rgba(0, 0, 0, 0.65)" : undefined
            }}
          >
            {this.props.children}
          </Animated.View>
        </TapGestureHandler>
      </ActiveLayer>
    );
  }
}

export default TextLayer;
