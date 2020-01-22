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
  preserveOffset
} from "../../../lib/animations";
import { Rectangle } from "../../../lib/Rectangle";
import { sendSelectionFeedback } from "../../../lib/Vibration";
import { ClipContext, ClipProvider } from "./ClipContext";
import { TransformableViewComponent } from "./TransformableView";

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
            left: translateX,
            zIndex,
            transform: [
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
            left: translateX,
            zIndex,
            transform: [
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
            left: translateX,
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

const fixedSizeInterpolator = Animated.proc((fixedSize, yes, no) =>
  Animated.cond(Animated.eq(fixedSize, 1), yes, no)
);

const scaleValueProc = Animated.proc(
  (fixedSizeValue, Z, keyboardVisibleFocusedValue) =>
    fixedSizeInterpolator(
      fixedSizeValue,
      Z,
      keyboardVisibleCond(keyboardVisibleFocusedValue, Z, 1.0)
    )
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
  },
  childGestureView: {
    position: "relative",
    flex: 0
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
    zIndex: -1
  }
});

const OverlaySheet = React.forwardRef((props, ref) => {
  const { bounds } = React.useContext(ClipContext);
  const { visible, rotate, scale } = props;
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

  if (!visible) {
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
  absoluteX = new Animated.Value(0);
  absoluteY = new Animated.Value(0);

  constructor(props) {
    super(props);

    const { verticalAlign = "bottom" } = props;

    const fixedSizeValue = props.isFixedSize ? 1 : 0;
    const yLiteral =
      verticalAlign === "top"
        ? Math.max(props.yLiteral, props.minY)
        : props.yLiteral;

    console.log({ verticalAlign });

    this.tapGestureState = new Animated.Value(State.UNDETERMINED);
    this.panGestureState = new Animated.Value(State.UNDETERMINED);
    this.scaleGestureState = new Animated.Value(State.UNDETERMINED);
    this.rotationGestureState = new Animated.Value(State.UNDETERMINED);
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
    this._Y = new Animated.Value(yLiteral);
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

    this.animatedKeyboardVisibleFocusedValue = new Animated.Value<number>(0);
    this.keyboardVisibleFocusedValue = new Animated.Value(0);

    this.isFocusedValue = Animated.eq(
      this.props.focusedBlockValue,
      this.blockId
    );

    this.overlayOpacity = this.animatedKeyboardVisibleFocusedValue;
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

    this.unfocusedBottomValue = Animated.multiply(this.Y, -1);
    this.unscaledValue = new Animated.Value(1);

    this.bottomValue =
      verticalAlign === "bottom"
        ? fixedSizeInterpolator(
            fixedSizeValue,
            this.unfocusedBottomValue,
            keyboardVisibleCond(
              this.keyboardVisibleFocusedValue,
              this.unfocusedBottomValue,
              Animated.add(
                Animated.multiply(props.keyboardHeightValue, -1),
                120
              )
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

    this.scale = scaleValueProc(
      this.fixedSizeValue,
      this.Z,
      this.keyboardVisibleFocusedValue
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

    this.translateX = fixedSizeInterpolator(
      fixedSizeValue,
      this.X,
      keyboardVisibleCond(this.keyboardVisibleFocusedValue, this.X, 0)
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

    const ActivationGestureHandler = isFixedSize
      ? LongPressGestureHandler
      : TapGestureHandler;

    return (
      <>
        <Animated.Code
          exec={Animated.block([
            Animated.set(
              this.animatedKeyboardVisibleFocusedValue,
              Animated.multiply(
                this.isFocusedValue,
                this.props.animatedKeyboardVisibleValue
              )
            ),

            Animated.cond(Animated.eq(this.panGestureState, State.ACTIVE), [
              Animated.set(this.props.currentX, this.absoluteX),
              Animated.set(this.props.currentY, this.absoluteY)
            ]),
            Animated.onChange(
              this.isCurrentlyGesturingValue,
              Animated.block([
                Animated.cond(
                  Animated.eq(this.isCurrentlyGesturingValue, 1),
                  Animated.block([
                    Animated.call(
                      [this.absoluteX, this.absoluteY, this.panGestureState],
                      this.handlePanChange
                    )
                  ]),
                  Animated.block([
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
                  ])
                )
              ])
            ),
            Animated.onChange(
              this.absoluteX,
              Animated.set(this.props.absoluteX, this.absoluteX)
            ),
            Animated.onChange(
              this.absoluteY,
              Animated.set(this.props.absoluteY, this.absoluteY)
            ),
            Animated.set(
              this.keyboardVisibleFocusedValue,
              Animated.multiply(
                this.isFocusedValue,
                this.props.keyboardVisibleValue
              )
            )
          ])}
        />

        <ClipProvider value={frame}>
          <ActivationGestureHandler
            waitFor={this.tapGestureWaitFor}
            ref={this.tapRef}
            enabled={isDragEnabled}
            minDurationMs={isFixedSize ? 500 : undefined}
            maxDist={isFixedSize ? 3 : undefined}
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
                      {isFixedSize ? (
                        <OverlaySheet
                          ref={this.overlayRef}
                          rotate={this.props.rLiteral}
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
                        <Animated.View style={styles.childGestureView}>
                          <TransformableView
                            ref={this.props.containerRef}
                            opacity={
                              isHidden ? 1 : isOtherNodeFocused ? 0.9 : 1
                            }
                            overlayTag={this.overlayTag}
                            translateX={this.translateX}
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
