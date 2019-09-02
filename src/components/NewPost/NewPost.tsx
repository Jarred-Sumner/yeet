import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import { Dimensions, View, StyleSheet, StatusBar } from "react-native";
import { Transition, Transitioning } from "react-native-reanimated";
import { resizeImage } from "../../lib/imageResize";
import { ImageCropper } from "./ImageCropper";
import { ImagePicker } from "./ImagePicker";
import {
  NewPostType,
  PLACEHOLDER_POST,
  buildImageBlock,
  PostFormat,
  DEFAULT_FORMAT,
  presetsByFormat,
  buildPost
} from "./NewPostFormat";
import { PostEditor, POST_WIDTH, MAX_POST_HEIGHT } from "./PostEditor";
import { PixelRatio } from "react-native";
import { SPACING, COLORS } from "../../lib/styles";
import { SemiBoldText } from "../Text";
import { IconButton } from "../Button";
import { IconBack } from "../Icon";
import { SafeAreaView } from "react-navigation";
import { getInset } from "react-native-safe-area-view";
import DeviceInfo from "react-native-device-info";
import { calculateAspectRatioFit } from "../../lib/imageResize";

const IS_SIMULATOR = DeviceInfo.isEmulator();

const TOP_Y = getInset("top");
const BOTTOM_Y = getInset("bottom");

const SCREEN_DIMENSIONS = Dimensions.get("window");

enum NewPostStep {
  choosePhoto = "choosePhoto",
  resizePhoto = "resizePhoto",
  editPhoto = "editPhoto"
}

type State = {
  post: NewPostType;
  defaultPhoto: CameraRoll.PhotoIdentifier | null;
  step: NewPostStep;
};

const DEFAULT_PHOTO_FIXTURE = {
  node: {
    image: {
      uri: "https://i.imgur.com/CopIMxf.jpg",
      height: 2436,
      width: 1125
    }
  }
};

const DEFAULT_POST_FIXTURE = {
  format: "caption",
  backgroundColor: "transparent",
  blocks: [
    {
      type: "text",
      id: 123123,
      format: "caption",
      value: "",
      autoInserted: true,
      config: {
        placeholder: "Enter a title",
        overrides: {}
      }
    },
    {
      type: "image",
      id: 1231232,
      format: "caption",
      autoInserted: true,
      value: {
        intrinsicWidth: 1125,
        intrinsicHeight: 2436,
        width: 414,
        height: 606.624148148148,
        x: 0,
        y: 0,
        src: {
          uri:
            "file:///Users/jarred/Library/Developer/CoreSimulator/Devices/E572E605-6C76-497B-8546-126E66F6B24F/data/Containers/Data/Application/E617A55D-994E-4CD3-8E72-D6675CEA8FA1/Library/Caches/581182FA-478B-4DEA-A96A-03DD87DAEA35.png",
          width: 1125,
          height: 1648.4351851851852
        },
        originalSrc: "https://i.imgur.com/CopIMxf.jpg",
        uri:
          "file:///Users/jarred/Library/Developer/CoreSimulator/Devices/E572E605-6C76-497B-8546-126E66F6B24F/data/Containers/Data/Application/E617A55D-994E-4CD3-8E72-D6675CEA8FA1/Library/Caches/581182FA-478B-4DEA-A96A-03DD87DAEA35.png"
      },
      config: {}
    }
  ]
};
const HEADER_HEIGHT = 30 + TOP_Y + SPACING.normal;

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 16,
    height: 30,
    textAlignVertical: "center",
    color: "#FFF"
  },

  page: {
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height
  },
  titleContainer: {
    left: 0,
    top: 0,
    bottom: 0,
    paddingTop: 12,
    position: "absolute",
    right: 0
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: SPACING.normal,
    overflow: "visible",
    paddingTop: TOP_Y,
    height: HEADER_HEIGHT,
    flexShrink: 0,
    position: "relative",
    zIndex: 999
  },
  headerFloat: {
    position: "absolute",
    top: 0,
    zIndex: 999
  },
  headerStatic: {
    backgroundColor: COLORS.primary
  },

  backButton: {
    overflow: "visible",
    paddingHorizontal: SPACING.normal
  }
});

