import * as React from "react";
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Animation,
  Dimensions,
  ImageEditor
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

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

  return { width: srcWidth * ratio, height: srcHeight * ratio };
}

const SCREEN_DIMENSIONS = Dimensions.get("window");

const TOP_INSET = getInset("top");
const BOTTOM_INSET = getInset("bottom");

const FOOTER_HEIGHT = 32 + BOTTOM_INSET;

const TOP_IMAGE_Y = TOP_INSET + SPACING.double;

const USE_NATIVE_DRIVER = true;
const MAX_WIDTH = SCREEN_DIMENSIONS.width - 2;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height,
    backgroundColor: "#000"
  }
});

const resizeBoxStyles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1,
    left: 0,
    right: 0
  },
  resizeTop: {
    flexDirection: "column-reverse"
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

  backgroundContainer: {
    left: 0,
    right: 0,
    position: "absolute",
    zIndex: 0,
    backgroundColor: "rgba(0,0,0,.45)",
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderColor: "black"
  },
  resizeBarContainer: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
    zIndex: 2,
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

class ResizeBox extends React.Component {
  _translateX = new Animated.Value(0);
  _translateY = new Animated.Value(0);
  _lastOffset = { x: 0, y: 0 };
  _onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          // translationX: this._translateX,
          translationY: this._translateY
        }
      }
    ],
    { useNativeDriver: USE_NATIVE_DRIVER }
  );

  constructor(props) {
    super(props);
    this._translateX = new Animated.Value(0);
    this._translateY = props.translateY;
    this._lastOffset = { x: 0, y: 0 };
    this._onGestureEvent = Animated.event(
      [
        {
          nativeEvent: {
            // translationX: this._translateX,
            translationY: this._translateY
          }
        }
      ],
      { useNativeDriver: USE_NATIVE_DRIVER }
    );
  }
  _onHandlerStateChange = event => {
    if (event.nativeEvent.oldState === GestureState.ACTIVE) {
      this._lastOffset.x += event.nativeEvent.translationX;
      this._lastOffset.y += event.nativeEvent.translationY;
      // this._translateX.setOffset(this._lastOffset.x);
      // this._translateX.setValue(0);
      this._translateY.setOffset(this._lastOffset.y);
      this._translateY.setValue(0);
    }

    if (event.nativeEvent.state === GestureState.END) {
      this.props.onChange(
        this._lastOffset.y,
        this.props.height,
        this.props.width
      );
    }
  };

  get translateYValue() {
    const { side, maxY, minY } = this.props;

    if (side === "top") {
    } else {
    }
  }

  render() {
    const { side, minY, maxY, maxWidth, width, height } = this.props;

    const sideStyle = {};

    if (side === "top") {
      sideStyle.top = 0;
    } else if (side === "bottom") {
      sideStyle.bottom = height * -1;
    }

    const widthStyle = {
      width: width,
      alignSelf: "center"
    };

    const interpolatedYOffset = this._translateY.interpolate({
      inputRange: [0, height],
      outputRange: [0, height]
    });

    return (
      <PanGestureHandler
        {...this.props}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._onHandlerStateChange}
      >
        <Animated.View
          pointerEvents="box-none"
          style={[
            resizeBoxStyles.container,
            sideStyle,
            widthStyle,
            { height },
            {
              transform: [
                {
                  translateX: (SCREEN_DIMENSIONS.width - width) / 2
                },
                {
                  translateY: interpolatedYOffset
                }
              ]
            }
          ]}
        >
          <View
            style={[
              resizeBoxStyles.container,
              widthStyle,
              {
                top: resizeBoxStyles.resizeTop,
                bottom: resizeBoxStyles.resizeBottom
              }[side]
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                resizeBoxStyles.backgroundContainer,
                widthStyle,
                { height }
              ]}
            />

            <View
              style={[
                resizeBoxStyles.resizeBarContainer,
                widthStyle,
                {
                  top: resizeBoxStyles.resizeTop,
                  bottom: resizeBoxStyles.resizeBottom
                }[side]
              ]}
            >
              <View style={resizeBoxStyles.resizeBar} />
              <View
                style={[
                  resizeBoxStyles.resizeHint,
                  {
                    top: resizeBoxStyles.resizeHintTop,
                    bottom: resizeBoxStyles.resizeHintBottom
                  }[side]
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

const croppableImageStyles = StyleSheet.create({
  container: {
    marginTop: TOP_IMAGE_Y,
    alignItems: "center",
    position: "relative",
    overflow: "visible",
    justifyContent: "center",
    width: "100%"
  }
});

class CroppableImage extends React.Component {
  topTranslateY = new Animated.Value(0);
  bottomTranslateY = new Animated.Value(0);
  componentDidUpdate(prevProps) {
    // if (prevProps.cropTopOffset !== this.props.cropTopOffset) {
    //   this.topTranslateY.setValue(0);
    //   this.topTranslateY.setOffset(this.props.cropTopOffset);
    // }
    // if (prevProps.cropBottomOffset !== this.props.cropBottomOffset) {
    //   this.bottomTranslateY.setValue(0);
    //   this.bottomTranslateY.setOffset(this.props.cropBottomOffset);
    // }
  }
  render() {
    const {
      photo,
      maxHeight,
      maxWidth,
      minY,
      onCropTop,
      onCropBottom,
      cropTopOffset,
      cropBottomOffset,
      source
    } = this.props;

    const { width, height } = calculateAspectRatioFit(
      photo.node.image.width,
      photo.node.image.height,
      maxWidth,
      maxHeight
    );

    const relativeY = cropTopOffset;
    const adjustedHeight = height - cropBottomOffset;

    return (
      <View style={[croppableImageStyles.container, { height: height }]}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: (SCREEN_DIMENSIONS.width - width) / 2,
            zIndex: 2,
            right: 0,
            width,
            height,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderColor: COLORS.primary
          }}
        />
        <View
          style={{
            position: "absolute",
            zIndex: 0,
            alignSelf: "center",
            height: adjustedHeight,
            width
          }}
        >
          <Image
            source={source}
            resizeMode="stretch"
            style={{
              width,
              height: height,
              transform: [
                {
                  translateY: relativeY * -1
                }
              ]
            }}
          />
        </View>

        <ResizeBox
          side="top"
          minY={0}
          height={adjustedHeight}
          onChange={onCropTop}
          translateY={this.topTranslateY}
          width={width}
          maxY={height}
        />
        <ResizeBox
          side="bottom"
          minY={0}
          height={adjustedHeight}
          onChange={onCropBottom}
          translateY={this.bottomTranslateY}
          width={width}
          maxY={height}
        />
      </View>
    );
  }
}

const nextButtonStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.normal,
    height: 47,
    width: 47,
    borderRadius: 24,
    backgroundColor: COLORS.primary
  },
  icon: {
    color: "white",
    marginLeft: 0
  }
});

