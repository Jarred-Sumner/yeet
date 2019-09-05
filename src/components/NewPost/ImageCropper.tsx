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
import { YeetImageContainer, YeetImageRect } from "../../lib/imageSearch";

const SCREEN_DIMENSIONS = Dimensions.get("window");

const TOP_INSET = getInset("top");
const BOTTOM_INSET = getInset("bottom");

const FOOTER_HEIGHT = 32 + BOTTOM_INSET;

const TOP_IMAGE_Y = TOP_INSET + SPACING.normal;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    flex: 1,
    width: "100%"
  },
  content: { flex: 1, width: "100%" }
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
  photoSource: ImageResolvedAssetSource;
  originalSource: ImageResolvedAssetSource;
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
      originalSource: image.asset,
      photoSource: image.asset
    };
  }

  transitionRef = React.createRef();

  handleNext = () => {
    this.props.onDone(this.resizableImageRef.current.currentCrop());
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

    const maxImageHeight =
      SCREEN_DIMENSIONS.height - FOOTER_HEIGHT - SPACING.double - 150;

    const maxImageWidth = (maxImageHeight / 812) * SCREEN_DIMENSIONS.width;

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
          style={styles.content}
        >
          <ResizableImage
            key={photoSource.uri}
            ref={this.resizableImageRef}
            originalPhoto={{
              width: photo.image.width,
              height: photo.image.height
            }}
            photo={crop}
            source={photoSource}
            originalSource={originalSource}
            minY={TOP_IMAGE_Y}
            maxY={maxImageHeight - TOP_IMAGE_Y}
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
