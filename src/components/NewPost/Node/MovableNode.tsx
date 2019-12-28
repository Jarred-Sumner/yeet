import React, { Component } from "react";
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  State,
  TapGestureHandler
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { BoundsRect, isSameSize, totalX } from "../../../lib/Rect";
import { StyleSheet } from "react-native";
import { SCREEN_DIMENSIONS } from "../../../../config";
import {
  preserveOffset,
  preserveMultiplicativeOffset
} from "../../../lib/animations";
import { TransformableViewComponent } from "./TransformableView";

const transformableStyles = StyleSheet.create({
  topContainer: {
    position: "absolute",
    left: 0,
    top: 0
  },
  bottomContainer: {
    position: "absolute",
    left: 0
  }
});

export const TransformableView = React.forwardRef((props, ref) => {
  const {
    translateX = 0,
    translateY = 0,
    Component = TransformableViewComponent,
    onLayout,
    rotate = 0,
    zIndex,
    inputRef,
    scale = 1.0,
    keyboardVisibleValue,
    bottom = undefined,
    opacity = 1.0,
    rasterize,
    children
  } = props;

  const bottomContainerStyles = React.useMemo(
    () => [
      transformableStyles.bottomContainer,
      {
        opacity,
        bottom,
        zIndex,
        transform: [
          {
            translateY
          },
          {
            translateX
          },
          {
            scale
          },
          {
            rotate
          }
        ]
      }
    ],
    [opacity, bottom, zIndex, translateY, translateX, scale, rotate]
  );

  if (typeof bottom !== "undefined") {
    return (
      <Component
        ref={ref}
        onLayout={onLayout}
        shouldRasterizeIOS={rasterize}
        needsOffscreenAlphaCompositing={rasterize}
        inputRef={inputRef}
        style={bottomContainerStyles}
      >
        {children}
      </Component>
    );
  } else {
    return (
      <Component
        ref={ref}
        onLayout={onLayout}
        shouldRasterizeIOS={rasterize}
        needsOffscreenAlphaCompositing={rasterize}
        inputRef={inputRef}
        style={[
          transformableStyles.topContainer,
          {
            opacity,
            zIndex,
            transform: [
              {
                translateY
              },
              {
                translateX
              },
              {
                scale
              },
              {
                rotate
              }
            ]
          }
        ]}
      >
        {children}
      </Component>
    );
  }
});

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

const keyboardVisibleInterpolater = Animated.proc(
  (keyboardVisibleValue, start, end) =>
    Animated.interpolate(keyboardVisibleValue, {
      inputRange: [0, 1],
      outputRange: [start, end],
      extrapolate: Animated.Extrapolate.CLAMP
    })
);

type Props = {
  xLiteral: number;
  yLiteral: number;
  rLiteral: number;
  scaleLiteral: number;
  isTextBlock: boolean;
  blockId: string;
  x: Animated.Value<number>;
  y: Animated.Value<number>;
  r: Animated.Value<number>;
  scale: Animated.Value<number>;
  keyboardVisibleValue: Animated.Value<number>;
};

const styles = StyleSheet.create({
  gestureView: {
    flex: 0
  }
});

export class MovableNode extends Component<Props> {
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

    this.X = Animated.round(
      preserveOffset(this._X, this.panGestureState, props.x)
    );
    this.Y = Animated.round(
      preserveOffset(this._Y, this.panGestureState, props.y)
    );

    this.R = preserveOffset(this._R, this.rotationGestureState, props.r);

    this.Z = Animated.min(
      preserveMultiplicativeOffset(this._Z, this.scaleGestureState),
      props.maxScale || 100
    );

