import React, { Component } from "react";
import {
  findNodeHandle,
  LayoutAnimation,
  StyleSheet,
  View
} from "react-native";
import { State } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";
import { SCREEN_DIMENSIONS } from "../../../../config";
import { Rectangle } from "../../../lib/Rectangle";
import { sendSelectionFeedback } from "../../../lib/Vibration";
import { ClipContext, ClipProvider } from "./ClipContext";
import { TransformableViewComponent } from "./TransformableView";

const transformableStyles = StyleSheet.create({
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0
  }
});

export const TransformableView = React.forwardRef((props, ref) => {
  const {
    bottom,
    verticalAlign,
    top,
    left,
    blockId,
    rotate,
    scale,
    id,
    inputRef,
    overlayTag,
    Component = TransformableViewComponent,
    children
  } = props;

  const transform = React.useMemo(() => {
    const _transform = [
      rotate && {
        rotate: rotate + "rad"
      },
      scale &&
        scale !== 1.0 && {
          scale
        }
    ].filter(Boolean);

    if (_transform.length > 0) {
      return _transform;
    } else {
      return [];
    }
  }, [rotate, scale]);

  if (verticalAlign === "bottom" || !verticalAlign) {
    return (
      <Component
        ref={ref}
        inputRef={inputRef}
        uid={blockId}
        overlayTag={overlayTag}
        style={[
          transformableStyles.bottomContainer,
          { bottom, left, transform }
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
        uid={blockId}
        overlayTag={overlayTag}
        style={[transformableStyles.topContainer, { top, left, transform }]}
      >
        {children}
      </Component>
    );
  } else {
    return (
      <Component
        ref={ref}
        uid={blockId}
        overlayTag={overlayTag}
        inputRef={inputRef}
        style={[transformableStyles.topContainer, { top, left, transform }]}
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
  wrap: {
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

    // this.panGestureState = new Animated.Value(State.UNDETERMINED);
    // this.scaleGestureState = new Animated.Value(State.UNDETERMINED);
    // this.rotationGestureState = new Animated.Value(State.UNDETERMINED);
    // this.isCurrentlyGesturingValue = isCurrentlyGesturingProc(
    //   this.panGestureState,
    //   this.scaleGestureState,
    //   this.rotationGestureState
    // );

    // this._X = new Animated.Value(props.xLiteral);
    // this._Y = new Animated.Value(yLiteral);
    // this._R = new Animated.Value(props.rLiteral);
    // this._Z = new Animated.Value(props.scaleLiteral);

    // this.blockId = new Animated.Value(props.blockId.hashCode());

    // this.handleTap = event(
    //   [
    //     {
    //       nativeEvent: {
    //         x: this.props.panX,
    //         y: this.props.panY,
    //         absoluteX: this.props.absoluteX,
    //         absoluteY: this.props.absoluteY
    //       }
    //     }
    //   ],
    //   { useNativeDriver: true }
    // );

    // this.handlePan = event(
    //   [
    //     {
    //       nativeEvent: {
    //         translationX: this._X,
    //         translationY: this._Y,
    //         x: this.props.panX,
    //         y: this.props.panY,
    //         absoluteX: this.props.absoluteX,
    //         absoluteY: this.props.absoluteY,
    //         // velocityX: this.props.velocityX,
    //         // velocityY: this.props.velocityY,
    //         state: this.panGestureState
    //       }
    //     }
    //   ],
    //   { useNativeDriver: true }
    // );

    // this.handleRotate = event(
    //   [
    //     {
    //       nativeEvent: {
    //         rotation: this._R,
    //         state: this.rotationGestureState
    //       }
    //     }
    //   ],
    //   { useNativeDriver: true }
    // );

    // this.handleZoom = event(
    //   [
    //     {
    //       nativeEvent: {
    //         scale: this._Z,
    //         state: this.scaleGestureState
    //       }
    //     }
    //   ],
    //   { useNativeDriver: true }
    // );

    // this.X = preserveOffset(this._X, this.panGestureState, props.x);
    // this.Y = preserveOffset(this._Y, this.panGestureState, props.y);
    // this.R = preserveOffset(this._R, this.rotationGestureState, props.r);
    // this.Z = Animated.min(
    //   preserveMultiplicativeOffset(this._Z, this.scaleGestureState),
    //   props.maxScale || 100
    // );

    // this.keyboardVisibleFocusedValue = new Animated.Value(0);

    // this.isFocusedValue = Animated.eq(
    //   this.props.focusedBlockValue,
    //   this.blockId
    // );

    // this.opacityValue = new Animated.Value(1);

    // // this.bottomValue = props.keyboardHeightValue //&& props.isTextBlock
    // //   ? keyboardVisibleCond(
    // //       this.keyboardVisibleFocusedValue,
    // //       0,
    // //       Animated.multiply(
    // //         Animated.sub(
    // //           SCREEN_DIMENSIONS.height,
    // //           props.keyboardHeightValue,
    // //           props.topInsetValue
    // //         ),
    // //         -1
    // //       )
    // //     )
    // //   : 0;
    // //  = 0;

    // this.bottomValue =
    //   verticalAlign === "bottom"
    //     ? fixedSizeInterpolator(
    //         fixedSizeValue,
    //         Animated.multiply(this.Y, -1),
    //         keyboardVisibleCond(
    //           this.keyboardVisibleFocusedValue,
    //           Animated.multiply(this.Y, -1),
    //           Animated.multiply(props.keyboardHeightValue, -1)
    //         )
    //       )
    //     : null;

    // this.topValue =
    //   verticalAlign === "top"
    //     ? Animated.min(
    //         Animated.sub(this.Y, Animated.sub(props.topInsetValue, TOP_Y)),
    //         props.maxY
    //       )
    //     : null;

    // this.scale = Animated.multiply(
    //   scaleValueProc(
    //     this.fixedSizeValue,
    //     this.Z,
    //     this.keyboardVisibleFocusedValue
    //   ),
    //   Animated.cond(this.isFocusedValue, props.currentScale, 1.0)
    // );

    // this.rotateTransform = Animated.concat(this.R, "rad");
    // this.unrotatedTransform = Animated.concat(0, "rad");

    // this.rotate = fixedSizeInterpolator(
    //   fixedSizeValue,
    //   this.rotateTransform,
    //   keyboardVisibleCond(
    //     this.keyboardVisibleFocusedValue,
    //     this.rotateTransform,
    //     this.unrotatedTransform
    //   )
    // );

    // this.translateX = fixedSizeInterpolator(
    //   fixedSizeValue,
    //   this.X,
    //   keyboardVisibleCond(this.keyboardVisibleFocusedValue, this.X, 0)
    // );
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
      isFocused,
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
      isFixedSize,
      verticalAlign,
      yLiteral: _yLiteral = 0,
      xLiteral: _xLiteral = 0,
      rLiteral = 0,
      blockId,
      scaleLiteral = 1.0,
      keyboardHeight = 0
    } = this.props;

    const yLiteral = _yLiteral || 0;

    const bottom = verticalAlign === "bottom" ? yLiteral * -1 : undefined;

    const isCurrentlyEditing = isEditing && !isOtherNodeFocused;

    const top = verticalAlign === "top" ? yLiteral : undefined;
    const xLiteral = isCurrentlyEditing && !isFixedSize ? 0 : _xLiteral;

    return (
      <ClipProvider value={frame}>
        <>
          {isCurrentlyEditing && (
            <View
              ref={this.overlayRef}
              pointerEvents="none"
              style={styles.overlaySheet}
            ></View>
          )}
          <TransformableView
            ref={this.props.containerRef}
            opacity={isHidden ? 1 : isOtherNodeFocused ? 0.9 : 1}
            overlayTag={this.overlayTag}
            isFixedSize={isFixedSize}
            blockId={blockId}
            verticalAlign={verticalAlign}
            left={xLiteral}
            bottom={bottom}
            top={top}
            inputRef={inputRef}
            rotate={isCurrentlyEditing ? 0 : rLiteral}
            scale={isCurrentlyEditing ? 1.0 : scaleLiteral}
          >
            {this.props.children}
          </TransformableView>
        </>
      </ClipProvider>
    );
  }
}
