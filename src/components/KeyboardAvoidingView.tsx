import { Keyboard, LayoutAnimation, Platform, StyleSheet } from "react-native";
import React from "react";
import Animated from "react-native-reanimated";

const View = Animated.View;

/**
 * View that moves out of the way when the keyboard appears by automatically
 * adjusting its height, position, or bottom padding.
 */
export class KeyboardAvoidingView extends React.Component {
  static defaultProps = {
    enabled: true,
    keyboardVerticalOffset: 0
  };

  _frame = null;
  _subscriptions = [];

  _initialFrameHeight = 0;

  constructor(props) {
    super(props);
    this.state = { bottom: 0 };
    this.viewRef = React.createRef();
  }

  _relativeKeyboardHeight(keyboardFrame) {
    const frame = this._frame;
    if (!frame || !keyboardFrame) {
      return 0;
    }

    const keyboardY = keyboardFrame.screenY - this.props.keyboardVerticalOffset;

    // Calculate the displacement needed for the view such that it
    // no longer overlaps with the keyboard
    return Math.max(frame.y + frame.height - keyboardY, 0);
  }

  _onKeyboardChange = event => {
    if (event == null) {
      this.setState({ bottom: 0 });
      return;
    }

    const { duration, easing, endCoordinates } = event;
    const height = this._relativeKeyboardHeight(endCoordinates);

    this.props.bottomOffsetValue.setValue(height);
  };

  _onLayout = event => {
    this._frame = event.nativeEvent.layout;
    if (!this._initialFrameHeight) {
      // save the initial frame height, before the keyboard is visible
      this._initialFrameHeight = this._frame.height;
    }
  };

  componentDidMount() {
    if (Platform.OS === "ios") {
      this._subscriptions = [
        Keyboard.addListener("keyboardWillChangeFrame", this._onKeyboardChange)
      ];
    } else {
      this._subscriptions = [
        Keyboard.addListener("keyboardDidHide", this._onKeyboardChange),
        Keyboard.addListener("keyboardDidShow", this._onKeyboardChange)
      ];
    }
  }

  componentWillUnmount() {
    this._subscriptions.forEach(subscription => {
      subscription.remove();
    });
  }

  render() {
    const {
      behavior,
      children,
      contentContainerStyle,
      enabled,
      keyboardVerticalOffset,
      style,
      ...props
    } = this.props;

    return (
      <View
        ref={this.viewRef}
        style={style}
        onLayout={this._onLayout}
        {...props}
      >
        {children}
      </View>
    );
  }
}

export default KeyboardAvoidingView;
