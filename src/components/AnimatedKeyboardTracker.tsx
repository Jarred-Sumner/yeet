import * as React from "react";
import { Keyboard } from "react-native";
import Animated, { Easing } from "react-native-reanimated";

export class AnimatedKeyboardTracker extends React.Component {
  constructor(props) {
    super(props);

    this.subscribeToKeyboard();
  }

  componentWillUnmount() {
    this.unsubscribeToKeyboard();
  }

  subscribeToKeyboard = () => {
    Keyboard.addListener("keyboardWillShow", this.handleKeyboardWillShow);
    Keyboard.addListener("keyboardDidHide", this.handleKeyboardDidHide);
    Keyboard.addListener(
      "keyboardWillChangeFrame",
      this.handleKeyboardWillChangeFrame
    );
    Keyboard.addListener("keyboardWillHide", this.handleKeyboardWillHide);
  };

  keyboardVisibleValue = new Animated.Value(0);

  handleKeyboardWillChangeFrame = ({
    duration,
    easing,
    endCoordinates,
    startCoordinates
  }) => {};

  handleKeyboardWillHide = event => {
    this.handleKeyboardAnimation(false, event.duration);
  };

  handleKeyboardDidHide = event => {};

  handleKeyboardWillShow = event => {
    this.handleKeyboardAnimation(true, event.duration);
  };

  handleKeyboardAnimation = (isShowing: boolean, duration) => {
    const { keyboardVisibleValue } = this.props;

    const easing = Easing.elastic(0.5);

    Animated.timing(keyboardVisibleValue, {
      duration,
      toValue: isShowing ? 1.0 : 0.0,
      easing
    }).start();
  };

  unsubscribeToKeyboard = () => {
    Keyboard.removeListener("keyboardWillShow", this.handleKeyboardWillShow);
    Keyboard.removeListener("keyboardDidHide", this.handleKeyboardDidHide);
    Keyboard.removeListener(
      "keyboardWillChangeFrame",
      this.handleKeyboardWillChangeFrame
    );
    Keyboard.removeListener("keyboardWillHide", this.handleKeyboardWillHide);
  };

  render() {
    return null;
  }
}
