import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  PanGestureHandler,
  State as GestureState,
  ScrollView
} from "react-native-gesture-handler";
import { isNumber } from "lodash";
import Animated from "react-native-reanimated";
import { limit, preserveOffset, runDelay } from "react-native-redash";
import { calculateAspectRatioFit } from "../../lib/imageResize";
import { YeetImageRect, mediaSourceFromImage } from "../../lib/imageSearch";
import { COLORS } from "../../lib/styles";
import Image from "../Image";
import { MediaPlayerComponent } from "../MediaPlayer";
import { BoundsRect } from "../../lib/Rect";
import {
  SCREEN_DIMENSIONS,
  TOP_Y,
  BOTTOM_Y,
  IS_SIMULATOR
} from "../../../config";
import { getInset } from "react-native-safe-area-view";

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

const ENABLE_DEBUG_MODE = IS_SIMULATOR;
const USE_NATIVE_DRIVER = true;

const RESIZE_BAR_HEIGHT = 14;

const styles = StyleSheet.create({
  container: {
    flex: 0,
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
      gestureRef,
      height,
      onGestureEvent,
      onHandlerStateChange,
      simultaneousHandlers,
      min,
      max
    },
    ref
  ) => {
    return (
      <>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          simultaneousHandlers={simultaneousHandlers}
          ref={gestureRef}
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
            opacity: 0.8,
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
  photo: YeetImageRect;
};

type State = {
  crop: {
    x: number;
    y: number;
    height: number;
    width: number;
    scale: number;
    contentOffset: {
      x: number;
      y: number;
    };
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

    const crop = {
      initialScale: photo.width / width,
      width,
      height,
      x: 0,
      top: 0,
      bottom: 0,
      scale: 1.0,
      contentOffset: {
        x: 0,
        y: 0
      }
    };

    const isProbablyAScreenshotFromThisPhone =
      photo.width / SCREEN_DIMENSIONS.scale === SCREEN_DIMENSIONS.width &&
      photo.height / SCREEN_DIMENSIONS.scale === SCREEN_DIMENSIONS.height;

    if (isProbablyAScreenshotFromThisPhone && TOP_Y > 0) {
      crop.top = (TOP_Y * SCREEN_DIMENSIONS.scale) / crop.initialScale;
    }

    this.height = height;
    this.heightValue = new Animated.Value(height);
    this._yOffsetValue.setValue(0);
    this._bottomOffsetValue.setValue(0);

    this.yOffsetValue = limit(
      preserveOffset(
        this._yOffsetValue,
        this.yOffsetGestureState,
        new Animated.Value(crop.top)
      ),
      this.yOffsetGestureState,
      0,
      Animated.max(sub(this.heightValue, this.bottomOffsetValue), 10)
    );

    this.bottomOffsetValue = limit(
      preserveOffset(this._bottomOffsetValue, this.heightGestureState),
      this.heightGestureState,
      multiply(sub(this.heightValue, this.yOffsetValue), -1),
      0
    );

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
      crop
    };
  }

  imageLoadedValue = new Animated.Value(1);

  handleCrop = ([yOffset, bottomOffset]) => {
    this.setState({
      crop: {
        ...this.state.crop,
        top: yOffset,
        bottom: bottomOffset
      }
    });
  };

  currentCrop = () => {
    console.log(this.state.crop);
    return this.state.crop;
  };

  handleImageLoad = ({ nativeEvent }) => {
    console.log("LOAD", nativeEvent);
  };
  handleImageError = ({ nativeEvent }) => {
    console.log("ERROR", nativeEvent);
  };

  handleScroll = ({
    nativeEvent: { zoomScale: scale, contentOffset, ...other }
  }) => {
    this.setState({
      crop: {
        ...this.state.crop,
        scale: isNumber(scale) ? scale : this.state.crop.scale,
        contentOffset:
          typeof contentOffset === "object"
            ? contentOffset
            : this.state.crop.contentOffset
      }
    });
  };

  imageRef = React.createRef<MediaPlayerComponent>();

  performCrop = () => {
    const {
      top: top,
      bottom = 0,
      width: _width,
      height: _height,
      scale,
      initialScale,
      contentOffset: _offset
    } = this.state.crop;

    const naturalSize = {
      width: this.props.photo.width,
      height: this.props.photo.height
    };
    // The crop works like this:
    // - You can crop from the top or the bottom
    // - When cropping from the top or bottom, it is not proportional.
    // - You can also zoom up to 6x.
    const offset = {
      x: Math.max((_offset.x / scale) * initialScale, 0),
      y: Math.max(((_offset.y + top) / scale) * initialScale, 0)
    };

    const size = {
      width: naturalSize.width - offset.x,
      height:
        naturalSize.height -
        offset.y -
        (Math.abs(bottom) / scale) * initialScale
    };

    const cropArea: BoundsRect = {
      ...offset,
      ...size
    };

    console.log({
      cropArea,
      top,
      bottom,
      scale
    });

    if (
      cropArea.x === 0 &&
      cropArea.y === 0 &&
      top === 0 &&
      bottom === 0 &&
      scale === 1.0
    ) {
      return Promise.resolve(
        mediaSourceFromImage(this.props.source, this.state.crop, false)
      );
    }

    return this.imageRef.current.crop(cropArea, {
      width: _width * initialScale,
      height: _height * initialScale
    });
  };

  bottomPanRef = React.createRef<PanGestureHandler>();
  topPanRef = React.createRef<PanGestureHandler>();

  render() {
    const {
      maxHeight,
      maxWidth,
      minY,
      maxY,
      source,
      originalSource
    } = this.props;
    const { crop } = this.state;

    const mediaSource = mediaSourceFromImage(source, crop, false);
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
                  100
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
            <Animated.View
              style={[
                styles.content,
                {
                  width: crop.width,
                  height: crop.height,
                  overflow: "visible",

                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }
              ]}
            >
              <ResizeBar
                side="top"
                yOffset={this.yOffsetValue}
                min={crop.top * -1}
                gestureRef={this.topPanRef}
                height={crop.height}
                max={crop.height}
                width={crop.width}
                onGestureEvent={this.onTranslateY}
                onHandlerStateChange={this.onTranslateY}
                simultaneousHandlers={[this.bottomPanRef]}
              />

              <ScrollView
                bouncesZoom={false}
                onMomentumScrollEnd={this.handleScroll}
                onScrollAnimationEnd={this.handleScroll}
                onScrollEndDrag={this.handleScroll}
                maximumZoomScale={6.0}
                waitFor={[this.topPanRef, this.bottomPanRef]}
                bounces={false}
                minimumZoomScale={1.0}
                zoomScale={this.state.crop.scale}
                contentOffset={this.state.crop.contentOffset}
                style={{
                  width: crop.width,
                  height: crop.height
                }}
              >
                <Image
                  mediaSource={mediaSource}
                  pointerEvents="none"
                  onLoad={this.handleImageLoad}
                  onError={this.handleImageError}
                  autoPlay
                  id={`resizable-${mediaSource.id}`}
                  paused={false}
                  isVisible
                  ref={this.imageRef}
                  resizeMode="cover"
                  style={{
                    width: crop.width,
                    height: crop.height
                  }}
                />
              </ScrollView>

              <ResizeBar
                side="bottom"
                yOffset={this.bottomOffsetValue}
                height={crop.height}
                width={crop.width}
                gestureRef={this.bottomPanRef}
                min={0}
                max={crop.height}
                simultaneousHandlers={[this.topPanRef]}
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
