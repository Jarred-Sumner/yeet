import * as React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  ImageEditor,
  LayoutAnimation
} from "react-native";
import CameraRoll from "@react-native-community/cameraroll";
import Animated, {
  Easing,
  Transitioning,
  Transition
} from "react-native-reanimated";
import {
  PanGestureHandler,
  PinchGestureHandler,
  RectButton,
  RotationGestureHandler,
  State as GestureState
} from "react-native-gesture-handler";
import { IconUploadPhoto, IconText, IconChevronRight } from "../Icon";
import { SafeAreaView } from "react-navigation";
import { SPACING, COLORS } from "../../lib/styles";
import { getInset } from "react-native-safe-area-view";
import RNFetchBlob from "rn-fetch-blob";
import path from "path";
import {
  clamp,
  transformOrigin,
  preserveOffset,
  onGestureEvent,
  runTiming,
  limit,
  runDelay
} from "react-native-redash";

const {
  Value,
  Clock,
  or,
  cond,
  eq,
  add,
  get,
  set,
  block,
  clockRunning,
  sub,
  startClock,
  spring,
  stopClock,
  event,
  and,
  multiply,
  lessOrEq,
  greaterThan,
  call,
  Extrapolate,
  neq,
  interpolate
} = Animated;

const runOpacityTimer = (
  clock,
  yOffsetGestureState,
  heightGestureState,
  onValue = 0.4,
  offValue = 1,
  yOffsetValue,
  bottomOffsetValue
) => {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration: new Value(300),
    toValue: new Value(-1),
    easing: Easing.linear
  };

  return block([
    cond(
      or(
        and(
          or(
            eq(yOffsetGestureState, GestureState.BEGAN),
            eq(yOffsetGestureState, GestureState.ACTIVE)
          ),
          neq(config.toValue, 1)
        ),
        and(
          or(
            eq(heightGestureState, GestureState.BEGAN),
            eq(heightGestureState, GestureState.ACTIVE)
          ),
          neq(config.toValue, 1)
        )
      ),
      [
        set(state.finished, 0),
        set(state.time, 0),
        set(state.frameTime, 0),
        set(config.duration, 100),
        set(config.toValue, 1),
        startClock(clock)
      ]
    ),
    cond(
      or(
        and(eq(yOffsetGestureState, GestureState.END), neq(config.toValue, 0)),
        and(eq(heightGestureState, GestureState.END), neq(config.toValue, 0))
      ),
      [
        set(state.finished, 0),
        set(state.time, 0),
        set(state.frameTime, 0),
        set(config.duration, 300),
        set(config.toValue, 0),
        startClock(clock)
      ]
    ),
    Animated.timing(clock, state, config),
    cond(state.finished, stopClock(clock)),
    interpolate(state.position, {
      inputRange: [0, 1],
      outputRange: [offValue, onValue],
      extrapolate: Extrapolate.CLAMP
    })
  ]);
};

const runResizeTimer = (
  clock,
  heightValue,
  pendingHeightValue,
  yOffsetValue,
  pendingYOffsetValue
) => {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration: 300,
    toValue: new Value(-1),
    easing: Easing.inOut(Easing.ease)
  };

  return block([
    cond(neq(config.toValue, 1), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, 1),
      startClock(clock)
    ]),
    cond(neq(config.toValue, 0), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, 0),
      startClock(clock)
    ]),
    Animated.timing(clock, state, config),
    cond(state.finished, stopClock(clock)),
    interpolate(state.position, {
      inputRange: [0, 1],
      outputRange: [get(pendingHeightValue)],
      extrapolate: Extrapolate.CLAMP
    })
  ]);
};

const SCREEN_DIMENSIONS = Dimensions.get("window");

const TOP_INSET = getInset("top");
const BOTTOM_INSET = getInset("bottom");

const TOP_IMAGE_Y = TOP_INSET + SPACING.double;

const ENABLE_DEBUG_MODE = false;
const USE_NATIVE_DRIVER = true;

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

  return { width: srcWidth * ratio, height: srcHeight * ratio };
}

const RESIZE_BAR_HEIGHT = 14;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  boundingBox: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  resizeTop: {
    flexDirection: "column-reverse",
    marginTop: -1 * RESIZE_BAR_HEIGHT
  },
  resizeHintTop: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.25)"
  },
  resizeHintBottom: {
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.25)"
  },
  resizeBottom: {
    flexDirection: "column"
  },
  resizeBarContainer: {
    width: "100%",
    alignItems: "center",
    height: RESIZE_BAR_HEIGHT,
    position: "absolute",
    flexGrow: 0,
    zIndex: 5,
    justifyContent: "center"
  },
  resizeHint: {
    width: 40,
    height: 12,
    backgroundColor: COLORS.primary
  },
  resizeBar: {
    backgroundColor: COLORS.primary,
    width: "100%",
    shadowRadius: 0,
    shadowColor: "#fff",
    shadowOpacity: 0.05,
    height: 2.5
  }
});

