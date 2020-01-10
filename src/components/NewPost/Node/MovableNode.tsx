import React, { Component } from "react";
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  State,
  TapGestureHandler
} from "react-native-gesture-handler";
import Animated, { Transitioning } from "react-native-reanimated";
import { BoundsRect, isSameSize, totalX } from "../../../lib/Rect";
import { StyleSheet } from "react-native";
import { SCREEN_DIMENSIONS } from "../../../../config";
import {
  preserveOffset,
  preserveMultiplicativeOffset
} from "../../../lib/animations";
import { TransformableViewComponent } from "./TransformableView";
import { FocusType } from "../../../lib/buildPost";

const transformableStyles = StyleSheet.create({
  topContainer: {
    position: "absolute",
    left: 0,
    top: 0
  },
  bottomContainer: {
    position: "absolute"
  }
});

export const TransformableView = React.forwardRef((props, ref) => {
  const {
    translateX = 0,
    translateY = 0,
    Component = TransformableViewComponent,
    onLayout,
    onTransform,
    onTransformLayout,
    rotate = 0,
    unfocusedBottom,
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
        left: translateX,
        zIndex,
        transform: [
          // {
          //   translateY
          // },
          // {
          //   translateX
          // },
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
        onTransformLayout={onTransformLayout}
        inputRef={inputRef}
        onTransform={onTransform}
        unfocusedBottom={unfocusedBottom}
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
        onTransform={onTransform}
        unfocusedBottom={unfocusedBottom}
        onTransformLayout={onTransformLayout}
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

const keyboardVisibleCond = Animated.proc((keyboardVisibleValue, start, end) =>
  Animated.cond(Animated.eq(keyboardVisibleValue, 1), end, start)
);

const fixedSizeInterpolator = (fixedSize, yes, no) =>
  fixedSize === 1 ? yes : no;

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
  },
  childGestureView: {
    position: "relative",
    flex: 0
  },
  overlaySheet: {
    zIndex: 0,
    position: "absolute",
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12, 0, 12, 0.75)"
  },
  lowerGestureView: {
    flex: 0,
    zIndex: -1
  }
});

export class MovableNode extends Component<Props> {
  absoluteX = new Animated.Value(0);
  absoluteY = new Animated.Value(0);

