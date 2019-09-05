import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import { Dimensions, View, StyleSheet, StatusBar } from "react-native";
import { Transition, Transitioning } from "react-native-reanimated";
import { resizeImage } from "../../lib/imageResize";
import { ImageCropper } from "./ImageCropper";
import { ImagePicker } from "./ImagePicker";
import {
  NewPostType,
  buildImageBlock,
  PostFormat,
  DEFAULT_FORMAT,
  POST_WIDTH,
  presetsByFormat,
  buildPost,
  MAX_POST_HEIGHT
} from "./NewPostFormat";
import { PostEditor, HEADER_HEIGHT } from "./PostEditor";
import { PixelRatio } from "react-native";
import { SPACING, COLORS } from "../../lib/styles";
import { SemiBoldText } from "../Text";
import { IconButton } from "../Button";
import { IconBack } from "../Icon";
import { SafeAreaView } from "react-navigation";
import { getInset } from "react-native-safe-area-view";
import DeviceInfo from "react-native-device-info";
import { calculateAspectRatioFit } from "../../lib/imageResize";
import FormatPicker from "./FormatPicker";
import {
  YeetImageContainer,
  imageContainerFromCameraRoll
} from "../../lib/imageSearch";

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
  defaultPhoto: YeetImageContainer | null;
  step: NewPostStep;
};

const DEFAULT_PHOTO_FIXTURE = imageContainerFromCameraRoll({
  node: {
    image: {
      uri: "https://i.imgur.com/CopIMxf.jpg",
      filename: "CopIMxf.jpg",
      height: 2436,
      width: 1125
    }
  }
});

const DEFAULT_POST_FIXTURE = {
  format: "caption",
  backgroundColor: presetsByFormat["caption"].backgroundColor,
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
        src: null
        // src: {
        //   uri:
        //     "file:///Users/jarred/Library/Developer/CoreSimulator/Devices/E572E605-6C76-497B-8546-126E66F6B24F/data/Containers/Data/Application/E617A55D-994E-4CD3-8E72-D6675CEA8FA1/Library/Caches/581182FA-478B-4DEA-A96A-03DD87DAEA35.png",
        //   width: 1125,
        //   height: 1648.4351851851852
        // },
        // originalSrc: "https://i.imgur.com/CopIMxf.jpg",
        // uri:
        //   "file:///Users/jarred/Library/Developer/CoreSimulator/Devices/E572E605-6C76-497B-8546-126E66F6B24F/data/Containers/Data/Application/E617A55D-994E-4CD3-8E72-D6675CEA8FA1/Library/Caches/581182FA-478B-4DEA-A96A-03DD87DAEA35.png"
      },
      config: {}
    }
  ]
};

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
    height: SCREEN_DIMENSIONS.height,
    backgroundColor: "#000"
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

const DEVELOPMENT_STEP = NewPostStep.choosePhoto;

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
    step: NewPostStep.choosePhoto
  };

  handleChangePost = post => this.setState({ post });

  handleChoosePhoto = (photo: YeetImageContainer) => {
    this.setState({
      step: NewPostStep.resizePhoto,
      defaultPhoto: photo
    });
    this.stepContainerRef.current.animateNextTransition();
  };

  handleEditPhoto = async ({ top, bottom, height, width, x }) => {
    const image = this.state.defaultPhoto;

    const croppedPhoto = await resizeImage({
      image,
      top,
      bottom,
      height,
      x,
      width
    });

    const displayWidth = Math.min(POST_WIDTH, image.image.width);

    const displaySize = {
      width: displayWidth,
      height:
        croppedPhoto.image.height * (displayWidth / croppedPhoto.image.width)
    };

    const post = buildPost({
      format: DEFAULT_FORMAT,
      width: displaySize.width,
      height: displaySize.height,
      blocks: [
        buildImageBlock({
          image: croppedPhoto,
          autoInserted: true,
          format: DEFAULT_FORMAT,
          width: displaySize.width,
          height: displaySize.height,
          required: true
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

  handleChangeFormat = (format: PostFormat) => {
    this.setState({
      post: buildPost({ format, blocks: this.state.post.blocks })
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

  render() {
    const { step } = this.state;
    const isHeaderFloating = step !== NewPostStep.editPhoto;
    return (
      <View style={styles.page}>
        <StatusBar hidden showHideTransition="slide" />

        <Transitioning.View
          ref={this.stepContainerRef}
          transition={
            <Transition.Together>
              <Transition.In type="fade" />
              <Transition.Out type="fade" />
            </Transition.Together>
          }
          style={{ width: POST_WIDTH, height: MAX_POST_HEIGHT }}
        >
          {this.renderStep()}
        </Transitioning.View>

        <FormatPicker
          defaultFormat={this.state.post.format}
          onChangeFormat={this.handleChangeFormat}
        />
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
          key={this.state.post.format}
          onBack={this.handleBack}
          navigation={this.props.navigation}
          onChange={this.handleChangePost}
          onChangeFormat={this.handleChangeFormat}
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