const ResizeBar = React.forwardRef(
  (
    {
      side,
      width,
      yOffset,
      height,
      onGestureEvent,
      onHandlerStateChange,
      min,
      max
    },
    ref
  ) => {
    return (
      <>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            ref={ref}
            style={[
              styles.resizeBarContainer,
              {
                width,
                top: side === "top" ? 0 : undefined,
                bottom: side === "bottom" ? 0 : undefined,
                transform: [
                  {
                    translateY: side === "bottom" ? RESIZE_BAR_HEIGHT : 0
                  },
                  { translateY: yOffset }
                ]
              },
              {
                top: styles.resizeTop,
                bottom: styles.resizeBottom
              }[side]
            ]}
          >
            <View style={styles.resizeBar} />
            <View
              style={[
                styles.resizeHint,
                {
                  top: styles.resizeHintTop,
                  bottom: styles.resizeHintBottom
                }[side]
              ]}
            />
          </Animated.View>
        </PanGestureHandler>

        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            backgroundColor: "black",
            width: "100%",
            height: max,
            opacity: 1,
            zIndex: 3,
            top: side === "top" ? max * -1 : undefined,
            bottom: side === "bottom" ? max * -1 : undefined,
            left: 0,
            right: 0,
            transform: [
              {
                translateY: yOffset
              }
            ]
          }}
        />
      </>
    );
  }
);

type Props = {
  maxHeight: number;
  maxWidth: number;
  photo: CameraRoll.PhotoIdentifier;
};

type State = {
  crop: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
};

const ANIMATION_TIMING = 400;

export class ResizableImage extends React.Component<Props> {
  yOffset: number = 0;
  _yOffsetValue = new Animated.Value(0);
  _bottomOffsetValue = new Animated.Value(0);
  height: number = 0;
  backdropOpacityClock = new Animated.Clock();
  yOffsetGestureState = new Value(GestureState.UNDETERMINED);
  heightGestureState = new Value(GestureState.UNDETERMINED);

  constructor(props: Props) {
    super(props);

    const { photo, originalPhoto, maxWidth, maxHeight } = props;

    const { width, height: height } = calculateAspectRatioFit(
      photo.width,
      photo.height,
      maxWidth,
      maxHeight
    );

    const maxCrop = {
      ...calculateAspectRatioFit(
        originalPhoto.width,
        originalPhoto.height,
        maxWidth,
        maxHeight
      ),
      x: 0,
      y: 0
    };

    const crop = {
      width,
      height,
      x: 0,
      y: maxCrop.height - height
    };
    maxCrop.y = crop.y;

    // const height = photo.height * (_height - photo.

    this.height = height;
    this.heightValue = new Animated.Value(height);
    this._yOffsetValue.setValue(crop.y / 2);
    this._bottomOffsetValue.setValue(
      ((photo.height - originalPhoto.height) / originalPhoto.height) *
        crop.height
    );

    this.yOffsetValue = limit(
      preserveOffset(this._yOffsetValue, this.yOffsetGestureState),
      this.yOffsetGestureState,
      crop.y === 0 ? 0 : crop.y / -2,
      Animated.max(sub(this.heightValue, this.bottomOffsetValue), 10)
    );

    // this.yOffsetValue = preserveOffset(
    //   this._yOffsetValue,
    //   this.yOffsetGestureState
    // );

    this.bottomOffsetValue = limit(
      preserveOffset(this._bottomOffsetValue, this.heightGestureState),
      this.heightGestureState,
      multiply(sub(this.heightValue, this.yOffsetValue), -1),
      0
    );
    // this.bottomOffsetValue = preserveOffset(
    //   this._bottomOffsetValue,
    //   this.heightGestureState
    // );

    this.onTranslateY = Animated.event(
      [
        {
          nativeEvent: {
            translationY: this._yOffsetValue,
            state: this.yOffsetGestureState
          }
        }
      ],
      { useNativeDriver: USE_NATIVE_DRIVER }
    );
    this.onChangeHeight = Animated.event(
      [
        {
          nativeEvent: {
            translationY: this._bottomOffsetValue,
            state: this.heightGestureState
          }
        }
      ],
      { useNativeDriver: USE_NATIVE_DRIVER }
    );

    this.state = {
      crop,
      maxCrop
    };
  }

  // handleTranslateGesture = async event => {
  //   if (event.nativeEvent.oldState === GestureState.ACTIVE) {
  //     this.yOffset = clamp(
  //       this.yOffsetMidpoint + this.yOffset + event.nativeEvent.translationY,
  //       0,
  //       this.state.maxCrop.height - 10
  //     );
  //     this.yOffsetValue.setOffset(this.yOffset);
  //     this.yOffsetValue.setValue(0);
  //   }

  //   const gestureState = event.nativeEvent.state;

  //   if (this.state.crop.y !== 0 && gestureState === GestureState.BEGAN) {
  //     Animated.timing(this.backdropOpacityValue, {
  //       toValue: 1,
  //       useNativeDriver: true,
  //       duration: ANIMATION_TIMING
  //     }).start();
  //   } else if (gestureState === GestureState.BEGAN) {
  //     this.backdropOpacityValue.setValue(1);
  //   }