const NextButton = ({ onPress }) => {
  return (
    <RectButton onPress={onPress}>
      <View style={nextButtonStyles.container}>
        <IconChevronRight style={nextButtonStyles.icon} size={24} />
      </View>
    </RectButton>
  );
};

const footerBarStyles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: SPACING.normal,
    alignItems: "center",
    height: FOOTER_HEIGHT,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

const FooterBar = ({ onReset, onNext }) => {
  return (
    <SafeAreaView
      forceInset={{
        bottom: "always",
        top: "never",
        left: "never",
        right: "never"
      }}
      style={footerBarStyles.container}
    >
      <View />

      <NextButton onPress={onNext} />
    </SafeAreaView>
  );
};

export class ImageCropper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cropTopOffset: 0,
      cropBottomOffset: 0,
      photoSource: Image.resolveAssetSource({
        width: props.photo.node.image.width,
        height: props.photo.node.image.height,
        uri: props.photo.node.image.uri
      })
    };
  }

  onCropBottom = (y: number, height: number, width: number) => {
    this.onCrop({
      top: this.state.cropTopOffset,
      bottom: y * -1 + this.state.cropBottomOffset,
      height,
      width
    });
  };

  onCrop = ({ top: cropTopOffset, bottom: cropBottomOffset, width }) => {
    const multiplier = this.state.photoSource.width / width;
    console.log({ cropTopOffset, cropBottomOffset });
    this.setState({ cropTopOffset, cropBottomOffset });
    // const size = {
    //   width: width * multiplier,
    //   height: (height + yValue) * multiplier
    // };
    // console.log({ size, multiplier, height, width });
    // ImageEditor.cropImage(
    //   this.state.photoSource.uri,
    //   {
    //     offset: {
    //       x: 0,
    //       y: 0
    //     },
    //     size,
    //     displaySize: undefined,
    //     resizeMode: "stretch"
    //   },
    //   uri => {
    //     this.setState({
    //       cropBottomOffset: yValue,
    //       photoSource: {
    //         uri,
    //         ...size
    //       }
    //     });
    //   },
    //   console.error
    // );
  };

  onCropTop = (y: number, height: number, width: number) => {
    this.onCrop({
      top: y + this.state.cropTopOffset,
      bottom: this.state.cropBottomOffset,
      height,
      width
    });
  };

  render() {
    const { photo } = this.props;
    const { cropTopOffset, cropBottomOffset, photoSource } = this.state;

    const maxImageHeight =
      SCREEN_DIMENSIONS.height -
      FOOTER_HEIGHT -
      TOP_IMAGE_Y -
      SPACING.double -
      SPACING.double;

    return (
      <View style={styles.container}>
        <CroppableImage
          photo={photo}
          source={photoSource}
          minY={TOP_IMAGE_Y}
          maxWidth={maxImageHeight * (9 / 16)}
          onCropTop={this.onCropTop}
          key={`${cropTopOffset}-${cropBottomOffset}`}
          cropTopOffset={cropTopOffset}
          cropBottomOffset={cropBottomOffset}
          onCropBottom={this.onCropBottom}
          maxHeight={maxImageHeight}
        />

        <FooterBar />
      </View>
    );
  }
}

export default ImageCropper;
