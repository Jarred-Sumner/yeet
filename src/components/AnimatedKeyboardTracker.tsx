import * as React from "react";
import { Keyboard, Platform, LayoutAnimation } from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import { runTiming } from "react-native-redash";

export class AnimatedKeyboardTracker extends React.Component {
  constructor(props) {
    super(props);

    if (props.enabled) {
      this.subscribeToKeyboard();
    }
  }
  static defaultProps = {
    keyboardVisibleValue: null,
    keyboardHeightValue: null,
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
    if (Platform.OS === "android") {
      Keyboard.addListener("keyboardDidShow", this.handleKeyboardDidShow);
    }
    Keyboard.addListener("keyboardWillShow", this.handleKeyboardWillShow);
    Keyboard.addListener("keyboardDidHide", this.handleKeyboardDidHide);
    Keyboard.addListener(
      "keyboardWillChangeFrame",
      this.handleKeyboardWillChangeFrame
    );
    Keyboard.addListener("keyboardWillHide", this.handleKeyboardWillHide);
  };

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

    if (Platform.OS === "android") {
      this.handleKeyboardAnimation(
        false,
        event.duration,
        event.endCoordinates.height
      );
    }
  };

  handleKeyboardDidShow = event => {
    if (Platform.OS === "android") {
      this.handleKeyboardAnimation(
        true,
        event.duration,
        event.endCoordinates.height
      );
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

  keyboardHeightClock = new Animated.Clock();
  keyboardOpacityClock = new Animated.Clock();
  _keyboardVisibleValue = new Animated.Value(0);
  _durationValue = new Animated.Value(300);
  _keyboardHeightValue = new Animated.Value(0);
  lastShowingHeight = 0;
  lastHidingHeight = 0;
  lastShownAt: number = 0;
  lastHiddenAt: number = 0;
  lastDuration = 250;

  handleKeyboardAnimation = (isShowing: boolean, _duration, height = 0) => {
    const { keyboardVisibleValue, keyboardHeightValue } = this.props;

    const easing = Easing.linear;

    if (this.animationFrame > -1) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = -1;
    }

    const duration = Platform.select({
      ios: _duration,
      android: 100
    });

    const time = new Date().getTime();
    const lastShownDiff = time - this.lastShownAt;
    const lastHiddenDiff = time - this.lastHiddenAt;

    const isShowingHeightDifferent =
      isShowing &&
      (this.lastShowingHeight !== height ||
        lastShownDiff > this.lastDuration * 3);
    const isHidingHeightDifferent =
      !isShowing &&
      (this.lastHidingHeight !== height ||
        lastHiddenDiff > this.lastDuration * 3);

    const needsAnimation = isShowingHeightDifferent || isHidingHeightDifferent;
    if (!needsAnimation) {
      return;
    }

    LayoutAnimation.configureNext({
      type: LayoutAnimation.Types.keyboard,
      duration
    });

    this.lastDuration = duration;
    if (isShowing) {
      this.lastShowingHeight = height;
      this.lastShownAt = time;
    } else if (!isShowing) {
      this.lastHiddenAt = time;
      this.lastHidingHeight = height;
    }

    this._durationValue.setValue(duration);

    let animationFrame = window.requestAnimationFrame(() => {
      if (this.props.keyboardVisibleValue) {
        this._keyboardVisibleValue.setValue(isShowing ? 1.0 : 0.0);
      }

      if (this.props.keyboardHeightValue) {
        this._keyboardHeightValue.setValue(isShowing ? height : 0);
      }

      if (animationFrame === this.animationFrame) {
        this.animationFrame = null;
        animationFrame = null;
      }
    });

    this.animationFrame = animationFrame;
  };

  unsubscribeToKeyboard = () => {
    Keyboard.removeListener("keyboardWillShow", this.handleKeyboardWillShow);
    if (Platform.OS === "android") {
      Keyboard.removeListener("keyboardDidShow", this.handleKeyboardDidShow);
    }
    Keyboard.removeListener("keyboardDidHide", this.handleKeyboardDidHide);
    Keyboard.removeListener(
      "keyboardWillChangeFrame",
      this.handleKeyboardWillChangeFrame
    );
    Keyboard.removeListener("keyboardWillHide", this.handleKeyboardWillHide);
    this.isTracking = false;
  };

  render() {
    if (this.props.keyboardVisibleValue && this.props.keyboardHeightValue) {
      return (
        <Animated.Code
          exec={Animated.block([
            Animated.set(
              this.props.keyboardVisibleValue,
              runTiming(this.keyboardOpacityClock, this._keyboardVisibleValue, {
                duration: this._durationValue,
                toValue: this._keyboardVisibleValue,
                easing: Easing.linear
              })
            ),
            // Animated.set(
            //   this.props.keyboardVisibleValue,
            //   this._keyboardVisibleValue
            // ),
            Animated.set(
              this.props.keyboardHeightValue,
              this._keyboardHeightValue
            )
            // Animated.set(
            //   this.props.keyboardHeightValue,
            //   runTiming(this.keyboardHeightClock, this._keyboardHeightValue, {
            //     duration: this._durationValue,
            //     toValue: this._keyboardHeightValue,
            //     easing: Easing.linear
            //   })
            // )
          ])}
        />
      );
    } else if (this.props.keyboardVisibleValue) {
      return (
        <Animated.Code
          exec={Animated.block([
            Animated.set(
              this.props.keyboardVisibleValue,
              runTiming(this.keyboardOpacityClock, this._keyboardVisibleValue, {
                duration: this._durationValue,
                toValue: this._keyboardVisibleValue,
                easing: Easing.linear
              })
            )
          ])}
        />
      );
    } else if (this.props.keyboardHeightValue) {
      return (
        <Animated.Code
          exec={Animated.block([
            Animated.set(
              this.props.keyboardHeightValue,
              runTiming(this.keyboardHeightClock, this._keyboardHeightValue, {
                duration: this._durationValue,
                toValue: this._keyboardHeightValue,
                easing: Easing.linear
              })
            ),
            Animated.set(
              this.props.keyboardHeightValue,
              this._keyboardHeightValue
            )
          ])}
        />
      );
    } else {
      return null;
    }
  }
}