  //   if (
  //     [
  //       GestureState.CANCELLED,
  //       GestureState.FAILED,
  //       GestureState.UNDETERMINED
  //     ].includes(gestureState)
  //   ) {
  //     Animated.timing(this.backdropOpacityValue, {
  //       toValue: 0,
  //       useNativeDriver: true,
  //       duration: ANIMATION_TIMING
  //     }).start();
  //   }

  //   if (event.nativeEvent.state === GestureState.END) {
  //     this.handleVerticalResize({
  //       side: "top"
  //     });
  //   }
  // };

  get yOffsetMidpoint() {
    return this.state.crop.y / 2;
  }

  // handleHeightGesture = async event => {
  //   if (event.nativeEvent.oldState === GestureState.ACTIVE) {
  //     this.height = this.height + event.nativeEvent.translationY;
  //     console.log(this.height);
  //     this.heightValue.setOffset(this.height);
  //     this.heightValue.setValue(0);
  //   }

  //   const gestureState = event.nativeEvent.state;

  //   if (
  //     this.state.crop.height !== this.state.maxCrop.height &&
  //     gestureState === GestureState.BEGAN
  //   ) {
  //     Animated.timing(this.backdropOpacityValue, {
  //       toValue: 1,
  //       useNativeDriver: true,
  //       duration: ANIMATION_TIMING
  //     }).start();
  //   } else if (gestureState === GestureState.BEGAN) {
  //     this.backdropOpacityValue.setValue(1);
  //   }

  //   if (
  //     [
  //       GestureState.CANCELLED,
  //       GestureState.FAILED,
  //       GestureState.UNDETERMINED
  //     ].includes(gestureState)
  //   ) {
  //     Animated.timing(this.backdropOpacityValue, {
  //       toValue: 0,
  //       useNativeDriver: true,
  //       duration: ANIMATION_TIMING
  //     }).start();
  //   }

  //   if (event.nativeEvent.state === GestureState.END) {
  //     this.handleVerticalResize({ side: "bottom" });
  //   }
  // };

  backdropOpacityValue = runOpacityTimer(
    this.backdropOpacityClock,
    this.yOffsetGestureState,
    this.heightGestureState
  );
  imageLoadedValue = new Animated.Value(0);

  handleCrop = ([yOffset, bottomOffset]) => {
    this.props.onCrop(yOffset, bottomOffset, this.state.crop);
    return 0;
  };

  handleImageLoad = () => {
    this.imageLoadedValue.setValue(1);
  };

  render() {
    const {
      maxHeight,
      maxWidth,
      minY,
      maxY,
      source,
      originalSource
    } = this.props;
    const { crop, maxCrop } = this.state;

    return (
      <Animated.View
        style={[
          styles.container,
          ENABLE_DEBUG_MODE ? { backgroundColor: "red" } : {},
          { opacity: this.imageLoadedValue }
        ]}
      >
        <Animated.Code>
          {() => {
            return block([
              cond(
                [
                  or(
                    eq(this.heightGestureState, GestureState.END),
                    eq(this.yOffsetGestureState, GestureState.END)
                  )
                ],
                runDelay(
                  block([
                    call(
                      [this.yOffsetValue, this.bottomOffsetValue],
                      this.handleCrop
                    )
                  ]),
                  400
                )
              )
            ]);
          }}
        </Animated.Code>

        <View
          style={[
            styles.boundingBox,
            ENABLE_DEBUG_MODE ? { backgroundColor: "yellow" } : {},
            {
              overflow: "visible",
              width: maxWidth,
              alignItems: "center",
              height: maxHeight
            }
          ]}
        >
          <Animated.View
            style={[
              styles.content,
              {
                width: crop.width,
                height: crop.height
              }
            ]}
          >
            <ResizeBar
              side="top"
              yOffset={this.yOffsetValue}
              min={crop.y * -1}
              height={maxCrop.height}
              max={maxCrop.height - 10}
              width={maxCrop.width}
              onGestureEvent={this.onTranslateY}
              onHandlerStateChange={this.onTranslateY}
            />

            <Animated.View
              style={[
                styles.content,
                {
                  width: crop.width,
                  height: crop.height,
                  marginBottom: this.bottomOffsetValue,
                  overflow: "visible",

                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }
              ]}
            >
              <Animated.Image
                source={source}
                pointerEvents="none"
                onLoad={this.handleImageLoad}
                resizeMode="cover"
                style={{
                  width: crop.width,
                  height: crop.height
                }}
              />
              <ResizeBar
                side="top"
                yOffset={this.yOffsetValue}
                min={0}
                height={crop.height}
                max={crop.height}
                width={crop.width}
                onGestureEvent={this.onTranslateY}
                onHandlerStateChange={this.onTranslateY}
              />

              <ResizeBar
                side="bottom"
                yOffset={this.bottomOffsetValue}
                height={crop.height}
                width={crop.width}
                min={0}
                max={crop.height}
                onGestureEvent={this.onChangeHeight}
                onHandlerStateChange={this.onChangeHeight}
              />
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>
    );
  }
}

export default ResizableImage;
