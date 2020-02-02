import * as React from "react";
import {
  Keyboard,
  Platform,
  LayoutAnimation,
  InteractionManagerStatic,
  Task,
  InteractionManager
} from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import { runTiming } from "react-native-redash";
import { Cancelable } from "lodash";

export class AnimatedKeyboardTracker extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.enabled) {
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
    Keyboard.addListener("keyboardDidShow", this.handleKeyboardDidShow);
    Keyboard.addListener("keyboardWillShow", this.handleKeyboardWillShow);
    Keyboard.addListener("keyboardDidHide", this.handleKeyboardDidHide);
    Keyboard.addListener(
      "keyboardWillChangeFrame",
      this.handleKeyboardWillChangeFrame
    );
    Keyboard.addListener("keyboardWillHide", this.handleKeyboardWillHide);

    if (this.keyboardHideInteractionHandle) {
      InteractionManager.clearInteractionHandle(
        this.keyboardHideInteractionHandle
      );

      this.keyboardHideInteractionHandle = null;
    }

    if (this.keyboardShowInteractionHandle) {
      InteractionManager.clearInteractionHandle(
        this.keyboardShowInteractionHandle
      );
      this.keyboardShowInteractionHandle = null;
    }
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

    if (this.keyboardHideInteractionHandle) {
      InteractionManager.clearInteractionHandle(
        this.keyboardHideInteractionHandle
      );

      this.keyboardHideInteractionHandle = null;
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
    if (this.keyboardShowInteractionHandle) {
      InteractionManager.clearInteractionHandle(
        this.keyboardShowInteractionHandle
      );
      this.keyboardShowInteractionHandle = null;
    }

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

    this.lastDuration = duration;
    if (isShowing) {
      this.lastShowingHeight = height;
      this.lastShownAt = time;

      if (!this.keyboardShowInteractionHandle) {
        this.keyboardShowInteractionHandle = InteractionManager.createInteractionHandle();
        InteractionManager.setDeadline(duration);
      }
    } else if (!isShowing) {
      this.lastHiddenAt = time;
      this.lastHidingHeight = height;

      if (!this.keyboardHideInteractionHandle) {
        this.keyboardHideInteractionHandle = InteractionManager.createInteractionHandle();
        InteractionManager.setDeadline(duration);
      }
    }

    this._durationValue.setValue(duration);

    if (this.props.keyboardVisibleValue) {
      this._keyboardVisibleValue.setValue(isShowing ? 1.0 : 0.0);
    }

    if (this.props.keyboardHeightValue) {
      this._keyboardHeightValue.setValue(isShowing ? height : 0);
    }

    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    let animationFrame = window.requestAnimationFrame(() => {
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

  keyboardShowInteractionHandle: number | null = null;
  keyboardHideInteractionHandle: number | null = null;

  render() {
    const {
      keyboardVisibleValue,
      keyboardHeightValue,
      animatedKeyboardVisibleValue
    } = this.props;

    const hasAnyValues =
      keyboardVisibleValue ||
      keyboardHeightValue ||
      animatedKeyboardVisibleValue;

    if (hasAnyValues) {
      return (
        <Animated.Code
          exec={Animated.block([
            keyboardVisibleValue
              ? Animated.onChange(
                  this._keyboardVisibleValue,
                  Animated.set(keyboardVisibleValue, this._keyboardVisibleValue)
                )
              : 0,

            animatedKeyboardVisibleValue
              ? Animated.set(
                  animatedKeyboardVisibleValue,
                  runTiming(
                    this.keyboardOpacityClock,
                    this._keyboardVisibleValue,
                    {
                      duration: this._durationValue,
                      toValue: this._keyboardVisibleValue,
                      easing: Easing.linear
                    }
                  )
                )
              : 0,

            keyboardHeightValue
              ? Animated.onChange(
                  this._keyboardHeightValue,
                  Animated.set(keyboardHeightValue, this._keyboardHeightValue)
                )
              : 0
          ])}
        />
      );
    }
  }
}