    this.handleTap = event(
      [
        {
          nativeEvent: ({ state }) =>
            cond(
              [Animated.and(eq(state, State.END))],
              [call([], this.props.onTap)]
            )
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

    this.keyboardVisibleFocusedValue = Animated.cond(
      eq(this.isFocusedValue, 1),
      props.keyboardVisibleValue,
      0
    );

    this._translateX = keyboardVisibleInterpolater(
      this.keyboardVisibleFocusedValue,
      this.X,
      props.extraPadding || 15
    );

    this.bottomValue = props.keyboardHeightValue //&& props.isTextBlock
      ? Animated.round(
          keyboardVisibleInterpolater(
            this.keyboardVisibleFocusedValue,
            0,
            Animated.multiply(
              Animated.sub(
                SCREEN_DIMENSIONS.height,
                props.keyboardHeightValue,
                props.topInsetValue || 0
              ),
              -1
            )
          )
        )
      : null;

    this._translateY = keyboardVisibleInterpolater(
      this.keyboardVisibleFocusedValue,
      this.Y,
      props.paddingTop
    );

    this._scale = keyboardVisibleInterpolater(
      this.keyboardVisibleFocusedValue,
      this.Z,
      1
    );

    this._rotate = keyboardVisibleInterpolater(
      this.keyboardVisibleFocusedValue,
      Animated.concat(this.R, "rad"),
      Animated.concat(0, "rad")
    );

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

  static defaultProps = {
    minY: 0,
    minX: -20,
    maxX: SCREEN_DIMENSIONS.width,
    maxY: 9999,
    maxScale: 99
  };

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

  _isMounted = true;

  updatePosition = coords => {
    if (!this._isMounted) {
      return;
    }

    const [x, y, rotate, scale, panGestureState, absoluteX, absoluteY] = coords;
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

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.waitFor !== this.props.waitFor) {
      this.tapGestureWaitFor = [
        ...this.props.waitFor,
        this.panRef,
        this.rotationRef,
        this.pinchRef
      ];
    }
  }

  rotationRef = React.createRef();
  panRef = React.createRef();
  pinchRef = React.createRef();
  tapRef = React.createRef();
  panGestureHandlers = [this.rotationRef, this.pinchRef];
  pinchGestureHandlers = [this.rotationRef, this.panRef];
  rotationGestureHandlers = [this.pinchRef, this.panRef];
  tapGestureWaitFor = [
    ...this.props.waitFor,
    this.panRef,
    this.rotationRef,
    this.pinchRef
  ];

  render() {
    const {
      x,
      y,
      scale,
      r,
      isDragEnabled,
      focusedBlockValue,
      waitFor = [],
      keyboardVisibleValue,
      keyboardHeightValue,
      inputRef,
      extraPadding,
      isHidden
    } = this.props;

    return (
      <>
        <TapGestureHandler
          waitFor={this.tapGestureWaitFor}
          ref={this.tapRef}
          enabled={isDragEnabled}
          onGestureEvent={this.handleTap}
          onHandlerStateChange={this.handleTap}
        >
          <Animated.View style={styles.gestureView}>
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
                  this.rotationGestureState,
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
                  this.scaleGestureState,
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
              simultaneousHandlers={this.panGestureHandlers}
              onGestureEvent={this.handlePan}
              onHandlerStateChange={this.handlePan}
            >
              <Animated.View style={styles.gestureView}>
                <PinchGestureHandler
                  ref={this.pinchRef}
                  enabled={isDragEnabled}
                  waitFor={waitFor}
                  simultaneousHandlers={this.pinchGestureHandlers}
                  onGestureEvent={this.handleZoom}
                  onHandlerStateChange={this.handleZoom}
                >
                  <Animated.View style={styles.gestureView}>
                    <RotationGestureHandler
                      ref={this.rotationRef}
                      enabled={isDragEnabled}
                      waitFor={waitFor}
                      simultaneousHandlers={this.rotationGestureHandlers}
                      onGestureEvent={this.handleRotate}
                      onHandlerStateChange={this.handleRotate}
                    >
                      <Animated.View style={styles.gestureView}>
                        <TransformableView
                          ref={this.props.containerRef}
                          onLayout={this.handleLayout}
                          opacity={isHidden ? 0 : 1}
                          translateY={this.translateY}
                          translateX={this.translateX}
                          bottom={this.bottomValue}
                          keyboardVisibleValue={keyboardVisibleValue}
                          inputRef={inputRef}
                          rotate={this.rotate}
                          rasterize={false}
                          scale={this.scale}
                        >
                          {this.props.children}
                        </TransformableView>
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
