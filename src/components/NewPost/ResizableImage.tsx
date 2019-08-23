import * as React from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  ImageEditor,
  LayoutAnimation
} from "react-native";
import CameraRoll from "@react-native-community/cameraroll";
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

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

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
    { side, width, yOffset, onGestureEvent, onHandlerStateChange, min, max },
    ref
  ) => {
    return (
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
              transform: [
                {
                  translateY: yOffset.interpolate({
                    inputRange: [min, max],
                    outputRange: [min, max]
                  })
                }
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
  yOffsetValue = new Animated.Value(0);
  heightValue = new Animated.Value(0);
  bottomOffsetValue = new Animated.Value(0);
  height: number = 0;
  revealTopBackdropValue = new Animated.Value(0);
  topOffsetValue = new Animated.Value(0);

  constructor(props: Props) {
    super(props);

    this.onTranslateY = Animated.event(
      [
        {
          nativeEvent: {
            // translationX: this._translateX,
            translationY: this.yOffsetValue
          }
        }
      ],
      { useNativeDriver: USE_NATIVE_DRIVER }
    );
    this.onChangeHeight = Animated.event(
      [
        {
          nativeEvent: {
            // translationX: this._translateX,
            translationY: this.heightValue
          }
        }
      ],
      { useNativeDriver: USE_NATIVE_DRIVER }
    );

    const { photo, maxWidth, maxHeight } = props;

    const { width, height } = calculateAspectRatioFit(
      photo.node.image.width,
      photo.node.image.height,
      maxWidth,
      maxHeight
    );

    this.heightValue.setOffset(height);
    this.bottomOffsetValue.setValue(0);
    this.height = height;

    const crop = {
      width,
      height,
      x: 0,
      y: 0
    };

    this.state = { crop, maxCrop: crop };
  }

  handleTranslateGesture = async event => {
    if (event.nativeEvent.oldState === GestureState.ACTIVE) {
      this.yOffset = clamp(
        this.yOffsetMidpoint + this.yOffset + event.nativeEvent.translationY,
        0,
        this.state.maxCrop.height - 10
      );
      this.yOffsetValue.setOffset(this.yOffset);
      this.yOffsetValue.setValue(0);
    }

    const gestureState = event.nativeEvent.state;

    if (this.state.crop.y !== 0 && gestureState === GestureState.BEGAN) {
      Animated.timing(this.revealTopBackdropValue, {
        toValue: 1,
        useNativeDriver: true,
        duration: ANIMATION_TIMING
      }).start();
    } else if (gestureState === GestureState.BEGAN) {
      this.revealTopBackdropValue.setValue(1);
    }

    if (
      [
        GestureState.CANCELLED,
        GestureState.FAILED,
        GestureState.UNDETERMINED
      ].includes(gestureState)
    ) {
      Animated.timing(this.revealTopBackdropValue, {
        toValue: 0,
        useNativeDriver: true,
        duration: ANIMATION_TIMING
      }).start();
    }

    if (event.nativeEvent.state === GestureState.END) {
      this.handleVerticalResize({
        side: "top"
      });
    }
  };

  handleVerticalResize = ({ side = "top" }) => {
    const midpoint = this.yOffset / 2;

    const animations = [
      Animated.timing(this.revealTopBackdropValue, {
        toValue: 0,
        useNativeDriver: true,
        duration: ANIMATION_TIMING
      })
    ];

    const resizeFromTop = this.yOffset !== this.state.crop.y;

    if (resizeFromTop) {
      this.yOffsetValue.setOffset(0);
      this.yOffsetValue.setValue(this.yOffset - this.state.crop.y / 2);
      this.topOffsetValue.setValue(this.state.crop.y);
      animations.push(
        Animated.timing(this.topOffsetValue, {
          toValue: this.yOffset,
          useNativeDriver: true,
          duration: ANIMATION_TIMING
        })
      );

      animations.push(
        Animated.timing(this.yOffsetValue, {
          toValue: midpoint,
          useNativeDriver: true,
          duration: ANIMATION_TIMING
        })
      );
    }

    const heightDelta = this.height - this.state.crop.height;
    const resizeFromBottom = heightDelta !== 0;

    if (resizeFromBottom) {
      animations.push(
        Animated.timing(this.bottomOffsetValue, {
          toValue: heightDelta / 2,
          useNativeDriver: true,
          duration: ANIMATION_TIMING
        })
      );

      animations.push(
        Animated.timing(this.heightValue, {
          toValue: this.height - heightDelta / 2,
          useNativeDriver: true,
          duration: ANIMATION_TIMING
        })
      );

      this.heightValue.setOffset(0);
      this.heightValue.setValue(this.height);
    }

    Animated.sequence([
      Animated.delay(ANIMATION_TIMING),
      Animated.parallel(animations)
    ]).start(() => {
      this.setState(
        {
          crop: {
            ...this.state.crop,
            y: this.yOffset,
            height: this.height
          }
        },
        () => {
          if (resizeFromTop) {
            this.topOffsetValue.setValue(this.yOffset);
            this.yOffsetValue.setOffset(midpoint);
            this.yOffsetValue.setValue(0);
            this.yOffset = midpoint;
          }

          if (resizeFromBottom) {
            // this.heightValue.setValue(0);
            // this.heightValue.setOffset(this.height - heightDelta / 2);
            // this.bottomOffsetValue.setValue(0);
          }
        }
      );
    });
  };

  get yOffsetMidpoint() {
    return this.state.crop.y / 2;
  }

  handleHeightGesture = async event => {
    if (event.nativeEvent.oldState === GestureState.ACTIVE) {
      this.height = this.height + event.nativeEvent.translationY;
      console.log(this.height);
      this.heightValue.setOffset(this.height);
      this.heightValue.setValue(0);
    }

    const gestureState = event.nativeEvent.state;

    if (
      this.state.crop.height !== this.state.maxCrop.height &&
      gestureState === GestureState.BEGAN
    ) {
      Animated.timing(this.revealTopBackdropValue, {
        toValue: 1,
        useNativeDriver: true,
        duration: ANIMATION_TIMING
      }).start();
    } else if (gestureState === GestureState.BEGAN) {
      this.revealTopBackdropValue.setValue(1);
    }

    if (
      [
        GestureState.CANCELLED,
        GestureState.FAILED,
        GestureState.UNDETERMINED
      ].includes(gestureState)
    ) {
      Animated.timing(this.revealTopBackdropValue, {
        toValue: 0,
        useNativeDriver: true,
        duration: ANIMATION_TIMING
      }).start();
    }

    if (event.nativeEvent.state === GestureState.END) {
      this.handleVerticalResize({ side: "bottom" });
    }
  };

  render() {
    const { maxHeight, maxWidth, source, minY, maxY } = this.props;
    const { crop, maxCrop } = this.state;

    return (
      <View
        style={[
          styles.container,
          ENABLE_DEBUG_MODE ? { backgroundColor: "red" } : {}
        ]}
      >
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
          <View
            style={[
              styles.content,
              {
                width: crop.width,
                height: crop.height
              }
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                backgroundColor: "black",
                width: crop.width,
                height: crop.height,
                opacity: this.revealTopBackdropValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.4]
                }),
                zIndex: 1,
                top: crop.height * -1,
                transform: [
                  {
                    translateY: this.yOffsetValue
                  }
                ]
              }}
            />

            <ResizeBar
              side="top"
              yOffset={this.yOffsetValue}
              min={crop.y * -1}
              max={maxCrop.height - 10}
              width={crop.width}
              onGestureEvent={this.onTranslateY}
              onHandlerStateChange={this.handleTranslateGesture}
            />

            <Animated.View
              style={[
                styles.content,
                {
                  width: crop.width,
                  height: crop.height,
                  alignItems: "center",
                  justifyContent: "center"
                }
              ]}
            >
              <Animated.Image
                source={source}
                pointerEvents="none"
                resizeMode="stretch"
                style={{
                  width: maxCrop.width,
                  height: maxCrop.height,
                  transform: [
                    {
                      translateY: Animated.multiply(this.topOffsetValue, -0.5)
                    }
                  ]
                }}
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                backgroundColor: "black",
                width: crop.width,
                height: crop.height,
                opacity: this.revealTopBackdropValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.4]
                }),
                zIndex: 3,
                bottom: 0,
                transform: [
                  {
                    translateY: this.heightValue
                  }
                ]
              }}
            />

            <ResizeBar
              side="bottom"
              yOffset={this.heightValue}
              width={crop.width}
              min={maxCrop.height - crop.height}
              max={maxCrop.height}
              onGestureEvent={this.onChangeHeight}
              onHandlerStateChange={this.handleHeightGesture}
            />
          </View>
        </View>
      </View>
    );
  }
}

export default ResizableImage;
