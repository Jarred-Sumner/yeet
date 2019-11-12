import * as React from "react";
import { Keyboard } from "react-native";
import Animated, { Easing } from "react-native-reanimated";

export class AnimatedKeyboardTracker extends React.Component {
  constructor(props) {
    super(props);

    if (props.enabled) {
      this.subscribeToKeyboard();
    }
  }
  static defaultProps = {
    keyboardVisibleValue: new Animated.Value(0),
    enabled: true,
    onKeyboardHide: () => {},
    onKeyboardShow: () => {}
  };

  isTracking = false;

  componentWillUnmount() {
    this.unsubscribeToKeyboard();
  }

  componentDidUpate(prevProps) {
    if (prevProps.enabled !== this.props.enabled) {
      if (this.props.enabled && !this.isTracking) {
        this.unsubscribeToKeyboard();
      } else if (!this.props.enabled && this.isTracking) {
        this.subscribeToKeyboard();
      }
    }
  }

  subscribeToKeyboard = () => {
    this.isTracking = true;
    Keyboard.addListener("keyboardWillShow", this.handleKeyboardWillShow);
    Keyboard.addListener("keyboardDidHide", this.handleKeyboardDidHide);
    Keyboard.addListener(
      "keyboardWillChangeFrame",
      this.handleKeyboardWillChangeFrame
    );
    Keyboard.addListener("keyboardWillHide", this.handleKeyboardWillHide);
  };

  keyboardVisibleValue = new Animated.Value(0);

  handleKeyboardWillChangeFrame = evt => {
    this.props.onKeyboardWillChangeFrame &&
      evt &&
      this.props.onKeyboardWillChangeFrame(evt);
  };

  handleKeyboardWillHide = event => {
    this.handleKeyboardAnimation(
      false,
      event.duration,
      event.endCoordinates.height
    );

    this.props.onKeyboardHide && this.props.onKeyboardHide(event, false);
  };

  handleKeyboardDidHide = event => {
    if (this.props.onKeyboardHide) {
      this.props.onKeyboardHide(event, true);
    }
  };

  handleKeyboardWillShow = event => {
    this.handleKeyboardAnimation(
      true,
      event.duration,
      event.endCoordinates.height
    );
    this.props.onKeyboardShow && this.props.onKeyboardShow(event);
  };

  componentWillMount() {
    if (this.animationFrame > -1) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = -1;
    }
  }

  animationFrame = -1;
  handleKeyboardAnimation = (isShowing: boolean, duration, height = 0) => {
    const { keyboardVisibleValue, keyboardHeightValue } = this.props;

    const easing = Easing.elastic(0.5);

    if (this.animationFrame > -1) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = -1;
    }
    this.animationFrame = window.requestAnimationFrame(() => {
      Animated.timing(keyboardVisibleValue, {
        duration,
        toValue: isShowing ? 1.0 : 0.0,
        easing
      }).start();

      if (keyboardHeightValue) {
        Animated.timing(keyboardHeightValue, {
          duration,
          toValue: isShowing ? height : 0.0,
          easing
        }).start();
      }
    });
  };

  unsubscribeToKeyboard = () => {
    Keyboard.removeListener("keyboardWillShow", this.handleKeyboardWillShow);
    Keyboard.removeListener("keyboardDidHide", this.handleKeyboardDidHide);
    Keyboard.removeListener(
      "keyboardWillChangeFrame",
      this.handleKeyboardWillChangeFrame
    );
    Keyboard.removeListener("keyboardWillHide", this.handleKeyboardWillHide);
    this.isTracking = false;
  };

  render() {
    return null;
  }
}