const NewPostHeader = ({ onBack, showLabel, float }) => {
  return (
    <View
      pointerEvents="box-none"
      style={
        float
          ? [styles.header, styles.headerFloat]
          : [styles.header, styles.headerStatic]
      }
    >
      <View style={styles.backButton}>
        <IconButton
          onPress={onBack}
          type={float ? "shadow" : "plain"}
          size={24}
          Icon={IconBack}
        />
      </View>
      <View pointerEvents="none" style={styles.titleContainer}>
        {showLabel && (
          <SemiBoldText pointerEvents="none" style={styles.title}>
            Create
          </SemiBoldText>
        )}
      </View>
      <View />
    </View>
  );
};

const DEVELOPMENT_STEP = NewPostStep.editPhoto;

export class NewPost extends React.Component<{}, State> {
  state = {
    post: DEFAULT_POST_FIXTURE,
    defaultPhoto: DEFAULT_PHOTO_FIXTURE,
    bounds: {
      x: 0,
      y: TOP_Y + SPACING.double + 30,
      height:
        SCREEN_DIMENSIONS.height - (TOP_Y + SPACING.double + 30) + BOTTOM_Y,
      width: SCREEN_DIMENSIONS.width
    },
    step: IS_SIMULATOR ? DEVELOPMENT_STEP : NewPostStep.choosePhoto
  };

  handleChangePost = post => this.setState({ post });

  handleChoosePhoto = (photo: CameraRoll.PhotoIdentifier) => {
    this.setState({
      step: NewPostStep.resizePhoto,
      defaultPhoto: photo
    });
    this.stepContainerRef.current.animateNextTransition();
  };

  handleEditPhoto = async ({ top, bottom, height, width, x }) => {
    const image = this.state.defaultPhoto.node.image;

    const displaySize = {
      width: POST_WIDTH,
      height: (height - Math.abs(bottom) - top) * (POST_WIDTH / width)
    };

    const croppedPhoto = await resizeImage({
      top,
      bottom,
      height,
      uri: image.uri,
      width,
      originalWidth: image.width,
      originalHeight: image.height
      // displaySize
    });

    const post = buildPost({
      format: DEFAULT_FORMAT,
      blocks: [
        buildImageBlock({
          image,
          croppedPhoto,
          displaySize,
          autoInserted: true,
          format: DEFAULT_FORMAT
        })
      ]
    });

    this.setState({
      step: NewPostStep.editPhoto,
      croppedPhoto,
      post
    });
    this.stepContainerRef.current.animateNextTransition();
  };

  handleBackToChoosePhoto = () => {
    this.setState({ step: NewPostStep.choosePhoto });
    this.stepContainerRef.current.animateNextTransition();
  };

  handleBack = () => {
    const { step } = this.state;

    if (step === NewPostStep.choosePhoto) {
    } else if (step === NewPostStep.editPhoto) {
      this.setState({ step: NewPostStep.resizePhoto });
    } else if (step === NewPostStep.resizePhoto) {
      this.setState({ step: NewPostStep.choosePhoto });
    }
  };

  stepContainerRef = React.createRef();
  updateBounds = ({ x, y, width, height }) => {
    this.setState({ bounds: { x, y, width, height } });
  };

  render() {
    const { step } = this.state;
    const isHeaderFloating = step !== NewPostStep.editPhoto;
    return (
      <View style={styles.page}>
        <StatusBar hidden showHideTransition="slide" />

        <NewPostHeader
          float={isHeaderFloating}
          onBack={this.handleBack}
          showLabel={step !== NewPostStep.choosePhoto}
        />
        <Transitioning.View
          ref={this.stepContainerRef}
          transition={
            <Transition.Sequence>
              <Transition.In type="fade" />
              <Transition.Out type="fade" />
            </Transition.Sequence>
          }
          style={{ width: "100%", flex: 1 }}
          // onLayout={this.updateBounds}
        >
          {this.renderStep()}
        </Transitioning.View>
      </View>
    );
  }

  renderStep() {
    const { step } = this.state;

    if (step === NewPostStep.editPhoto) {
      return (
        <PostEditor
          bounds={this.state.bounds}
          post={this.state.post}
          onChange={this.handleChangePost}
        />
      );
    } else if (step === NewPostStep.choosePhoto) {
      return (
        <ImagePicker
          height={SCREEN_DIMENSIONS.height}
          width={POST_WIDTH}
          onChange={this.handleChoosePhoto}
        />
      );
    } else if (step === NewPostStep.resizePhoto) {
      return (
        <View
          style={{ marginTop: HEADER_HEIGHT, flex: 1, position: "relative" }}
        >
          <ImageCropper
            photo={this.state.defaultPhoto}
            onDone={this.handleEditPhoto}
            onBack={this.handleBackToChoosePhoto}
          />
        </View>
      );
    } else {
      return null;
    }
  }
}
