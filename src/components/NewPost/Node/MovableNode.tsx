import React, { Component } from "react";
import {
  findNodeHandle,
  LayoutAnimation,
  StyleSheet,
  View
} from "react-native";
import {
  LongPressGestureHandler,
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  State,
  TapGestureHandler
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../../config";
import {
  preserveMultiplicativeOffset,
  preserveOffset,
  isCurrentlyGesturingProc
} from "../../../lib/animations";
import { Rectangle } from "../../../lib/Rectangle";
import { sendSelectionFeedback } from "../../../lib/Vibration";
import { ClipContext, ClipProvider } from "./ClipContext";
import { TransformableViewComponent } from "./TransformableView";
import { CAROUSEL_HEIGHT } from "../NewPostFormat";

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
    Component = TransformableViewComponent,
    overlayTag,
    rotate = 0,
    verticalAlign,
    unfocusedBottom,
    unfocusedLeft,
    onContentSizeChange,
    left,
    translateY,
    isFixedSize,
    top,
    zIndex,
    inputRef,
    scale = 1.0,

    keyboardVisibleValue,
    bottom = undefined,
    opacity = 1.0,
    rasterize,
    children
  } = props;

  if (verticalAlign === "bottom" || !verticalAlign) {
    return (
      <Component
        ref={ref}
        inputRef={inputRef}
        overlayTag={overlayTag}
        style={[
          transformableStyles.bottomContainer,
          {
            opacity,
            bottom,
            left,
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
  } else if (verticalAlign === "top") {
    return (
      <Component
        ref={ref}
        inputRef={inputRef}
        overlayTag={overlayTag}
        style={[
          transformableStyles.bottomContainer,
          {
            opacity,
            top,
            left,
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
  } else {
    return (
      <Component
        ref={ref}
        overlayTag={overlayTag}
        inputRef={inputRef}
        style={[
          transformableStyles.topContainer,
          {
            opacity,
            zIndex,
            bottom,
            left,
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

const keyboardVisibleCond = Animated.proc((keyboardVisibleValue, start, end) =>
  Animated.cond(Animated.eq(keyboardVisibleValue, 0), start, end)
);

// const keyboardVisibleInterpolater = Animated.proc(
//   (keyboardVisibleValue, start, end) =>
//     Animated.interpolate(keyboardVisibleValue, {
//       inputRange: [0, 1],
//       outputRange: [start, end],
//       extrapolate: Animated.Extrapolate.CLAMP
//     })
// );

const keyboardVisibleInterpolater = keyboardVisibleCond;

const fixedSizeInterpolator = (fixedSize, yes, no) => (fixedSize ? yes : no);

const scaleValueProc = (fixedSizeValue, Z, keyboardVisibleFocusedValue) =>
  fixedSizeInterpolator(
    fixedSizeValue,
    Z,
    keyboardVisibleCond(keyboardVisibleFocusedValue, Z, 1.0)
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
    width: SCREEN_DIMENSIONS.width,
    height: 0,

    overflow: "visible"
  },
  gestureRootView: {
    width: SCREEN_DIMENSIONS.width,
    height: 0,
    flex: 0,
    overflow: "visible",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0
  },
  childGestureView: {
    width: SCREEN_DIMENSIONS.width,
    flex: 0,
    top: 0,
    position: "relative",
    overflow: "visible",
    left: 0,
    bottom: 0,
    height: 0
  },
  fixedSizeOverlaySheet: {
    zIndex: 0,
    position: "absolute",
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  overlaySheet: {
    zIndex: 0,
    opacity: 0,
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
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: -1
  }
});

const OverlaySheet = React.forwardRef((props, ref) => {
  const { bounds } = React.useContext(ClipContext);
  const { visible, rotate, scale, topInsetValue } = props;
  const isInitialMount = React.useRef(true);

  React.useLayoutEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    LayoutAnimation.configureNext({
      type: LayoutAnimation.Types.keyboard,
      create: {
        type: LayoutAnimation.Types.keyboard,
        property: "opacity"
      },
      delete: {
        type: LayoutAnimation.Types.keyboard,
        property: "opacity"
      },
      update: {
        type: LayoutAnimation.Types.keyboard,
        property: "opacity"
      }
    });
  }, [visible]);

  const screen = new Rectangle(
    0,
    0,
    SCREEN_DIMENSIONS.width,
    SCREEN_DIMENSIONS.height
  );

  let boundsRect = new Rectangle(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height
  );

  boundsRect = boundsRect.inflateFixed(2);

  const rects = React.useMemo(() => {
    if (!visible) {
      return [];
    }

    return screen.subtract(boundsRect);
  }, [visible, bounds, boundsRect, rotate]);

  const renderRect = React.useCallback(rect => {
    return (
      <Rect
        width={rect.width}
        height={rect.height}
        key={rect.toString()}
        x={rect.left}
        y={rect.top}
        fillOpacity={0.75}
        fill="black"
      />
    );
  }, []);

  if (!visible || Math.abs(rotate) > 0.01 || scale !== 0) {
    return null;
  }

  return (
    <View pointerEvents="none" ref={ref} style={styles.fixedSizeOverlaySheet}>
      <Svg
        transform={[{ rotate: `${rotate || 0}rad` }]}
        width={screen.width}
        height={screen.height}
      >
        {rects.map(renderRect)}
      </Svg>
    </View>
  );
});

export class MovableNode extends Component<Props> {
  constructor(props) {
    super(props);

    const { verticalAlign = "bottom" } = props;

    const fixedSizeValue = props.isFixedSize ? 1 : 0;
    const yLiteral =
      verticalAlign === "top" ? Math.max(props.yLiteral, 0) : props.yLiteral;

    this.panGestureState = new Animated.Value(State.UNDETERMINED);
    this.scaleGestureState = new Animated.Value(State.UNDETERMINED);
    this.rotationGestureState = new Animated.Value(State.UNDETERMINED);
    this.isCurrentlyGesturingValue = isCurrentlyGesturingProc(
      this.panGestureState,
      this.scaleGestureState,
      this.rotationGestureState
    );
    this.keyboardVisibleFocusedValue = new Animated.Value(0);

    this._Y = new Animated.Value(yLiteral);
    this._R = new Animated.Value(props.rLiteral);
    this._Z = new Animated.Value(props.scaleLiteral);

    this.blockId = new Animated.Value(props.blockId.hashCode());

    this.handleTap = event(
      [
        {
          nativeEvent: {
            x: this.props.panX,
            y: this.props.panY,
            absoluteX: this.props.absoluteX,
            absoluteY: this.props.absoluteY
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

    this._X = new Animated.Value(props.xLiteral);
    this.left = keyboardVisibleCond(
      this.keyboardVisibleFocusedValue,
      this._X,
      0
    );

    this._translateX = new Animated.Value(0);
    this._translateY = new Animated.Value(0);
    this.translateX = fixedSizeInterpolator(
      fixedSizeValue,
      this._translateX,
      keyboardVisibleCond(this.keyboardVisibleFocusedValue, this._translateX, 0)
    );

    this.translateY = fixedSizeInterpolator(
      fixedSizeValue,
      this._translateY,
      keyboardVisibleCond(this.keyboardVisibleFocusedValue, this._translateY, 0)
    );

    this.handlePan = event(
      [
        {
          nativeEvent: {
            translationX: this._translateX,
            translationY: this._translateY,
            x: this.props.panX,
            y: this.props.panY,
            absoluteX: this.props.absoluteX,
            absoluteY: this.props.absoluteY,
            // velocityX: this.props.velocityX,
            // velocityY: this.props.velocityY,
            state: this.panGestureState
          }
        }
      ],
      { useNativeDriver: true }
    );

    this.Y = this._Y;
    this.R = preserveOffset(this._R, this.rotationGestureState, props.r);
    this.Z = Animated.min(
      preserveMultiplicativeOffset(this._Z, this.scaleGestureState),
      props.maxScale || 100
    );

    this.isFocusedValue = Animated.eq(
      this.props.focusedBlockValue,
      this.blockId
    );

    this.opacityValue = new Animated.Value(1);

    // this.bottomValue = props.keyboardHeightValue //&& props.isTextBlock
    //   ? keyboardVisibleCond(
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

    this.bottomValue =
      verticalAlign === "bottom"
        ? fixedSizeInterpolator(
            fixedSizeValue,
            Animated.multiply(this.Y, -1),
            keyboardVisibleCond(
              this.keyboardVisibleFocusedValue,
              Animated.multiply(this.Y, -1),
              Animated.multiply(props.keyboardHeightValue, -1)
            )
          )
        : null;

    this.topValue =
      verticalAlign === "top"
        ? Animated.min(
            Animated.sub(this.Y, Animated.sub(props.topInsetValue, TOP_Y)),
            props.maxY
          )
        : null;

    this.scale = Animated.multiply(
      scaleValueProc(
        this.fixedSizeValue,
        this.Z,
        this.keyboardVisibleFocusedValue
      ),
      Animated.cond(this.isFocusedValue, props.currentScale, 1.0)
    );

    this.rotateTransform = Animated.concat(this.R, "rad");
    this.unrotatedTransform = Animated.concat(0, "rad");

    this.rotate = fixedSizeInterpolator(
      fixedSizeValue,
      this.rotateTransform,
      keyboardVisibleCond(
        this.keyboardVisibleFocusedValue,
        this.rotateTransform,
        this.unrotatedTransform
      )
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
  _isMounted = true;

  updatePosition = coords => {
    if (!this._isMounted) {
      return;
    }

    if (this.props.isEditing) {
      return;
    }

    const [
      x,
      y,
      rotate,
      scale,
      panGestureState,
      absoluteX,
      absoluteY,
      snapOpacity
    ] = coords;

    this.props.onChangePosition({
      x,
      y,
      scale,
      rotate,
      absoluteX,
      absoluteY,
      isPanning: false
    });
  };

  startUpdatePosition = ([absoluteX, absoluteY, snapOpacity]) => {
    if (!this._isMounted) {
      return;
    }

    if (this.props.isEditing) {
      return;
    }

    this.props.onChangePosition({
      x: this.props.xLiteral,
      y: this.props.yLiteral,
      scale: this.props.scaleLiteral,
      rotate: this.props.rLiteral,
      absoluteX,
      absoluteY,
      snapOpacity,
      isPanning: true
    });
  };

  handleLayoutTransform = ({ nativeEvent: { layout, from } }) => {
    console.log({ layout, from });
  };

  _handleTap = () => {
    if (this.props.isFixedSize) {
      sendSelectionFeedback();
    }

    return this.props.onTap();
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

  overlayRef = overlayView => {
    if (overlayView) {
      this.overlayTag = findNodeHandle(overlayView);
    }
  };

  overlayTag: number | null = null;

  render() {
    const {
      x,
      y,
      scale,
      r,
      isDragEnabled,
      isPanning,
      isOtherNodeFocused,
      height,
      focusedBlockValue,
      waitFor = [],
      keyboardVisibleValue,
      keyboardHeightValue,
      inputRef,
      extraPadding,
      frame,
      isHidden,
      isEditing,
      isFixedSize
    } = this.props;

    const ActivationGestureHandler = TapGestureHandler;

    return (
      <>
        <Animated.Code
          exec={Animated.block([
            Animated.onChange(
              this.isCurrentlyGesturingValue,
              Animated.block([
                Animated.cond(
                  Animated.eq(this.isCurrentlyGesturingValue, 1),
                  Animated.block([
                    Animated.call(
                      [
                        this.props.absoluteX,
                        this.props.absoluteY,
                        this.panGestureState
                      ],
                      this.handlePanChange
                    )
                  ]),
                  Animated.block([
                    Animated.set(
                      this._X,
                      Animated.add(this._translateX, this._X)
                    ),
                    Animated.set(this._translateX, 0),
                    Animated.set(
                      this._Y,
                      Animated.add(this._translateY, this._Y)
                    ),
                    Animated.set(this._translateY, 0),
                    Animated.call(
                      [
                        this._X,
                        this._Y,
                        this.R,
                        this.Z,
                        this.panGestureState,
                        this.props.absoluteX,
                        this.props.absoluteY
                      ],
                      this.updatePosition
                    )
                  ])
                )
              ])
            ),

            Animated.onChange(this.isFocusedValue, [
              Animated.set(
                this.keyboardVisibleFocusedValue,
                Animated.multiply(
                  this.isFocusedValue,
                  this.props.keyboardVisibleValue
                )
              )
            ]),
            Animated.onChange(
              this.props.keyboardVisibleValue,
              Animated.set(
                this.keyboardVisibleFocusedValue,
                Animated.multiply(
                  this.isFocusedValue,
                  this.props.keyboardVisibleValue
                )
              )
            )
          ])}
        />

        <ClipProvider value={frame}>
          <ActivationGestureHandler
            waitFor={this.tapGestureWaitFor}
            ref={this.tapRef}
            enabled={isDragEnabled}
            minDurationMs={isFixedSize ? 50 : undefined}
            maxDist={isFixedSize ? 3 : undefined}
            onGestureEvent={this.handleTap}
            onHandlerStateChange={this.handleTap}
          >
            <Animated.View
              pointerEvents="box-none"
              width={SCREEN_DIMENSIONS.width}
              style={styles.gestureRootView}
            >
              <PanGestureHandler
                ref={this.panRef}
                enabled={isDragEnabled}
                waitFor={waitFor}
                simultaneousHandlers={this.panGestureHandlers}
                onGestureEvent={this.handlePan}
                onHandlerStateChange={this.handlePan}
              >
                <Animated.View
                  pointerEvents="box-none"
                  width={SCREEN_DIMENSIONS.width}
                  height={0}
                  style={styles.gestureView}
                >
                  <PinchGestureHandler
                    ref={this.pinchRef}
                    enabled={isDragEnabled}
                    waitFor={waitFor}
                    simultaneousHandlers={this.pinchGestureHandlers}
                    onGestureEvent={this.handleZoom}
                    onHandlerStateChange={this.handleZoom}
                  >
                    <Animated.View
                      pointerEvents="box-none"
                      width={SCREEN_DIMENSIONS.width}
                      height={0}
                      style={styles.gestureView}
                    >
                      {isFixedSize ? (
                        <OverlaySheet
                          ref={this.overlayRef}
                          rotate={this.props.rLiteral}
                          scale={this.props.scaleLiteral}
                          visible={this.props.isEditing}
                        />
                      ) : (
                        <Animated.View
                          pointerEvents="none"
                          ref={this.overlayRef}
                          style={styles.overlaySheet}
                        />
                      )}

                      <RotationGestureHandler
                        ref={this.rotationRef}
                        enabled={isDragEnabled}
                        waitFor={waitFor}
                        simultaneousHandlers={this.rotationGestureHandlers}
                        onGestureEvent={this.handleRotate}
                        onHandlerStateChange={this.handleRotate}
                      >
                        <Animated.View
                          pointerEvents="box-none"
                          width={SCREEN_DIMENSIONS.width}
                          height={0}
                          style={styles.childGestureView}
                        >
                          <TransformableView
                            ref={this.props.containerRef}
                            opacity={
                              isHidden ? 1 : isOtherNodeFocused ? 0.9 : 1
                            }
                            overlayTag={this.overlayTag}
                            translateX={this.translateX}
                            translateY={this.translateY}
                            left={this.left}
                            isFixedSize={isFixedSize}
                            verticalAlign={this.props.verticalAlign}
                            bottom={this.bottomValue}
                            top={this.topValue}
                            keyboardVisibleValue={keyboardVisibleValue}
                            inputRef={inputRef}
                            rotate={this.rotate}
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
          </ActivationGestureHandler>
        </ClipProvider>
      </>
    );
  }
}
