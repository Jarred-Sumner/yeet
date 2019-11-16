import hoistNonReactStatics from "hoist-non-react-statics";
import { isEmpty, omitBy } from "lodash";
import * as React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import Animated, {
  Transition,
  Transitioning,
  Easing
} from "react-native-reanimated";
import { withNavigation } from "react-navigation";
import {
  BOTTOM_Y,
  IS_DEVELOPMENT,
  SCREEN_DIMENSIONS,
  TOP_Y
} from "../../../config";
import { ContentExport, ExportData } from "../../lib/Exporter";
import { resizeImage, calculateAspectRatioFit } from "../../lib/imageResize";
import {
  getSourceDimensions,
  YeetImageContainer,
  YeetImageRect,
  imageContainerFromCameraRoll,
  imageContainerFromMediaSource
} from "../../lib/imageSearch";
import { COLORS, SPACING } from "../../lib/styles";
import { PostUploader, RawPostUploader } from "../PostUploader";
import { sendToast, ToastType } from "../Toast";
import FormatPicker from "./FormatPicker";
import {
  buildImageBlock,
  buildPost,
  DEFAULT_FORMAT,
  DEFAULT_POST_FORMAT,
  MAX_POST_HEIGHT,
  NewPostType,
  PostFormat,
  POST_WIDTH,
  CAROUSEL_HEIGHT
} from "./NewPostFormat";
import { EditableNodeMap } from "./Node/BaseNode";
import { HEADER_HEIGHT, PostEditor } from "./PostEditor";
import { PostHeader } from "./PostHeader";
import { ImagePicker } from "./ImagePicker";
import ImageCropper from "./ImageCropper";
import {
  FlingGestureHandler,
  Directions,
  State as GestureState
} from "react-native-gesture-handler";
import { CameraRollList, ScreenshotList } from "./ImagePicker/CameraRollList";
import { scaleToWidth } from "../../lib/Rect";

enum NewPostStep {
  choosePhoto = "choosePhoto",
  resizePhoto = "resizePhoto",
  editPhoto = "editPhoto"
}

type State = {
  post: NewPostType;
  defaultPhoto: YeetImageContainer | null;
  step: NewPostStep;
  inlineNodes: EditableNodeMap;
};

