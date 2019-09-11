import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Keyboard,
  Dimensions,
  InteractionManager
} from "react-native";
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
import { BoundsRect, isSameSize, totalY, totalX } from "../../../lib/Rect";

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

type Props = {
  xLiteral: number;
  yLiteral: number;
  rLiteral: number;
  scaleLiteral: number;
  blockId: string;
  x: Animated.Value<number>;
  y: Animated.Value<number>;
  r: Animated.Value<number>;
  scale: Animated.Value<number>;
  keyboardVisibleValue: Animated.Value<number>;
};

export class MovableNode extends Component<Props> {
  adjustedX = new Animated.Value(0);
  adjustedY = new Animated.Value(0);
  absoluteX = new Animated.Value(0);
  absoluteY = new Animated.Value(0);

  constructor(props) {
    super(props);

    this._X = new Animated.Value(props.xLiteral);
    this._Y = new Animated.Value(props.yLiteral);
    this._R = new Animated.Value(props.rLiteral);
    this._Z = new Animated.Value(props.scaleLiteral);

    this.blockId = new Animated.Value(props.blockId.hashCode());

    this.handlePan = event(
      [
        {
          nativeEvent: {
            translationX: this._X,
            translationY: this._Y,
            absoluteX: this.absoluteX,
            absoluteY: this.absoluteY,
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

    this.X = Animated.add(
      preserveOffset(this._X, this.panGestureState, props.x),
      this.adjustedX
    );

    this.Y = Animated.add(
      preserveOffset(this._Y, this.panGestureState, props.y),
      this.adjustedY
    );

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
    this.wasFocused = new Animated.Value(0);
    this.isFocusedValue = Animated.or(
      eq(this.wasFocused, 1),
      eq(props.focusedBlockValue, this.blockId)
    );

    this._translateX = this.props.keyboardVisibleValue.interpolate({
      inputRange: [0, 1],
      outputRange: [this.X, 15]
    });

    this._translateY = this.props.keyboardVisibleValue.interpolate({
      inputRange: [0, 1],
      outputRange: [this.Y, 115]
    });
    this._scale = this.props.keyboardVisibleValue.interpolate({
      inputRange: [0, 1],
      outputRange: [this.Z, 1]
    });

    this._rotate = this.props.keyboardVisibleValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Animated.concat(this.R, "rad"), Animated.concat(0, "rad")]
    });

    this.translateX = Animated.cond(
      this.isFocusedValue,
      this._translateX,
      this.X
    );

    this.translateY = Animated.cond(
      this.isFocusedValue,
      this._translateY,
      this.Y
    );

    this.scale = Animated.cond(this.isFocusedValue, this._scale, this.Z);
    this.rotate = Animated.cond(
      this.isFocusedValue,
      this._rotate,
      Animated.concat(this.R, "rad")
    );
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

  updatePosition = coords => {
    const [x, y, rotate, scale, panGestureState, absoluteX, absoluteY] = coords;
    // console.log({ x, y });
    this.props.onChangePosition({
      x,
      y,
      scale,
      rotate,
      absoluteX,
      absoluteY,
      isPanning:
        panGestureState === State.ACTIVE || panGestureState === State.BEGAN
    });
  };

  handleLayout = ({ nativeEvent: { layout: bounds } }) => {
    this.bounds = bounds;
    if (!this.startBounds) {
      this.startBounds = bounds;
    }
  };

  bounds: BoundsRect | null = null;
  startBounds: BoundsRect | null = null;
  _adjustedX = 0;

  adjustPositionAfterResize = (start: BoundsRect, end: BoundsRect) => {
    const { xLiteral: x, yLiteral: y } = this.props;

    const oldMaxX = totalX(start) + (x - this._adjustedX);
    const newMaxX = totalX(end) + (x - this._adjustedX);

    let adjustedX = 0;
    if (newMaxX > oldMaxX) {
      adjustedX = (newMaxX - oldMaxX) / -2;
    } else {
      adjustedX = (oldMaxX - newMaxX) / -2;
    }

    this._adjustedX = adjustedX;
    this.adjustedX.setValue(adjustedX);
  };

  componentDidUpdate(prevProps) {
    if (prevProps.isFocused !== this.props.isFocused) {
      if (!this.props.isFocused && !isSameSize(this.startBounds, this.bounds)) {
        this.adjustPositionAfterResize(this.startBounds, this.bounds);
      }

      this.startBounds = this.bounds;
    }

    if (prevProps.isHidden !== this.props.isHidden) {
      // window.setTimeout(() => {
      //   this.visibilityValue.setValue(this.props.isHidden ? 0 : 1);
    }
  }

  rotationRef = React.createRef();
  panRef = React.createRef();
  pinchRef = React.createRef();
  tapRef = React.createRef();
  keyboardDirection = new Animated.Value(1);

  render() {
    const {
      x,
      y,
      scale,
      r,
      isDragEnabled,
      focusedBlockValue,
      waitFor = [],
      extraPadding,
      isHidden
    } = this.props;

    return (
      <>
        <TapGestureHandler
          waitFor={[...waitFor, this.panRef, this.rotationRef, this.pinchRef]}
          ref={this.tapRef}
          enabled={isDragEnabled}
          onGestureEvent={this.handleTap}
          hitSlop={{
            horizontal: extraPadding * -1,
            vertical: extraPadding * -1
          }}
          onHandlerStateChange={this.handleTap}
        >
          <Animated.View style={{ flex: 0 }}>
            <Animated.Code
              exec={Animated.block([
                Animated.onChange(
                  this.panGestureState,
                  Animated.call(
                    [
                      this.X,
                      this.Y,
                      this.R,
                      this.Z,
                      this.panGestureState,
                      this.absoluteX,
                      this.absoluteY
                    ],
                    this.updatePosition
                  )
                ),
                Animated.onChange(
                  this.X,
                  Animated.call(
                    [
                      this.X,
                      this.Y,
                      this.R,
                      this.Z,
                      this.panGestureState,
                      this.absoluteX,
                      this.absoluteY
                    ],
                    this.updatePosition
                  )
                ),
                Animated.onChange(
                  this.Y,
                  Animated.call(
                    [
                      this.X,
                      this.Y,
                      this.R,
                      this.Z,
                      this.panGestureState,
                      this.absoluteX,
                      this.absoluteY
                    ],
                    this.updatePosition
                  )
                ),
                Animated.onChange(
                  this.absoluteX,
                  Animated.set(this.props.absoluteX, this.absoluteX)
                ),
                Animated.onChange(
                  this.absoluteY,
                  Animated.set(this.props.absoluteY, this.absoluteY)
                ),
                Animated.cond(
                  Animated.and(
                    Animated.greaterThan(this.props.keyboardVisibleValue, 0),
                    Animated.eq(focusedBlockValue, this.blockId)
                  ),
                  [set(this.wasFocused, 1)]
                ),
                Animated.cond(
                  Animated.and(
                    Animated.eq(this.props.keyboardVisibleValue, 0),
                    Animated.eq(focusedBlockValue, -1)
                  ),
                  [set(this.wasFocused, 0)]
                )
              ])}
            />

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
                          opacity: isHidden ? 0 : 1,
                          transform: [
                            {
                              translateY: this.translateY
                            },
                            {
                              translateX: this.translateX
                            },
                            {
                              rotate: this.rotate
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
      </>
    );
  }
}
