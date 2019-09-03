import React, { Component } from "react";
import { StyleSheet, View, Keyboard, Dimensions } from "react-native";
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  TapGestureHandler,
  State
} from "react-native-gesture-handler";
import Animated, { Easing } from "react-native-reanimated";
import {
  runDelay,
  preserveMultiplicativeOffset,
  preserveOffset,
  limit
} from "react-native-redash";
import { throttle } from "lodash";
import { SPACING } from "../../../lib/styles";

const SCREEN_DIMENSIONS = Dimensions.get("window");

const {
  set,
  cond,
  block,
  eq,
  add,
  Value,
  call,
  event,
  concat,
  multiply,
  clockRunning,
  startClock,
  stopClock,
  timing,
  debug
} = Animated;

export class MovableNode extends Component {
  constructor(props) {
    super(props);

    this._X = new Animated.Value(props.xLiteral);
    this._Y = new Animated.Value(props.yLiteral);
    this._R = new Animated.Value(props.rLiteral);
    this._Z = new Animated.Value(props.scaleLiteral);
    console.log(props.blockId);
    this.blockId = new Animated.Value(props.blockId);

    this.subscribeToKeyboard();

    this.handlePan = event(
      [
        {
          nativeEvent: {
            translationX: this._X,
            translationY: this._Y,
            state: this.panGestureState
          }
        }
      ],
      { useNativeDriver: true }
    );

    this.handleRotate = event(
      [
        {
          nativeEvent: {
            rotation: this._R,
            state: this.rotationGestureState
          }
        }
      ],
      { useNativeDriver: true }
    );

    this.handleZoom = event(
      [
        {
          nativeEvent: {
            scale: this._Z,
            state: this.scaleGestureState
          }
        }
      ],
      { useNativeDriver: true }
    );

    this.X = preserveOffset(this._X, this.panGestureState, props.x);

    this.Y = preserveOffset(this._Y, this.panGestureState, props.y);

    this.R = preserveOffset(this._R, this.rotationGestureState, props.r);
    this.Z = preserveMultiplicativeOffset(this._Z, this.scaleGestureState);

    this.handleTap = event(
      [
        {
          nativeEvent: ({ state }) =>
            cond([eq(state, State.END)], [call([], this.props.onTap)])
        }
      ],
      { useNativeDriver: true }
    );

    this.heightValue = new Animated.Value(props.maxY);

    this.translateX = new Animated.Value(props.xLiteral);
    this.translateY = new Animated.Value(props.yLiteral);
    this.scale = new Animated.Value(props.scaleLiteral);
    this.rotate = new Animated.Value(props.rLiteral);
  }

  _X: Animated.Value<number>;
  X: Animated.Value<number>;
  _Y: Animated.Value<number>;
  Y: Animated.Value<number>;
  _R: Animated.Value<number>;
  R: Animated.Value<number>;
  _Z: Animated.Value<number>;
  Z: Animated.Value<number>;
  panGestureState: Animated.Value<State> = new Animated.Value(
    State.UNDETERMINED
  );
  scaleGestureState: Animated.Value<State> = new Animated.Value(
    State.UNDETERMINED
  );
  rotationGestureState: Animated.Value<State> = new Animated.Value(
    State.UNDETERMINED
  );

  keyboardVisibleX = new Animated.Value(0);
  keyboardVisibleY = new Animated.Value(0);
  keyboardVisibleR = new Animated.Value(0);
  keyboardVisibleBottomMargin = new Animated.Value(0);
  keyboardVisibleScale = new Animated.Value(1.0);

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
  keyboardHidingValue = new Animated.Value(0);

  handleKeyboardWillChangeFrame = ({
    duration,
    easing,
    endCoordinates,
    startCoordinates
  }) => {};

  handleKeyboardWillHide = event => {
    if (this.props.isHidden) {
      return;
    }

    this.keyboardHidingValue.setValue(1);
    this.handleKeyboardAnimation(false, event.duration);
  };

  handleKeyboardDidHide = event => {
    this.keyboardVisibleValue.setValue(0);
    this.keyboardHidingValue.setValue(0);
  };

  handleKeyboardWillShow = event => {
    this.keyboardVisibleValue.setValue(1);
    this.keyboardHidingValue.setValue(0);
    this.handleKeyboardAnimation(true, event.duration);
  };