const DEFAULT_POST_FIXTURE = {
  [PostFormat.screenshot]: {
    format: PostFormat.screenshot,
    backgroundColor: "#000",
    blocks: [
      {
        type: "image",
        id: "1231232",
        format: "screenshot",
        required: true,
        autoInserted: true,
        value: null,
        config: {
          dimensions: {}
        }
      }
    ]
  },
  [PostFormat.library]: {
    format: PostFormat.library,
    backgroundColor: "#000",
    blocks: [
      {
        type: "image",
        id: "1231232",
        format: "screenshot",
        required: true,
        autoInserted: true,
        value: null,
        config: {
          dimensions: {}
        }
      }
    ]
  },
  [PostFormat.caption]: {
    format: PostFormat.canvas,
    backgroundColor: "#000",
    blocks: [
      {
        type: "text",
        id: "123123",
        format: "caption",
        value: "",
        autoInserted: true,
        config: { placeholder: "Enter a title", overrides: {} }
      },
      {
        type: "image",
        id: "1231232",
        format: "caption",
        required: true,
        autoInserted: true,
        value: null,
        config: {
          dimensions: {}
        }
      }
    ]
  },
  [PostFormat.canvas]: {
    format: PostFormat.canvas,
    backgroundColor: "#000",
    blocks: []
  }
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
  transitionContainer: {
    width: POST_WIDTH,
    height: SCREEN_DIMENSIONS.height,
    backgroundColor: "black"
  },
  transitioningView: { width: POST_WIDTH, height: SCREEN_DIMENSIONS.height },
  page: {
    flex: 1
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

enum StickyHeaderBehavior {
  revealOnScrollUp = 1,
  absoluteTop = 2
}

const DEVELOPMENT_STEP = NewPostStep.choosePhoto;

// const post = IS_DEVELOPMENT ? DEVELOPMENT_POST_FIXTURE : DEFAULT_POST_FIXTURE;
export const DEFAULT_POST =
  IS_DEVELOPMENT && typeof DEVELOPMENT_POST_FIXTURE !== "undefined"
    ? DEVELOPMENT_POST_FIXTURE
    : DEFAULT_POST_FIXTURE[DEFAULT_POST_FORMAT];

const DEFAULT_BOUNDS = {
  x: 0,
  y: 0,
  height: SCREEN_DIMENSIONS.height,
  width: SCREEN_DIMENSIONS.width
};

class RawNewPost extends React.Component<{}, State> {
  static defaultProps = {
    defaultFormat: DEFAULT_POST.format,
    defaultBlocks: DEFAULT_POST.blocks,
    defaultInlineNodes: {},
    defaultBounds: DEFAULT_BOUNDS,
    threadId: null,
    thread: null
  };

  controlsOpacityValue = new Animated.Value(1);

  constructor(props) {
    super(props);

    this.state = {
      post: buildPost({
        width: props.defaultWidth,
        height: props.defaultHeight,
        blocks: props.defaultBlocks,
        format: props.defaultFormat
      }),
      defaultPhoto: null,
      inlineNodes: props.defaultInlineNodes,
      showUploader: false,
      uploadData: null,
      bounds: {
        ...props.defaultBounds,
        x: DEFAULT_BOUNDS.x,
        y: DEFAULT_BOUNDS.y
      },
      step: NewPostStep.choosePhoto
    };
  }

  handleChangePost = post => this.setState({ post });

  transitionToEditPhoto = (photo: YeetImageContainer) => {
    const post = this.buildPostWithImage(photo, getSourceDimensions(photo));

    Animated.timing(this.animatedTranslateY, {
      toValue: CAROUSEL_HEIGHT * -1,
      duration: 400,
      easing: Easing.elastic()
    }).start(() => {
      window.requestAnimationFrame(() => {
        this.scrollY.setValue(0);
        this.animatedTranslateY.setValue(0);
      });
    });

    this.setState({
      step: NewPostStep.editPhoto,
      defaultPhoto: photo,
      post: post
    });
    this.stepContainerRef.current.animateNextTransition();
  };

  transitionToCropPhoto = (photo: YeetImageContainer) => {
    this.setState({
      step: NewPostStep.resizePhoto,
      defaultPhoto: photo
    });

    this.stepContainerRef.current.animateNextTransition();
  };

  handleChoosePhoto = (photo: YeetImageContainer) => {
    const cropThreshold = 0.66;
    const { height } = calculateAspectRatioFit(
      photo.image.width,
      photo.image.height,
      SCREEN_DIMENSIONS.width,
      SCREEN_DIMENSIONS.height
    );

    const aspectFitCropRatio = height / MAX_POST_HEIGHT;
    const shouldCropPhoto = aspectFitCropRatio > cropThreshold || height < 300;

    if (shouldCropPhoto) {
      this.transitionToCropPhoto(photo);
    } else {
      this.transitionToEditPhoto(photo);
    }
  };

  buildPostWithImage = (
    image: YeetImageContainer,
    dimensions: YeetImageRect
  ) => {
    const displaySize = scaleToWidth(POST_WIDTH, dimensions);

    return buildPost({
      format: this.state.post.format,
      width: displaySize.width,
      height: displaySize.height,
      blocks: [
        buildImageBlock({
          image,
          dimensions,
          autoInserted: true,
          format: this.state.post.format,
          width: displaySize.width,
          height: displaySize.height,
          required: true
        })
      ]
    });
  };

  handleCropPhoto = mediaSource => {
    const photo = imageContainerFromMediaSource(
      mediaSource,
      this.state.defaultPhoto
    );

    this.transitionToEditPhoto(photo);
  };

  scrollY = new Animated.Value<number>(CAROUSEL_HEIGHT * -1);

  clampedScrollY = Animated.cond(
    Animated.greaterThan(this.scrollY, CAROUSEL_HEIGHT * -1),
    Animated.diffClamp(this.scrollY, 0, CAROUSEL_HEIGHT),
    0
  );

  scrollUpTranslateY = Animated.interpolate(this.clampedScrollY, {
    inputRange: [0, CAROUSEL_HEIGHT],
    outputRange: [0, CAROUSEL_HEIGHT * -1],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  animatedTranslateY = new Animated.Value(0);

  translateY = Animated.cond(
    Animated.lessThan(this.animatedTranslateY, 0),
    this.animatedTranslateY,
    this.scrollUpTranslateY
  );

  handleChangeFormat = (format: PostFormat) => {
    this.stepContainerRef.current.animateNextTransition();

    if (
      this.state.post.blocks.length === 0 &&
      DEFAULT_POST_FIXTURE[format].blocks.length > 0
    ) {
      this.setState({
        post: DEFAULT_POST_FIXTURE[format]
      });
    } else {
      this.setState({
        post: buildPost({ format, blocks: this.state.post.blocks })
      });
    }

    window.requestAnimationFrame(() => {
      this.scrollY.setValue(0);
    });
  };

  handleBackToChoosePhoto = () => {
    this.setState({ step: NewPostStep.choosePhoto });
    this.scrollY.setValue(0);
    this.stepContainerRef.current.animateNextTransition();
  };

  handleBack = () => {
    this.props.navigation.navigate("FeedTab");
  };

  stepContainerRef = React.createRef();
  postUploaderRef = React.createRef<RawPostUploader>();

  onFlingLeft = ({ nativeEvent: { state, ...other } }) => {
    if (state === GestureState.ACTIVE) {
      this.formatPickerRef.current.goNext();
    }
  };

  onFlingRight = ({ nativeEvent: { state, ...other } }) => {
    if (state === GestureState.ACTIVE) {
      this.formatPickerRef.current.goPrevious();
    }
  };

  formatPickerRef = React.createRef<FormatPicker>();

  render() {
    const { step, showUploader, uploadData, inlineNodes } = this.state;
    const isHeaderFloating = step !== NewPostStep.editPhoto;
    return (
      <FlingGestureHandler
        onHandlerStateChange={this.onFlingRight}
        direction={Directions.RIGHT}
      >
        <Animated.View style={styles.page}>
          <FlingGestureHandler
            onHandlerStateChange={this.onFlingLeft}
            direction={Directions.LEFT}
          >
            <Animated.View style={styles.page}>
              <StatusBar hidden showHideTransition="slide" />

              <Transitioning.View
                ref={this.stepContainerRef}
                transition={
                  <Transition.Sequence>
                    {/* <Transition.In type="fade" /> */}
                    <Transition.Out type="fade" />
                  </Transition.Sequence>
                }
                style={styles.transitioningView}
              >
                <Animated.View
                  style={styles.transitionContainer}
                  key={`${this.state.post.format}-${this.state.step}`}
                >
                  {this.renderStep()}
                </Animated.View>
              </Transitioning.View>

              <PostHeader
                defaultFormat={this.state.post.format}
                onChangeFormat={this.handleChangeFormat}
                ref={this.formatPickerRef}
                translateY={this.translateY}
                controlsOpacityValue={this.controlsOpacityValue}
              />
            </Animated.View>
          </FlingGestureHandler>
        </Animated.View>
      </FlingGestureHandler>
    );
  }

  handleChangeNodes = (inlineNodes: EditableNodeMap) => {
    this.setState({ inlineNodes: omitBy(inlineNodes, isEmpty) });
  };

  handleSubmit = (contentExport: ContentExport, data: ExportData) =>
    this.props.onExport(contentExport, data, this.state.post.format);

  renderStep() {
    const { inlineNodes, step } = this.state;

    const { format } = this.state.post;

    if (step === NewPostStep.editPhoto) {
      return (
        <PostEditor
          bounds={this.state.bounds}
          post={this.state.post}
          key={this.state.post.format}
          onBack={this.handleBack}
          navigation={this.props.navigation}
          onChange={this.handleChangePost}
          isReply={!this.props.threadId}
          onChangeFormat={this.handleChangeFormat}
          controlsOpacityValue={this.controlsOpacityValue}
          scrollY={this.scrollY}
          inlineNodes={inlineNodes}
          yInset={CAROUSEL_HEIGHT}
          onChangeNodes={this.handleChangeNodes}
          onSubmit={this.handleSubmit}
        />
      );
    } else if (step === NewPostStep.resizePhoto) {
      return (
        <ImageCropper
          height={SCREEN_DIMENSIONS.height}
          width={SCREEN_DIMENSIONS.width}
          scrollEnabled
          source={this.state.defaultPhoto}
          photo={this.state.defaultPhoto}
          paddingTop={CAROUSEL_HEIGHT}
          animatedYOffset={this.scrollY}
          onDone={this.handleCropPhoto}
        />
      );
    } else if (step === NewPostStep.choosePhoto) {
      if (format === PostFormat.screenshot) {
        return (
          <ScreenshotList
            height={SCREEN_DIMENSIONS.height}
            width={SCREEN_DIMENSIONS.width}
            scrollEnabled
            paddingTop={CAROUSEL_HEIGHT}
            animatedYOffset={this.scrollY}
            onChange={this.handleChoosePhoto}
          />
        );
      } else {
        return (
          <CameraRollList
            height={SCREEN_DIMENSIONS.height}
            width={SCREEN_DIMENSIONS.width}
            scrollEnabled
            paddingTop={CAROUSEL_HEIGHT}
            tabBarHeight={CAROUSEL_HEIGHT}
            animatedYOffset={this.scrollY}
            onChange={this.handleChoosePhoto}
          />
        );
      }
    } else {
      return null;
    }
  }
}

export const NewPost = hoistNonReactStatics(
  withNavigation(RawNewPost),
  RawNewPost
);
export default NewPost;
