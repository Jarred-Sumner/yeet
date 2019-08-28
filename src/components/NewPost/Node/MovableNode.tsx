import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  TapGestureHandler,
  State
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import {
  runDelay,
  preserveMultiplicativeOffset,
  preserveOffset,
  limit
} from "react-native-redash";
import { throttle } from "lodash";

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
  multiply
} = Animated;

export class MovableNode extends Component {
  constructor(props) {
    super(props);

    this._X = new Animated.Value(props.xLiteral);
    this._Y = new Animated.Value(props.yLiteral);
    this._R = new Animated.Value(props.rLiteral);
    this._Z = new Animated.Value(props.scaleLiteral);

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
    this.props.onChangePosition({ x, y, scale, rotate });
  }, 32);

  componentDidUpdate(prevProps) {}

  rotationRef = React.createRef();
  panRef = React.createRef();
  pinchRef = React.createRef();
  tapRef = React.createRef();

  render() {
    const { x, y, scale, r, isDragEnabled, waitFor = [] } = this.props;

    return (
      <TapGestureHandler
        waitFor={[...waitFor, this.panRef, this.rotationRef, this.pinchRef]}
        ref={this.tapRef}
        enabled={isDragEnabled}
        onGestureEvent={this.handleTap}
        onHandlerStateChange={this.handleTap}
      >
        <Animated.View style={{ flex: 0 }}>
          <Animated.Code>
            {() =>
              block([
                call([this.X, this.Y, this.R, this.Z], this.updatePosition)
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
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transform: [
                          { translateX: this.X },
                          { translateY: this.Y },
                          {
                            rotate: Animated.concat(this.R, "rad")
                          },
                          { scale: this.Z }
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
