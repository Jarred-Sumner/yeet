import { isEmpty, omitBy } from "lodash";
import nanoid from "nanoid/non-secure";
import * as React from "react";
import { LayoutAnimation, StatusBar, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import {
  ExampleMap,
  layoutBlocksInPost,
  presetsByFormat
} from "../../lib/buildPost";
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
import { MediaPlayerPauser } from "../MediaPlayer";
import { FORMATS } from "./FormatPicker";
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
import { HEADER_HEIGHT, PostEditor } from "./PostEditor";
import TextPostBlock from "./TextPostBlock";
import { doKeyboardAnimation } from "../../lib/animations";
import { PostSchemaProvider } from "./PostSchemaProvider";

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
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height
  },
  transitioningView: {
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height
  },
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

export class NewPost extends React.Component<{}, State> {
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
    minX: 0,
    minY: 0,
    defaultPositions: [],
    examples: {},
    defaultInlineNodes: {},
    defaultBounds: DEFAULT_BOUNDS,
    threadId: null,
    thread: null
  };

  constructor(props) {
    super(props);

    this.state = {
      showGallery: false,
      isKeyboardVisible: false,
      disableGallery: false,
      keyboardHeight: 0,
      editToken: nanoid(),
      exampleIndex: -1,
      exampleCount: isEmpty(props.examples)
        ? 0
        : NewPost.getExampleCount(props.examples),

      defaultPhoto: null,
      inlineNodes: { ...props.defaultInlineNodes },

      bounds: {
        ...props.defaultBounds,
        height: props.defaultHeight,
        width: props.defaultWidth,
        x: props.minX,
        y: props.minY
      }
    };

    const scrollY = this.paddingTop * -1;
    this.scrollY = new Animated.Value<number>(scrollY);
  }

  offsetY = new Animated.Value(0);

  handlePressExample = () => {
    // const { exampleIndex: _exampleIndex, exampleCount } = this.state;
    // if (exampleCount < 1) {
    //   return;
    // }
    // const exampleIndex = Math.max(0, _exampleIndex + 1) % exampleCount;
    // const inlineNodes = { ...this.state.inlineNodes };
    // const blocks = { ...this.state.post.blocks };
    // for (const [id, contentList] of Object.entries(this.props.examples)) {
    //   let string = contentList[
    //     Math.min(exampleIndex, contentList.length - 1)
    //   ] as string;
    //   const block: TextPostBlock = inlineNodes[id]
    //     ? { ...inlineNodes[id].block }
    //     : { ...blocks[id] };
    //   if (block && block.type === "text") {
    //     block.value = string;
    //     if (inlineNodes[id]) {
    //       inlineNodes[id].block = block;
    //     } else {
    //       blocks[id] = block;
    //     }
    //   }
    // }
    // const {
    //   backgroundColor,
    //   defaultWidth,
    //   defaultHeight,
    //   defaultBlock,
    //   defaultPositions,
    //   defaultFormat,
    //   defaultLayout
    // } = this.props;
    // this.setState(
    //   {
    //     exampleIndex,
    //     post: buildPost({
    //       backgroundColor,
    //       width: defaultWidth,
    //       height: defaultHeight,
    //       blocks,
    //       positions: defaultPositions,
    //       format: defaultFormat,
    //       layout: defaultLayout
    //     }),
    //     inlineNodes
    //   },
    //   () => {
    //     this.postEditor.current.resetText();
    //   }
    // );
  };

  resetToDefault = () => {
    // this.setState({
    //   inlineNodes: { ...this.props.defaultInlineNodes },
    //   post: this.buildFromDefaults(this.props)
    // });
  };

  handleChangePost = post => this.setState({ post });

  handleChangeLayout = (layout: PostLayout) => {
    const {
      format,
      backgroundColor,
      blocks: _blocks,
      positions: _positions
    } = this.state.post;

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
  };

  handleBack = () => {
    this.props.navigation.navigate("FeedTab");
  };

  get paddingTop() {
    return;
  }

  stepContainerRef = React.createRef();
  scrollY: Animated.Value<number>;

  pauser = React.createRef();
  handleChangeLayoutIndex = (index: number) => {
    this.handleChangeLayout(FORMATS[index].value);
  };

  openGalleryCallback: Function | null = null;

  handleOpenGallery = ({
    initialRoute,
    shouldAnimate,
    onChange,
    blockId,
    transparent = false,
    autoFocus = false
  }) => {
    this.props.navigation.push("ImagePicker", {
      onChange: (image, post) => onChange(blockId, image, post),
      initialRoute: initialRoute
    });
  };

  postEditor = React.createRef<View>();

  showKeyboard = event => {
    const {
      endCoordinates: { height: keyboardHeight = 0 }
    } = event;
    this.postEditor?.current?.handleShowKeyboard(event, true);

    doKeyboardAnimation();
    this.setState({ isKeyboardVisible: true, keyboardHeight });
  };
  hideKeyboard = event => {
    doKeyboardAnimation();
    this.postEditor?.current?.handleHideKeyboard(event, true);
    this.setState({ isKeyboardVisible: false, keyboardHeight: 0 });
  };
  handleBeforeExport = () => this.setState({ disableGallery: true });

  render() {
    const paddingTop = CAROUSEL_HEIGHT + presetsByFormat.post.paddingTop;
    const backgroundColor = "#000";

    return (
      <PostSchemaProvider
        layout={this.props.defaultLayout}
        width={this.props.defaultWidth}
        height={this.props.defaultHeight}
        blocks={this.props.defaultBlocks}
        defaultInlineNodes={this.props.defaultInlineNodes}
        positions={this.props.defaultPositions}
        backgroundColor={this.props.defaultBackgroundColor}
        format={this.props.defaultFormat}
      >
        <View style={[styles.wrapper, { backgroundColor }]}>
          <View
            pointerEvents={this.state.showGallery ? "none" : "auto"}
            style={styles.page}
          >
            <StatusBar hidden={false} showHideTransition="slide" />

            <View style={[styles.transitionContainer, { backgroundColor }]}>
              <MediaPlayerPauser isHidden={!this.props.isFocused}>
                <PostEditor
                  onBack={this.handleBack}
                  exampleCount={this.state.exampleCount}
                  exampleIndex={this.state.exampleIndex}
                  offsetY={this.offsetY}
                  onPressExample={this.handlePressExample}
                  scrollY={this.scrollY}
                  ref={this.postEditor}
                  keyboardVisibleValue={this.keyboardVisibleValue}
                  keyboardHeightValue={this.keyboardHeightValue}
                  animatedKeyboardVisibleValue={
                    this.animatedKeyboardVisibleValue
                  }
                  keyboardHeight={this.state.keyboardHeight ?? 0}
                  headerOpacity={this.headerOpacity}
                  navigation={this.props.navigation}
                  onChange={this.handleChangePost}
                  isReply={!this.props.threadId}
                  onChangeFormat={this.handleChangeLayout}
                  isFocused={this.props.isFocused}
                  onOpenGallery={this.handleOpenGallery}
                  simultaneousHandlers={[]}
                  onChangeLayout={this.handleChangeLayout}
                  paddingTop={paddingTop}
                  onChangeNodes={this.handleChangeNodes}
                  onBeforeExport={this.handleBeforeExport}
                  onSubmit={this.handleSubmit}
                />
              </MediaPlayerPauser>
            </View>
          </View>
          {/* <GallerySheet
          show={this.state.showGallery}
          blockId={this.state.galleryBlockId}
          onDismiss={this.dismissGallery}
          post={this.state.post}
          onPress={this.handlePressGallery}
          isKeyboardVisible={this.state.isKeyboardVisible}
          initialRoute={this.state.galleryFilter || "all"}
          autoFocus={!!this.state.galleryAutoFocus}
          keyboardHeight={this.state.keyboardHeight}
          transparentSearch={!!this.state.galleryTransparent}
          keyboardVisibleValue={this.keyboardVisibleValue}
          keyboardHeightValue={this.keyboardHeightValue}
        /> */}
        </View>
      </PostSchemaProvider>
    );
  }

  handleChangeNodes = (inlineNodes: EditableNodeMap) => {
    // this.setState({ inlineNodes: omitBy(inlineNodes, isEmpty) });
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