  constructor(props) {
    super(props);

    const fixedSizeValue = props.isFixedSize ? 1 : 0;

    this.panGestureState = new Animated.Value(State.UNDETERMINED);
    this.scaleGestureState = new Animated.Value(State.UNDETERMINED);
    this.rotationGestureState = new Animated.Value(State.UNDETERMINED);
    this.isDoneGesturingValue = Animated.cond(
      Animated.and(
        Animated.eq(this.panGestureState, State.END),
        Animated.eq(this.scaleGestureState, State.END),
        Animated.eq(this.rotationGestureState, State.END)
      ),
      1,
      0
    );
    this.isCurrentlyGesturingValue = Animated.cond(
      Animated.or(
        Animated.eq(this.panGestureState, State.ACTIVE),
        Animated.eq(this.panGestureState, State.BEGAN),
        Animated.eq(this.scaleGestureState, State.ACTIVE),
        Animated.eq(this.scaleGestureState, State.BEGAN),
        Animated.eq(this.rotationGestureState, State.ACTIVE),
        Animated.eq(this.rotationGestureState, State.BEGAN)
      ),
      1,
      0
    );

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
            Animated.block(
              cond([eq(state, State.END)], [call([], this.props.onTap)])
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

    this.keyboardVisibleFocusedValue = Animated.block([
      Animated.cond(
        eq(this.isFocusedValue, 1),
        [props.keyboardVisibleValue],
        [0]
      )
    ]);

    this._translateX = keyboardVisibleCond(
      this.keyboardVisibleFocusedValue,
      this.X,
      0
    );

    this.overlayOpacity = keyboardVisibleInterpolater(
      this.keyboardVisibleFocusedValue,
      0,
      1
    );

    // this.bottomValue = props.keyboardHeightValue //&& props.isTextBlock
    //   ? keyboardVisibleInterpolater(
    //       this.keyboardVisibleFocusedValue,
    //       0,
    //       Animated.multiply(
    //         Animated.sub(
    //           SCREEN_DIMENSIONS.height,
    //           props.keyboardHeightValue,
    //           props.topInsetValue
    //         ),
    //         -1
    //       )
    //     )
    //   : 0;
    //  = 0;

    this.unfocusedBottomValue = Animated.multiply(this.Y, -1);

    this.bottomValue = fixedSizeInterpolator(
      fixedSizeValue,
      this.unfocusedBottomValue,
      keyboardVisibleInterpolater(
        props.keyboardVisibleValue,
        this.unfocusedBottomValue,
        Animated.add(Animated.multiply(props.keyboardHeightValue, -1), 120)
      )
    );

    this._scale = fixedSizeInterpolator(
      fixedSizeValue,
      this.Z,
      keyboardVisibleCond(this.keyboardVisibleFocusedValue, this.Z, 1)
    );

    this._rotate = fixedSizeInterpolator(
      fixedSizeValue,
      Animated.concat(this.R, "rad"),
      keyboardVisibleCond(
        this.keyboardVisibleFocusedValue,
        Animated.concat(this.R, "rad"),
        Animated.concat(0, "rad")
      )
    );

    this.translateX = fixedSizeInterpolator(
      fixedSizeValue,
      this.X,
      keyboardVisibleInterpolater(props.keyboardVisibleValue, this.X, 0)
    );

    this.translateY = 0;

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
  panGestureState: Animated.Value<State>;
  scaleGestureState: Animated.Value<State>;
  rotationGestureState: Animated.Value<State>;
  isDoneGesturingValue: Animated.Value<State>;
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
      rotate
    });
  };

  startUpdatePosition = ([absoluteX, absoluteY]) => {
    if (!this._isMounted) {
      return;
    }

    this.props.onChangePosition({
      x: this.props.xLiteral,
      y: this.props.yLiteral,
      scale: this.props.scaleLiteral,
      rotate: this.props.rLiteral,
      absoluteX,
      absoluteY,
      isPanning: true
    });
  };

  handleLayoutTransform = ({ nativeEvent: { layout, from } }) => {
    console.log({ layout, from });
  };

  // handleLayoutTransform = ({
  //   nativeEvent: { layout, from }
  // }: {
  //   nativeEvent: { layout: BoundsRect; from: BoundsRect };
  // }) => {
  //   let adjustments = {
  //     x: 0,
  //     y: 0
  //   };

  //   const newMaxY = layout.y + layout.height;
  //   const newMaxX = layout.x + layout.width;
  //   const oldMaxY = from.y + from.height;
  //   const oldMaxX = from.x + from.width;

  //   if (layout.y < 0) {
  //     adjustments.y = (Math.abs(layout.y) - Math.abs(from.y)) / -2;
  //   }

  //   if (adjustments.x !== 0 || adjustments.y !== 0) {
  //     this.panGestureState.setValue(State.ACTIVE);
  //     window.requestAnimationFrame(() => {
  //       if (adjustments.x !== 0) {
  //         this._X.setValue(this.props.xLiteral + adjustments.x);
  //       }

  //       if (adjustments.y !== 0) {
  //         this._Y.setValue(this.props.yLiteral + adjustments.y);
  //       }

  //       this.panGestureState.setValue(State.END);
  //     });
  //   }

  //   console.log({ adjustments, from, layout });
  // };

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

  handlePanChange = ([absoluteX, absoluteY, panGestureState]) => {
    this.props.onPan({
      absoluteX,
      absoluteY,
      isPanning:
        panGestureState === State.ACTIVE || panGestureState === State.BEGAN
    });
  };

  render() {
    const {
      x,
      y,
      scale,
      r,
      isDragEnabled,
      isPanning,
      isOtherNodeFocused,
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
        <Animated.Code
          exec={Animated.block([
            Animated.onChange(
              this.isDoneGesturingValue,
              Animated.cond(
                Animated.eq(this.isDoneGesturingValue, 1),
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
              )
            ),
            Animated.onChange(
              this.isCurrentlyGesturingValue,

              Animated.call(
                [this.absoluteX, this.absoluteY, this.panGestureState],
                this.handlePanChange
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

        <TapGestureHandler
          waitFor={this.tapGestureWaitFor}
          ref={this.tapRef}
          enabled={isDragEnabled}
          onGestureEvent={this.handleTap}
          onHandlerStateChange={this.handleTap}
        >
          <Animated.View
            style={isHidden ? styles.lowerGestureView : styles.gestureView}
          >
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
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.overlaySheet,
                        {
                          opacity: this.overlayOpacity
                        }
                      ]}
                    />

                    <RotationGestureHandler
                      ref={this.rotationRef}
                      enabled={isDragEnabled}
                      waitFor={waitFor}
                      simultaneousHandlers={this.rotationGestureHandlers}
                      onGestureEvent={this.handleRotate}
                      onHandlerStateChange={this.handleRotate}
                    >
                      <Animated.View style={styles.childGestureView}>
                        <TransformableView
                          ref={this.props.containerRef}
                          opacity={isHidden ? 1 : isOtherNodeFocused ? 0.9 : 1}
                          translateY={this.translateY}
                          translateX={this.translateX}
                          bottom={this.bottomValue}
                          unfocusedBottom={this.unfocusedBottomValue}
                          keyboardVisibleValue={keyboardVisibleValue}
                          onTransformLayout={this.handleLayoutTransform}
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
