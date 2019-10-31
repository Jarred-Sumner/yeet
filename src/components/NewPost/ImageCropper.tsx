import * as React from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  View,
  ImageResolvedAssetSource
} from "react-native";
import {
  PanGestureHandler,
  RectButton,
  State as GestureState,
  BorderlessButton
} from "react-native-gesture-handler";
import { Transition, Transitioning } from "react-native-reanimated";
import { getInset } from "react-native-safe-area-view";
import { SafeAreaView } from "react-navigation";
import { COLORS, SPACING } from "../../lib/styles";
import { IconChevronRight, IconChevronLeft } from "../Icon";
import { ResizableImage } from "./ResizableImage";
import { resizeImage } from "../../lib/imageResize";
import { BoldText } from "../Text";
import {
  YeetImageContainer,
  YeetImageRect,
  YeetImage
} from "../../lib/imageSearch";
import { BOTTOM_Y, TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { CAROUSEL_HEIGHT } from "./NewPostFormat";

const FOOTER_HEIGHT = 32 + BOTTOM_Y;

const TOP_IMAGE_Y = TOP_Y + CAROUSEL_HEIGHT;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "flex-end",
    flex: 1,
    width: "100%"
  },
  content: {
    flex: 1,
    width: "100%",
    alignSelf: "flex-end",
    justifyContent: "center"
  }
});

const nextButtonStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.double,
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary
  },
  icon: {
    color: "white",
    marginLeft: 1
  }
});

const NextButton = ({ onPress }) => {
  return (
    <BorderlessButton activeOpacity={0.8} onPress={onPress}>
      <View style={nextButtonStyles.container}>
        <IconChevronRight style={nextButtonStyles.icon} size={25} />
      </View>
    </BorderlessButton>
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

type Props = {
  photo: YeetImageContainer;
};

type State = {
  crop: YeetImageRect;
  photoSource: YeetImage;
  originalSource: YeetImage;
};

export class ImageCropper extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { image } = props.photo;

    this.state = {
      crop: {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      },
      originalSource: image,
      photoSource: image
    };
  }

  transitionRef = React.createRef();

  handleNext = async () => {
    const result = await this.resizableImageRef.current.performCrop();

    this.props.onDone(result);
  };

  resizableImageRef = React.createRef<ResizableImage>();

  render() {
    const { photo, onBack } = this.props;
    const {
      cropTopOffset,
      cropBottomOffset,
      photoSource,
      crop,

      originalSource
    } = this.state;

    const isVerticalPhoto = photoSource.height / photoSource.width > 1.0;
    const isHorizontalPhoto = photoSource.width / photoSource.height > 1.0;

    let maxImageHeight =
      SCREEN_DIMENSIONS.height - TOP_IMAGE_Y - FOOTER_HEIGHT - SPACING.double;

    let maxImageWidth = SCREEN_DIMENSIONS.width;

    return (
      <View style={styles.container}>
        <Transitioning.View
          ref={this.transitionRef}
          transition={
            <Transition.Sequence>
              <Transition.Change interpolation="linear" />
              <Transition.In type="scale" />
            </Transition.Sequence>
          }
          style={styles.content}
        >
          <ResizableImage
            key={photoSource.uri}
            ref={this.resizableImageRef}
            originalPhoto={this.props.photo}
            photo={crop}
            source={this.props.photo}
            originalSource={this.props.photo}
            minY={TOP_IMAGE_Y}
            maxY={maxImageHeight}
            maxWidth={maxImageWidth}
            maxHeight={maxImageHeight}
            onCrop={this.handleCrop}
          />
        </Transitioning.View>

        <FooterBar onNext={this.handleNext} />
      </View>
    );
  }
}

export default ImageCropper;
