import * as React from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";
import {
  PanGestureHandler,
  RectButton,
  State as GestureState
} from "react-native-gesture-handler";
import { Transition, Transitioning } from "react-native-reanimated";
import { getInset } from "react-native-safe-area-view";
import { SafeAreaView } from "react-navigation";
import { COLORS, SPACING } from "../../lib/styles";
import { IconChevronRight } from "../Icon";
import { ResizableImage } from "./ResizableImage";
import { resizeImage } from "../../lib/imageResize";

const SCREEN_DIMENSIONS = Dimensions.get("window");

const TOP_INSET = getInset("top");
const BOTTOM_INSET = getInset("bottom");

const FOOTER_HEIGHT = 32 + BOTTOM_INSET;

const TOP_IMAGE_Y = TOP_INSET + SPACING.normal;

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
      crop: {
        x: 0,
        y: 0,
        width: props.photo.node.image.width,
        height: props.photo.node.image.height
      },
      originalSource: Image.resolveAssetSource({
        width: props.photo.node.image.width,
        height: props.photo.node.image.height,
        uri: props.photo.node.image.uri
      }),
      photoSource: Image.resolveAssetSource({
        width: props.photo.node.image.width,
        height: props.photo.node.image.height,
        uri: props.photo.node.image.uri
      })
    };
  }

  handleCrop = async (
    topOffset: number,
    bottomOffset: number,
    { width, x, height, y }
  ) => {
    console.log("1");
    const { image } = this.props.photo.node;
    const newHeight = height - bottomOffset;
    console.log("2");
    const source = await resizeImage({
      uri: this.state.photoSource,
      width,
      x,
      y: topOffset,
      height: newHeight,
      originalWidth: image.width,
      originalHeight: image.height
    });

    this.setState({
      photoSource: {
        width: source.width,
        height: source.height,
        uri: source.uri
      },
      crop: {
        ...source,
        bottom: bottomOffset
      }
    });

    this.transitionRef.current.animateNextTransition();
  };

  transitionRef = React.createRef();

  render() {
    const { photo } = this.props;
    const {
      cropTopOffset,
      cropBottomOffset,
      photoSource,
      crop,
      originalSource
    } = this.state;

    const maxImageHeight =
      SCREEN_DIMENSIONS.height -
      FOOTER_HEIGHT -
      SPACING.double -
      TOP_IMAGE_Y -
      80;

    const maxImageWidth = (maxImageHeight / 812) * 375;

    return (
      <View style={styles.container}>
        <Transitioning.View
          ref={this.transitionRef}
          transition={
            <Transition.Sequence>
              {/* <Transition.Change interpolation="linear" />
              <Transition.In type="scale" /> */}
            </Transition.Sequence>
          }
          style={{ height: "100%", width: "100%" }}
        >
          <ResizableImage
            key={photoSource.uri}
            originalPhoto={{
              width: photo.node.image.width,
              height: photo.node.image.height
            }}
            photo={crop}
            source={photoSource}
            originalSource={originalSource}
            minY={TOP_IMAGE_Y}
            maxY={maxImageHeight + TOP_IMAGE_Y}
            maxWidth={maxImageWidth}
            maxHeight={maxImageHeight}
            onCrop={this.handleCrop}
          />
        </Transitioning.View>

        <FooterBar />
      </View>
    );
  }
}

export default ImageCropper;
