import hoistNonReactStatics from "hoist-non-react-statics";
import { isEmpty, omitBy } from "lodash";
import * as React from "react";
import { StatusBar, StyleSheet, Platform, View, TextInput } from "react-native";
import {
  PanGestureHandler,
  State as GestureState
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { withNavigation, withNavigationFocus } from "react-navigation";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { ContentExport, ExportData } from "../../lib/Exporter";
import { calculateAspectRatioFit } from "../../lib/imageResize";
import {
  getSourceDimensions,
  imageContainerFromMediaSource,
  YeetImageContainer,
  YeetImageRect
} from "../../lib/imageSearch";

import { scaleToWidth } from "../../lib/Rect";
import { COLORS, SPACING } from "../../lib/styles";
import { AnimatedKeyboardTracker } from "../AnimatedKeyboardTracker";
import { GallerySheet } from "../Gallery/GallerySheet";
import { MediaPlayerPauser } from "../MediaPlayer";
import FormatPicker, { FORMATS } from "./FormatPicker";
import {
  buildImageBlock,
  buildPost,
  CAROUSEL_HEIGHT,
  generateBlockId,
  MAX_POST_HEIGHT,
  NewPostType,
  PostFormat,
  PostLayout,
  POST_WIDTH
} from "./NewPostFormat";
import { EditableNodeMap } from "./Node/BaseNode";
import { Panner } from "./Panner";
import { HEADER_HEIGHT, PostEditor } from "./PostEditor";
import { PostHeader } from "./PostHeader";
import nanoid from "nanoid/non-secure";
import { layoutBlocksInPost, ExampleMap } from "../../lib/buildPost";
import TextPostBlock from "./TextPostBlock";

enum NewPostStep {
  choosePhoto = "choosePhoto",
  resizePhoto = "resizePhoto",
  editPhoto = "editPhoto"
}

type State = {
  post: NewPostType;
  defaultPhoto: YeetImageContainer | null;
  step: NewPostStep;
  showGallery: Boolean;
  isKeyboardVisible: boolean;
  inlineNodes: EditableNodeMap;
  editToken: string;
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
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
    height: SCREEN_DIMENSIONS.height
  },
  transitioningView: { width: POST_WIDTH, height: SCREEN_DIMENSIONS.height },
  page: {
    flex: 1,
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
  static getExampleCount(examples: ExampleMap = {}) {
    if (!examples) {
      return 0;
    }

    let maxCount = 0;

    Object.entries(examples).forEach(([key, list]) => {
      if (list.length > maxCount) {
        maxCount = list.length;
      }
    });

    return maxCount;
  }

  static defaultProps = {
    defaultFormat: PostFormat.post,
    defaultLayout: PostLayout.media,
    defaultBlocks: {},
    defaultPositions: [],
    examples: {},
    defaultInlineNodes: {},
    defaultBounds: DEFAULT_BOUNDS,
    threadId: null,
    thread: null
  };

  controlsOpacityValue = new Animated.Value(1);

  constructor(props) {
    super(props);

    this.state = {
      showGallery: false,
      isKeyboardVisible: false,
      disableGallery: true,
      editToken: nanoid(),
      exampleIndex: -1,
      exampleCount: isEmpty(props.examples)
        ? 0
        : RawNewPost.getExampleCount(props.examples),

      post: this.buildFromDefaults(props),

      defaultPhoto: null,
      inlineNodes: { ...props.defaultInlineNodes },

      bounds: {
        ...props.defaultBounds,
        x: DEFAULT_BOUNDS.x,
        y: DEFAULT_BOUNDS.y
      }
    };
  }

  componentDidMount() {
    window.requestIdleCallback(() => {
      this.setState({ disableGallery: false });
    });
  }

  handlePressExample = () => {
    const { exampleIndex: _exampleIndex, exampleCount } = this.state;

    if (exampleCount < 1) {
      return;
    }

    const exampleIndex = Math.max(0, _exampleIndex + 1) % exampleCount;

    const inlineNodes = { ...this.state.inlineNodes };
    const blocks = { ...this.state.post.blocks };

    for (const [id, contentList] of Object.entries(this.props.examples)) {
      let string = contentList[
        Math.min(exampleIndex, contentList.length - 1)
      ] as string;

      const block: TextPostBlock = inlineNodes[id]
        ? { ...inlineNodes[id].block }
        : { ...blocks[id] };
      if (block && block.type === "text") {
        block.value = string;

        if (inlineNodes[id]) {
          inlineNodes[id].block = block;
        } else {
          blocks[id] = block;
        }
      }
    }

    const {
      backgroundColor,
      defaultWidth,
      defaultHeight,
      defaultBlock,
      defaultPositions,
      defaultFormat,
      defaultLayout
    } = this.props;

    this.setState(
      {
        exampleIndex,
        post: buildPost({
          backgroundColor,
          width: defaultWidth,
          height: defaultHeight,
          blocks,
          positions: defaultPositions,
          format: defaultFormat,
          layout: defaultLayout
        }),
        inlineNodes
      },
      () => {
        this.postEditor.current.resetText();
      }
    );
  };

  buildFromDefaults = props => {
    return buildPost({
      backgroundColor: props.backgroundColor,
      width: props.defaultWidth,
      height: props.defaultHeight,
      blocks: props.defaultBlocks,
      positions: props.defaultPositions,
      format: props.defaultFormat,
      layout: props.defaultLayout
    });
  };

  resetToDefault = () => {
    this.setState({
      inlineNodes: { ...this.props.defaultInlineNodes },
      post: this.buildFromDefaults(this.props)
    });
  };

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
    const { format, layout, backgroundColor } = this.state.post;
    const displaySize = scaleToWidth(POST_WIDTH, dimensions);

    const block = buildImageBlock({
      image,
      dimensions,
      autoInserted: true,
      layout,
      format,
      width: displaySize.width,
      height: displaySize.height,
      required: true
    });

    const [blocks, positions] = layoutBlocksInPost(
      format,
      layout,
      { [block.id]: block },
      [[block.id]]
    );

    return buildPost({
      format,
      layout,
      width: displaySize.width,
      height: displaySize.height,
      backgroundColor,
      blocks,
      positions
    });
  };

  handleCropPhoto = mediaSource => {
    const photo = imageContainerFromMediaSource(
      mediaSource,
      this.state.defaultPhoto
    );

    this.transitionToEditPhoto(photo);
  };

  handleChangeLayout = (layout: PostLayout) => {
    const {
      format,
      backgroundColor,
      blocks: _blocks,
      positions: _positions
    } = this.state.post;

    if (
      layout !== this.state.post.layout &&
      this.props.defaultLayout === layout
    ) {
      this.resetToDefault();
      return;
    }

    const [blocks, positions] = layoutBlocksInPost(
      format,
      layout,
      _blocks,
      _positions
    );

    this.setState({
      post: buildPost({
        format,
        backgroundColor,
        layout,
        blocks,
        positions
      })
    });

    if (this.state.step === NewPostStep.choosePhoto) {
      window.requestAnimationFrame(() => {
        this.scrollY.setValue(0);
      });
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      !prevProps.isFocused &&
      this.props.isFocused &&
      this.state.disableGallery
    ) {
      this.setState({ disableGallery: false });
    }
  }

  handleBackToChoosePhoto = () => {
    this.setState({ step: NewPostStep.choosePhoto });
    this.scrollY.setValue(0);
  };

  handleBack = () => {
    this.props.navigation.navigate("FeedTab");
  };

  stepContainerRef = React.createRef();

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
    this.handleChangeLayout(FORMATS[index].value);
  };

  pannerRef = React.createRef<PanGestureHandler>();
  layoutIndexValue = new Animated.Value(
    Math.max(FORMATS.indexOf(this.props.defaultLayout), 0)
  );

  openGalleryCallback: Function | null = null;

  handleOpenGallery = ({
    initialRoute,
    shouldAnimate,
    onChange,
    blockId,
    transparent = false,
    autoFocus = false
  }) => {
    if (this.state.showGallery) {
      return;
    }

    this.setState({
      showGallery: true,
      galleryBlockId: blockId,
      disableGallery: false,
      galleryFilter: initialRoute,
      galleryAutoFocus: autoFocus,
      galleryTransparent: transparent
    });
    this.openGalleryCallback = onChange;
  };

  handlePressGallery = (image: YeetImageContainer) => {
    const blockId = this.state.galleryBlockId;

    if (this.openGalleryCallback) {
      this.openGalleryCallback(blockId || generateBlockId(), image);
    }

    this.dismissGallery();
  };

  dismissGallery = () => {
    this.setState({
      showGallery: false,
      disableGallery: false,
      galleryBlockId: null,
      galleryFilter: null,
      galleryAutoFocus: false,
      galleryTransparent: false
    });
    this.openGalleryCallback = null;
  };
  keyboardVisibleValue = new Animated.Value<number>(0);
  keyboardHeightValue = new Animated.Value<number>(0);
  animatedKeyboardVisibleValue = new Animated.Value<number>(0);
  animatedKeyboardHeightValue = new Animated.Value<number>(0);
  headerOffset = new Animated.Value(0);
  headerOpacity = new Animated.Value(0);
  postEditor = React.createRef<View>();

  showKeyboard = event => {
    const {
      endCoordinates: { height: keyboardHeight = 0 }
    } = event;
    this.postEditor?.current?.handleShowKeyboard(event, true);
    this.setState({ isKeyboardVisible: true, keyboardHeight });
  };
  hideKeyboard = event => {
    this.postEditor?.current?.handleHideKeyboard(event, true);
    this.setState({ isKeyboardVisible: false, keyboardHeight: 0 });
  };
  handleBeforeExport = () => this.setState({ disableGallery: true });

  render() {
    const {
      step,
      inlineNodes,
      post: { backgroundColor = "black" }
    } = this.state;
    return (
      <View style={[styles.wrapper, { backgroundColor }]}>
        <AnimatedKeyboardTracker
          onKeyboardShow={this.showKeyboard}
          onKeyboardHide={this.hideKeyboard}
          keyboardVisibleValue={this.keyboardVisibleValue}
          keyboardHeightValue={this.keyboardHeightValue}
          animatedKeyboardVisibleValue={this.animatedKeyboardVisibleValue}
          animatedKeyboardHeightValue={this.animatedKeyboardHeightValue}
        />

        <Panner
          onIndexChange={this.handleChangeLayoutIndex}
          swipeEnabled={Platform.select({
            ios: !this.state.showGallery && !this.state.isKeyboardVisible,
            android: false
          })}
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
          <Animated.View
            pointerEvents={this.state.showGallery ? "none" : "auto"}
            style={styles.page}
          >
            <StatusBar hidden showHideTransition="slide" />

            <Animated.View
              style={[styles.transitionContainer, { backgroundColor }]}
            >
              <MediaPlayerPauser isHidden={this.state.showGallery}>
                <PostEditor
                  bounds={this.state.bounds}
                  post={this.state.post}
                  onBack={this.handleBack}
                  exampleCount={this.state.exampleCount}
                  exampleIndex={this.state.exampleIndex}
                  onPressExample={this.handlePressExample}
                  ref={this.postEditor}
                  keyboardVisibleValue={this.keyboardVisibleValue}
                  keyboardHeightValue={this.keyboardHeightValue}
                  animatedKeyboardVisibleValue={
                    this.animatedKeyboardVisibleValue
                  }
                  animatedKeyboardHeightValue={this.animatedKeyboardHeightValue}
                  keyboardHeight={this.state.keyboardHeight ?? 0}
                  headerOffset={this.headerOffset}
                  headerOpacity={this.headerOpacity}
                  navigation={this.props.navigation}
                  onChange={this.handleChangePost}
                  isReply={!this.props.threadId}
                  onChangeFormat={this.handleChangeLayout}
                  controlsOpacityValue={this.controlsOpacityValue}
                  onOpenGallery={this.handleOpenGallery}
                  inlineNodes={inlineNodes}
                  simultaneousHandlers={[this.pannerRef]}
                  yInset={CAROUSEL_HEIGHT}
                  onChangeNodes={this.handleChangeNodes}
                  onBeforeExport={this.handleBeforeExport}
                  onSubmit={this.handleSubmit}
                />
              </MediaPlayerPauser>
            </Animated.View>

            <PostHeader
              position={this.layoutIndexValue}
              layout={this.state.post.layout}
              defaultLayout={this.props.defaultLayout}
              thumbnail={this.props.thumbnail}
              onChangeLayout={this.handleChangeLayout}
              ref={this.formatPickerRef}
              translateY={this.headerOffset}
              opacity={this.headerOpacity}
              controlsOpacityValue={this.controlsOpacityValue}
            />
          </Animated.View>
        </Panner>
        {!this.state.disableGallery && (
          <GallerySheet
            show={this.state.showGallery}
            blockId={this.state.galleryBlockId}
            onDismiss={this.dismissGallery}
            post={this.state.post}
            onPress={this.handlePressGallery}
            isKeyboardVisible={this.state.isKeyboardVisible}
            initialRoute={this.state.galleryFilter || "all"}
            autoFocus={!!this.state.galleryAutoFocus}
            transparentSearch={!!this.state.galleryTransparent}
            keyboardVisibleValue={this.keyboardVisibleValue}
            keyboardHeightValue={this.keyboardHeightValue}
          />
        )}
      </View>
    );
  }

  handleChangeNodes = (inlineNodes: EditableNodeMap) => {
    this.setState({ inlineNodes: omitBy(inlineNodes, isEmpty) });
  };

  handleSubmit = (contentExport: ContentExport, data: ExportData) => {
    return this.props.onExport(
      contentExport,
      data,
      this.state.post.format,
      this.state.post.layout,
      this.state.editToken
    );
  };
}

export const NewPost = hoistNonReactStatics(
  withNavigationFocus(withNavigation(RawNewPost)),
  RawNewPost
);
export default NewPost;
