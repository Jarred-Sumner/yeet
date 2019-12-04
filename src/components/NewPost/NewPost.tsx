import hoistNonReactStatics from "hoist-non-react-statics";
import { isEmpty, omitBy } from "lodash";
import * as React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import Animated, {
  Transition,
  Transitioning,
  Easing
} from "react-native-reanimated";
import { withNavigation, withNavigationFocus } from "react-navigation";
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
import FormatPicker, { FORMATS } from "./FormatPicker";
import {
  buildImageBlock,
  buildPost,
  DEFAULT_FORMAT,
  DEFAULT_POST_FORMAT,
  MAX_POST_HEIGHT,
  NewPostType,
  PostFormat,
  POST_WIDTH,
  CAROUSEL_HEIGHT,
  PostLayout
} from "./NewPostFormat";
import { EditableNodeMap } from "./Node/BaseNode";
import { HEADER_HEIGHT, PostEditor } from "./PostEditor";
import { PostHeader } from "./PostHeader";
import { ImagePicker } from "./ImagePicker";
import ImageCropper from "./ImageCropper";
import {
  FlingGestureHandler,
  Directions,
  State as GestureState,
  PanGestureHandler
} from "react-native-gesture-handler";
import { CameraRollList, ScreenshotList } from "./ImagePicker/CameraRollList";
import { scaleToWidth } from "../../lib/Rect";
import { MediaPlayerPauser } from "../MediaPlayer";
import { Panner } from "./Panner";

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

const DEFAULT_BOUNDS = {
  x: 0,
  y: 0,
  height: SCREEN_DIMENSIONS.height,
  width: SCREEN_DIMENSIONS.width
};

class RawNewPost extends React.Component<{}, State> {
  static defaultProps = {
    defaultFormat: PostFormat.post,
    defaultLayout: PostLayout.media,
    defaultBlocks: [],
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
        format: props.defaultFormat,
        layout: props.defaultLayout
      }),
      defaultPhoto: null,
      inlineNodes: props.defaultInlineNodes,
      showUploader: false,
      uploadData: null,
      bounds: {
        ...props.defaultBounds,
        x: DEFAULT_BOUNDS.x,
        y: DEFAULT_BOUNDS.y
      }
    };
  }

  handleChangePost = post => this.setState({ post });

  transitionToEditPhoto = (photo: YeetImageContainer) => {
    const post = this.buildPostWithImage(photo, getSourceDimensions(photo));

    this.setState({
      step: NewPostStep.editPhoto,
      defaultPhoto: photo,
      post: post
    });
  };

  transitionToCropPhoto = (photo: YeetImageContainer) => {
    this.setState({
      step: NewPostStep.resizePhoto,
      defaultPhoto: photo
    });
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
    const { format, layout } = this.state.post;
    const displaySize = scaleToWidth(POST_WIDTH, dimensions);

    return buildPost({
      format,
      layout,
      width: displaySize.width,
      height: displaySize.height,
      blocks: [
        buildImageBlock({
          image,
          dimensions,
          autoInserted: true,
          layout,
          format,
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

  handleChangeLayout = (layout: PostLayout) => {
    const { format } = this.state.post;

    this.setState({
      post: buildPost({ format, layout, blocks: this.state.post.blocks })
    });

    if (this.state.step === NewPostStep.choosePhoto) {
      window.requestAnimationFrame(() => {
        this.scrollY.setValue(0);
      });
    }
  };

  handleBackToChoosePhoto = () => {
    this.setState({ step: NewPostStep.choosePhoto });
    this.scrollY.setValue(0);
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
  pauser = React.createRef();
  handleChangeLayoutIndex = (index: number) => {
    console.log({ index });
    this.handleChangeLayout(FORMATS[index].value);
  };

  pannerRef = React.createRef<PanGestureHandler>();
  layoutIndexValue = new Animated.Value(0);

  render() {
    const { step, showUploader, uploadData, inlineNodes } = this.state;
    const isHeaderFloating = step !== NewPostStep.editPhoto;
    return (
      <Panner
        onIndexChange={this.handleChangeLayoutIndex}
        swipeEnabled
        position={this.layoutIndexValue}
        gestureHandlerProps={{
          ref: this.pannerRef
        }}
        index={
          FORMATS.findIndex(
            format => this.state.post.layout === format.value
          ) ?? 0
        }
        length={FORMATS.length}
      >
        <Animated.View style={styles.page}>
          <StatusBar hidden showHideTransition="slide" />

          <Animated.View
            key={this.state.post.layout}
            style={styles.transitionContainer}
          >
            <MediaPlayerPauser ref={this.pauser}>
              <PostEditor
                bounds={this.state.bounds}
                post={this.state.post}
                onBack={this.handleBack}
                navigation={this.props.navigation}
                onChange={this.handleChangePost}
                isReply={!this.props.threadId}
                onChangeFormat={this.handleChangeLayout}
                controlsOpacityValue={this.controlsOpacityValue}
                scrollY={this.scrollY}
                inlineNodes={inlineNodes}
                simultaneousHandlers={[this.pannerRef]}
                yInset={CAROUSEL_HEIGHT}
                onChangeNodes={this.handleChangeNodes}
                onSubmit={this.handleSubmit}
              />
            </MediaPlayerPauser>
          </Animated.View>

          <PostHeader
            position={this.layoutIndexValue}
            layout={this.state.post.layout}
            onChangeLayout={this.handleChangeLayout}
            ref={this.formatPickerRef}
            translateY={this.translateY}
            controlsOpacityValue={this.controlsOpacityValue}
          />
        </Animated.View>
      </Panner>
    );
  }

  handleChangeNodes = (inlineNodes: EditableNodeMap) => {
    this.setState({ inlineNodes: omitBy(inlineNodes, isEmpty) });
  };

  handleSubmit = (contentExport: ContentExport, data: ExportData) => {
    this.pauser.current.pausePlayers();

    return this.props.onExport(contentExport, data, this.state.post.format);
  };
}

export const NewPost = hoistNonReactStatics(
  withNavigationFocus(withNavigation(RawNewPost)),
  RawNewPost
);
export default NewPost;