  handleKeyboardAnimation = (isShowing: boolean, duration) => {
    const {
      maxY,
      minY,
      xLiteral,
      yLiteral,
      rLiteral,
      scaleLiteral,
      disabled
    } = this.props;

    const multiplier = isShowing ? -1 : 0;

    const xValue = isShowing ? 15 : xLiteral;
    const yValue = isShowing ? 100 : yLiteral;
    const rValue = isShowing ? 0 : rLiteral;
    const scaleValue = isShowing ? 1 : scaleLiteral;

    const easing = Easing.elastic(0.5);

    Animated.timing(this.keyboardVisibleX, {
      duration,
      toValue: xValue,
      easing
    }).start();
    Animated.timing(this.keyboardVisibleY, {
      duration,
      toValue: yValue,
      easing
    }).start();
    Animated.timing(this.keyboardVisibleR, {
      duration,
      toValue: rValue,
      easing
    }).start();
    Animated.timing(this.keyboardVisibleScale, {
      duration,
      toValue: scaleValue,
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

  setupHandlers(props) {
    // this.X = props.x;
    // this.Y = props.y;
    // this.R = props.r;
    // this.Z = props.scale;
    // const offsetX = new Animated.Value(props.xLiteral);
    // const offsetY = new Animated.Value(props.yLiteral);
    // const offsetR = new Animated.Value(props.rLiteral);
    // const offsetZ = new Animated.Value(props.scaleLiteral);
    // this.handlePan = event(
    //   [
    //     {
    //       nativeEvent: ({ translationX: x, translationY: y, state }) =>
    //         block([
    //           set(this.X, add(x, offsetX)),
    //           set(this.Y, add(y, offsetY)),
    //           cond(eq(state, State.END), [
    //             set(offsetX, add(offsetX, x)),
    //             set(offsetY, add(offsetY, y)),
    //             positionUpdater
    //           ])
    //         ])
    //     }
    //   ],
    //   { useNativeDriver: true }
    // );
    // this.handleRotate = event(
    //   [
    //     {
    //       nativeEvent: ({ rotation: r, state }) =>
    //         block([
    //           set(this.R, add(r, offsetR)),
    //           cond(eq(state, State.END), [
    //             set(offsetR, add(offsetR, r)),
    //             positionUpdater
    //           ])
    //         ])
    //     }
    //   ],
    //   { useNativeDriver: true }
    // );
    // this.handleZoom = event(
    //   [
    //     {
    //       nativeEvent: ({ scale: z, state }) =>
    //         block([
    //           cond(eq(state, State.ACTIVE), set(this.Z, multiply(z, offsetZ))),
    //           cond(eq(state, State.END), [
    //             set(offsetZ, multiply(offsetZ, z)),
    //             positionUpdater
    //           ])
    //         ])
    //     }
    //   ],
    //   { useNativeDriver: true }
    // );
  }

  updatePosition = throttle(coords => {
    const [x, y, rotate, scale] = coords;
    if (this.props.isFocused) {
      return;
    }
    this.props.onChangePosition({ x, y, scale, rotate });
  }, 32);

  handleLayout = ({ nativeEvent: { bounds } }) => {
    this.bounds = bounds;
  };

  componentDidUpdate(prevProps) {
    if (prevProps.isFocused !== this.props.isFocused) {
      this.startBounds = this.bounds;
    }
  }

  rotationRef = React.createRef();
  panRef = React.createRef();
  pinchRef = React.createRef();
  tapRef = React.createRef();

  render() {
    const {
      x,
      y,
      scale,
      r,
      isDragEnabled,
      focusedBlockValue,
      waitFor = [],
      extraPadding
    } = this.props;

    return (
      <TapGestureHandler
        waitFor={[...waitFor, this.panRef, this.rotationRef, this.pinchRef]}
        ref={this.tapRef}
        enabled={isDragEnabled}
        onGestureEvent={this.handleTap}
        hitSlop={{ horizontal: extraPadding * -1, vertical: extraPadding * -1 }}
        onHandlerStateChange={this.handleTap}
      >
        <Animated.View style={{ flex: 0 }}>
          <Animated.Code>
            {() =>
              block([
                call([this.X, this.Y, this.R, this.Z], this.updatePosition),
                cond(
                  Animated.and(
                    Animated.or(
                      eq(focusedBlockValue, this.blockId),
                      eq(this.keyboardHidingValue, 1)
                    ),
                    eq(this.keyboardVisibleValue, 1)
                  ),
                  block([
                    set(this.rotate, this.keyboardVisibleR),
                    set(this.scale, this.keyboardVisibleScale),
                    set(this.translateY, this.keyboardVisibleY),
                    set(this.translateX, this.keyboardVisibleX)
                  ]),
                  block([
                    set(this.translateY, this.Y),
                    set(this.translateX, this.X),
                    set(this.rotate, this.R),
                    set(this.scale, this.Z),
                    set(this.keyboardVisibleX, this.X),
                    set(this.keyboardVisibleY, this.Y),
                    set(this.keyboardVisibleR, this.R),
                    set(this.keyboardVisibleScale, this.Z)
                  ])
                )
              ])
            }
          </Animated.Code>
          <PanGestureHandler
            ref={this.panRef}
            enabled={isDragEnabled}
            waitFor={waitFor}
            simultaneousHandlers={[this.rotationRef, this.pinchRef]}
            onGestureEvent={this.handlePan}
            onHandlerStateChange={this.handlePan}
          >
            <Animated.View style={{ flex: 0 }}>
              <PinchGestureHandler
                ref={this.pinchRef}
                enabled={isDragEnabled}
                waitFor={waitFor}
                simultaneousHandlers={[this.rotationRef, this.panRef]}
                onGestureEvent={this.handleZoom}
                onHandlerStateChange={this.handleZoom}
              >
                <Animated.View style={{ flex: 0 }}>
                  <RotationGestureHandler
                    ref={this.rotationRef}
                    enabled={isDragEnabled}
                    waitFor={waitFor}
                    simultaneousHandlers={[this.pinchRef, this.panRef]}
                    onGestureEvent={this.handleRotate}
                    onHandlerStateChange={this.handleRotate}
                  >
                    <Animated.View
                      ref={this.props.containerRef}
                      onLayout={this.handleLayout}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        transform: [
                          {
                            translateY: this.translateY
                          },
                          {
                            translateX: this.translateX
                          },
                          {
                            rotate: Animated.concat(this.rotate, "rad")
                          },
                          {
                            scale: this.scale
                          }
                        ]
                      }}
                    >
                      {this.props.children}
                    </Animated.View>
                  </RotationGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </TapGestureHandler>
    );
  }
}
