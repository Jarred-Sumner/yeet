import { connectActionSheet } from "@expo/react-native-action-sheet";
import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import { Keyboard, StyleSheet, View, InputAccessoryView } from "react-native";
import {
  ScrollView,
  State as GestureState,
  TextInput
} from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated from "react-native-reanimated";
import { NavigationEvents } from "react-navigation";
import tinycolor from "tinycolor2";
import { IS_SIMULATOR, TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { startExport } from "../../lib/Exporter";
import {
  YeetImageContainer,
  YeetImageRect,
  ImageSourceType,
  isVideo
} from "../../lib/imageSearch";
import { SPACING } from "../../lib/styles";
import { sendLightFeedback } from "../../lib/Vibration";
import { AnimatedKeyboardTracker } from "../AnimatedKeyboardTracker";
import { sendToast, ToastType } from "../Toast";
import { isDeletePressed, FOOTER_HEIGHT } from "./EditorFooter";
import { ImagePickerRoute } from "./ImagePicker";
import { ActiveLayer } from "./layers/ActiveLayer";
import {
  buildImageBlock,
  buildTextBlock,
  FocusType,
  isPlaceholderImageBlock,
  MAX_POST_HEIGHT,
  minImageWidthByFormat,
  PostBlockType,
  PostFormat,
  POST_WIDTH,
  presetsByFormat,
  PostLayout,
  ImagePostBlock,
  TextTemplate
} from "./NewPostFormat";
import {
  buildEditableNode,
  EditableNode,
  EditableNodeMap
} from "./Node/BaseNode";
import { EditableNodeList, PostPreview } from "./PostPreview";
import {
  DEFAULT_TOOLBAR_BUTTON_TYPE,
  ToolbarButtonType,
  ToolbarType
} from "./Toolbar";
import { GallerySectionItem } from "./ImagePicker/FilterBar";
import { TextInputToolbar } from "./TextInputToolbar";

const { block, cond, set, eq, sub } = Animated;

export const HEADER_HEIGHT = 30 + SPACING.normal;

const styles = StyleSheet.create({
  safeWrapper: {
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    width: POST_WIDTH,
    flex: 1,
    position: "relative"
  },
  container: {
    width: POST_WIDTH
  },
  wrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    flexShrink: 0,
    width: POST_WIDTH,
    alignSelf: "center"
  },

  layerStyles: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
});

enum LayerZIndex {
  sheet = 1,
  nodeOverlay = 3,
  icons = 4,
  footer = 4,
  inlineNodes = 5
}

const MiddleSheet = ({ width, height }) => {
  return (
    <LinearGradient
      // useAngle
      width={width}
      height={height}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      // angle={180}
      // angleCenter={{ x: 0.0, y: 0.0 }}
      locations={[0.0, 0.8, 1.0]}
      colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0.25)"]}
    />
  );
};

const Layer = ({
  zIndex,
  isShown = true,
  pointerEvents = "box-none",
  children,
  isFrozen,
  opacity,
  width,
  flipY = false,
  height
}) => {
  if (!isShown) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={pointerEvents}
      needsOffscreenAlphaCompositing={isFrozen}
      shouldRasterizeIOS={isFrozen}
      renderToHardwareTextureAndroid={isFrozen}
      style={[
        StyleSheet.absoluteFillObject,
        {
          width,
          height,
          zIndex,
          opacity,
          alignSelf: "stretch",
          overflow: "visible",
          backgroundColor: "transparent"
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

type Props = {
  post: any;
  inlineNodes: EditableNodeMap;
};

type State = {
  activeButton: ToolbarButtonType;
  inlineNodes: EditableNodeMap;
  focusedBlockId: string | null;
  focusType: FocusType | null;
  isSaving: boolean;
  bottomInset: number;
};

const DarkSheet = ({ opacity }) => (
  <Animated.View
    pointerEvents="none"
    style={[
      StyleSheet.absoluteFill,
      {
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        opacity
      }
    ]}
  />
);

class RawwPostEditor extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      activeButton: DEFAULT_TOOLBAR_BUTTON_TYPE,
      focusedBlockId: null,
      focusType: null,
      isSaving: false,
      bottomInset: 0
    };

    this._blockInputRefs = new Map([
      ...props.post.blocks.map(({ id }) => [id, React.createRef()])
    ]);

    if (IS_SIMULATOR) {
      // this.state.inlineNodes.set(IMAGE_NODE_FIXTUER.block.id, {
      //   ...IMAGE_NODE_FIXTUER,
      //   position: {
      //     ...IMAGE_NODE_FIXTUER.position,
      //     animatedX: new Animated.Value(IMAGE_NODE_FIXTUER.position.x),
      //     animatedY: new Animated.Value(IMAGE_NODE_FIXTUER.position.y),
      //     animatedRotate: new Animated.Value(
      //       IMAGE_NODE_FIXTUER.position.rotate
      //     ),
      //     animatedScale: new Animated.Value(IMAGE_NODE_FIXTUER.position.scale)
      //   }
      // });
    }
  }

  handleWillFocus = () => {
    // this.scrollRef.current &&
    //   this.scrollRef.current.getScrollResponder().scrollTo({
    //     x: 0,
    //     y: (presetsByFormat[this.props.post.format].paddingTop || 0) * -1,
    //     animated: false
    //   });
  };

  deleteNode = (id: string) => {
    this.props.onChangeNodes({
      ...this.props.inlineNodes,
      [id]: undefined
    });

    if (this._inlineNodeRefs.has(id)) {
      this._inlineNodeRefs.delete(id);
    }

    if (this._blockInputRefs.has(id)) {
      this._blockInputRefs.delete(id);
    }

    if (this.state.focusedBlockId === id) {
      this.setState({ focusedBlockId: null, focusType: null });
      this.focusedBlockValue.setValue(-1);
      this.focusTypeValue.setValue(-1);
    }
  };

  componentWillUnmount() {}

  handlePressToolbarButton = activeButton => {
    if (activeButton === ToolbarButtonType.photo) {
      this.handleInsertPhoto(undefined, GallerySectionItem.photos);
    } else if (activeButton === ToolbarButtonType.gif) {
      this.handleInsertPhoto(undefined, GallerySectionItem.gifs);
    } else if (activeButton === ToolbarButtonType.text) {
      this.handleInsertText({
        x: POST_WIDTH / 2,
        y: MAX_POST_HEIGHT / 2
      });
    } else if (activeButton === ToolbarButtonType.plus) {
      const options = ["Text", "Image", "Cancel"];
      const cancelButtonIndex = options.length - 1;

      this.props.showActionSheetWithOptions(
        {
          title: "Append to bottom",
          options,
          cancelButtonIndex
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            const block = buildTextBlock({
              value: "",
              format: this.props.post.format,
              layout: PostLayout.text,
              placeholder: "Write something",
              autoInserted: false,
              required: false,
              template: TextTemplate.post
            });

            this.handleAppendBlock(block);

            this._blockInputRefs.set(block.id, React.createRef());
            this.focusTypeValue.setValue(FocusType.static);
            this.focusedBlockValue.setValue(block.id.hashCode());
            this.setState(
              {
                focusedBlockId: block.id,
                focusType: FocusType.static
              },
              () => {
                this._blockInputRefs.get(block.id).current.focus();
              }
            );
          } else if (buttonIndex === 1) {
            const format = this.props.post.format;
            const minWidth = minImageWidthByFormat(format);

            const block = buildImageBlock({
              image: null,
              width: minWidth,
              height: minWidth,
              autoInserted: false,
              format,
              layout: this.props.post.layout,
              required: false
            });

            this._blockInputRefs.set(block.id, React.createRef());
            this.handleAppendBlock(block);
            this.handleOpenImagePicker(block, false);
          }
        }
      );
    }
  };

  handleAppendBlock = (block: PostBlockType) => {
    this.handleChangeBlock(block, this.props.post.blocks.length);
  };

  handleInlineNodeChange = (editableNode: EditableNode) => {
    if (
      editableNode.block.type === "text" &&
      editableNode.block.value.trim().length === 0 &&
      this.props.inlineNodes[editableNode.block.id]
    ) {
      this.deleteNode(editableNode.block.id);
    } else {
      this.props.onChangeNodes({
        ...this.props.inlineNodes,
        [editableNode.block.id]: editableNode
      });
    }
  };

  handleChangeBlock = (block: PostBlockType, index: number) => {
    const blocks = [...this.props.post.blocks];
    blocks.splice(index, 1, block);

    this.props.onChange({
      ...this.props.post,
      blocks
    });
  };

  handleInsertText = ({ x, y }) => {
    const block = buildTextBlock({
      value: "",
      format: PostFormat.sticker,
      template: TextTemplate.comic,
      layout: PostLayout.text,
      placeholder: " ",
      autoInserted: false
    });
    const editableNode = buildEditableNode({
      block,
      x,
      y
    });

    this.props.onChangeNodes({
      ...this.props.inlineNodes,
      [block.id]: editableNode
    });
    this._blockInputRefs.set(block.id, React.createRef());
    this.focusTypeValue.setValue(FocusType.absolute);
    this.focusedBlockValue.setValue(block.id.hashCode());
    this.setState({
      focusedBlockId: block.id,
      focusType: FocusType.absolute
    });
  };

  nodeListRef = React.createRef();

  handleTapNode = (node: EditableNode) => {
    if (this.state.activeButton !== ToolbarButtonType.text) {
      return;
    }

    const { focusedBlockId } = this.state;

    if (focusedBlockId === node.block.id) {
      if (node.block.type === "text" && node.block.value.trim().length === 0) {
        this.deleteNode(node.block.id);
        return;
      }

      this.setState({ focusedBlockId: null, focusType: null });
      this.focusedBlockValue.setValue(-1);
      this.focusTypeValue.setValue(-1);
    } else {
      if (node.block.type === "text") {
        this.setState({
          focusedBlockId: node.block.id,
          focusType: FocusType.absolute
        });
        this.focusedBlockValue.setValue(node.block.id.hashCode());
        this.focusTypeValue.setValue(FocusType.absolute);
      }
    }
  };

  handleBlur = () => {
    const node = this.props.inlineNodes[this.state.focusedBlockId];

    if (node) {
      this.handleBlurNode(node);
    } else {
      const block = this.props.post.blocks.find(
        ({ id }) => this.state.focusedBlockId === id
      );
      Keyboard.dismiss();
      this.handleBlurBlock(block);
    }
  };

  handleBlurNode = (node: EditableNode) => {
    if (node) {
      if (node.block.type === "text" && node.block.value.trim().length === 0) {
        this.deleteNode(node.block.id);
      } else {
        this.props.onChangeNodes({
          ...this.props.inlineNodes,
          [node.block.id]: node
        });
        this.focusedBlockValue.setValue(-1);
        this.focusTypeValue.setValue(-1);
        this.setState({ focusedBlockId: null, focusType: null });
      }
    }
  };

  handleBlurBlock = (block: PostBlockType) => {
    const index = this.props.post.blocks.findIndex(({ id }) => id === block.id);

    this.handleChangeBlock(block, index);
    this.setState({ focusType: null, focusedBlockId: null });
    this.focusedBlockValue.setValue(-1);
    this.focusTypeValue.setValue(-1);
  };

  handleFocusBlock = block => {
    const focusType = this.props.inlineNodes[block.id]
      ? FocusType.absolute
      : FocusType.static;

    this.focusedBlockValue.setValue(block.id.hashCode());
    this.focusTypeValue.setValue(focusType);

    this.setState({
      focusedBlockId: block.id,
      focusType
    });
  };

  handleDownload = async () => {
    try {
      const [snapshot, _] = await this.createSnapshot(false);

      console.time("Camera Roll");
      if (IS_SIMULATOR) {
        return sendToast("Skipped save due to simulator", ToastType.success);
      }
      return CameraRoll.saveToCameraRoll(
        snapshot.uri,
        String(snapshot.type).includes("image") ? "photo" : "video"
      ).then(
        () => {
          console.timeEnd("Camera Roll");
          sendToast("Saved.", ToastType.success);
        },
        () => {
          sendToast("Couldn't save.", ToastType.error);
        }
      );
    } catch (exception) {
      sendToast("Uh-oh. Please try again.", ToastType.error);
      console.error(exception);
    }
  };
  handleSend = async () => {
    console.log("Start sending");
    const [snapshot, data] = await this.createSnapshot(true);

    return this.props.onSubmit(snapshot, data);
  };

  createSnapshot = async (isServerOnly: boolean) => {
    // this._inlineNodeRefs.entries().map([]);
    // const overlayURI = await captureRef(this.nodeListRef.current, {
    //   format: "png",
    //   quality: 1.0
    // });
    return startExport(
      this.props.post.blocks,
      this.props.inlineNodes,
      this._blockInputRefs,
      this.contentViewRef,
      this._inlineNodeRefs,
      isServerOnly
    );
  };

  blankResizeRef = React.createRef();
  _inlineNodeRefs = new Map();
  _blockInputRefs = new Map<string, React.RefObject<TextInput>>();

  setBlockInputRef = (id: string): React.MutableRefObject<TextInput> => {
    let ref;
    if (this._blockInputRefs.has(id)) {
      ref = this._blockInputRefs.get(id);
    } else {
      ref = React.createRef<TextInput>();
      this._blockInputRefs.set(id, ref);
    }

    return ref;
  };

  setNodeRef = (id: string, node: View) => {
    this._inlineNodeRefs.set(id, node);
  };

  scrollRef = React.createRef<ScrollView>();
  keyboardVisibleValue = this.props.keyboardVisibleValue;
  keyboardHeightValue = this.props.keyboardHeightValue;
  focusedBlockValue = new Animated.Value<number>(-1);
  focusTypeValue = new Animated.Value<FocusType | -1>(-1);

  tapX = new Animated.Value(-1);
  tapY = new Animated.Value(-1);

  tapGestureState = new Animated.Value(GestureState.UNDETERMINED);
  onTapBackground = Animated.event(
    [
      {
        nativeEvent: { state: this.tapGestureState, x: this.tapX, y: this.tapY }
      }
    ],
    { useNativeDriver: true }
  );

  // findNode = (x: number, y: number) => {
  //   Object.values(this.props.inlineNodes).find(node => {
  //     node.position.x
  //   })
  // };

  handleTapBackground = ([tapGestureState, x, y]) => {
    const { focusedBlockId } = this.state;

    this.handlePressBackground({ x, y });
  };

  handlePressDownBackground = ({
    nativeEvent: { locationX: x, locationY: y }
  }) => {
    this.handlePressBackground({ x, y });
  };

  handlePressBackground = ({ x, y }) => {
    if (this.state.focusType === null) {
      this.handleInsertText({ x, y });
    } else {
      // Works around issue with blur
      Keyboard.dismiss();
      this.focusedBlockValue.setValue(-1);
      this.focusTypeValue.setValue(-1);
    }
  };

  updateBounds = ({
    nativeEvent: {
      layout: { x, y, width, height }
    }
  }) => {
    this.setState({
      bounds: { x, y: y + this.props.yInset, width, height }
    });
  };

  handleOpenImagePicker = (block: ImagePostBlock, shouldAnimate = true) => {
    let initialRoute;
    if (block.value) {
      if (block.value.image.source === ImageSourceType.giphy) {
        initialRoute = GallerySectionItem.gifs;
      } else if (isVideo(block.value.image.mimeType)) {
        initialRoute = GallerySectionItem.videos;
      } else if (block.value.image?.mimeType) {
        initialRoute = GallerySectionItem.photos;
      }
    }

    this.props.onOpenGallery({
      blockId: block?.id,
      initialRoute,
      shouldAnimate,
      onChange: this.handleChangeImageBlockPhoto
    });
  };

  handleInsertPhoto = (block, initialRoute = "all", shouldAnimate = false) => {
    this.props.onOpenGallery({
      blockId: block?.id,
      initialRoute,
      shouldAnimate,
      onChange: this.handleInsertSticker
    });
  };

  handleInsertSticker = (
    blockId: string = null,
    image: YeetImageContainer,
    dimensions?: YeetImageRect
  ) => {
    const minWidth = minImageWidthByFormat(PostFormat.sticker);

    const block = buildImageBlock({
      image,
      id: blockId,
      layout: PostLayout.media,
      width: minWidth,
      height: image.image.height * (minWidth / image.image.width),
      dimensions,
      autoInserted: false,
      format: PostFormat.sticker
    });

    const editableNode = buildEditableNode({
      block,
      x: POST_WIDTH / 2 - block.config.dimensions.maxX / 2,
      y: MAX_POST_HEIGHT / 2 - block.config.dimensions.maxY / 2
    });

    this._blockInputRefs.set(block.id, React.createRef());
    this.props.onChangeNodes({
      ...this.props.inlineNodes,
      [block.id]: editableNode
    });

    this.setState({
      focusedBlockId: null,
      focusType: null,
      activeButton: ToolbarButtonType.text
    });
    this.focusedBlockValue.setValue(-1);
    this.focusTypeValue.setValue(-1);
  };

  handleChangeImageBlockPhoto = (
    blockId: string,
    image: YeetImageContainer,
    dimensions?: YeetImageRect
  ) => {
    const blockIndex = this.props.post.blocks.findIndex(
      block => block.id === blockId
    );

    const _block = this.props.post.blocks[blockIndex];

    const minWidth = minImageWidthByFormat(_block.format);

    const block = buildImageBlock({
      image,
      id: blockId,
      layout: _block.layout,
      width: minWidth,
      height: image.image.height * (minWidth / image.image.width),
      dimensions,
      format: _block.format
    });

    const blocks = [...this.props.post.blocks];
    blocks.splice(blockIndex, 1, block);

    this.props.onChange({
      ...this.props.post,
      blocks
    });
  };

  buttonRef = React.createRef();
  lastTappedBlockId = null;
  openImagePickerForPlaceholder = () => {
    const block = this.props.post.blocks.find(isPlaceholderImageBlock);

    if (!block) {
      return;
    }

    this.handleOpenImagePicker(block);
  };

  tapRef = React.createRef();
  allowBackgroundTap = false;

  get toolbarType() {
    const { focusType, focusedBlockId } = this.state;
    if (focusType === null || !focusedBlockId) {
      return ToolbarType.default;
    }

    if (focusType === FocusType.panning) {
      return ToolbarType.panning;
    }

    const block = this.focusedBlock;

    if (block && block.type === "text") {
      return ToolbarType.text;
    }

    return ToolbarType.default;
  }

  get focusedBlock() {
    const { focusedBlockId, focusType } = this.state;

    const node = this.props.inlineNodes[focusedBlockId];
    return node
      ? node.block
      : this.props.post.blocks.find(block => block.id === focusedBlockId);
  }

  handlePan = ({
    blockId,
    isPanning,
    x,
    y
  }: {
    blockId: string;
    isPanning: boolean;
    x: number;
    y: number;
  }) => {
    if (isPanning) {
      const focusType = FocusType.panning;
      if (blockId !== this.state.focusedBlockId) {
        this.focusedBlockValue.setValue(blockId.hashCode());
      }

      if (this.state.focusType !== focusType) {
        this.focusTypeValue.setValue(focusType);
      }

      this.setState({
        focusedBlockId: blockId,
        focusType
      });
    } else {
      const { focusedBlockId, focusType } = this.state;

      if (
        focusedBlockId === blockId &&
        focusType === FocusType.panning &&
        isDeletePressed(x, y)
      ) {
        this.deleteNode(blockId);
        sendLightFeedback();
      } else {
        this.setState({
          focusedBlockId: null,
          focusType: null
        });

        this.focusedBlockValue.setValue(-1);
        this.focusTypeValue.setValue(-1);
      }
    }
  };

  panToolbarClock = new Animated.Clock();

  handleTapBlock = (blockId: string) => (this.lastTappedBlockId = blockId);
  hasPlaceholderImageBlocks = () =>
    !!this.props.post.blocks.find(isPlaceholderImageBlock);

  get panningNode() {
    const { focusedBlockId, focusType } = this.state;

    if (focusType === FocusType.panning) {
      return this.props.inlineNodes[focusedBlockId];
    } else {
      return null;
    }
  }

  panX = new Animated.Value(0);
  panY = new Animated.Value(0);
  contentViewRef = React.createRef();
  topInsetValue = new Animated.Value<number>(this.props.yInset || 0);

  relativeKeyboardHeightValue = Animated.sub(
    this.keyboardHeightValue,
    this.props.scrollY
  );

  scrollToTop = () =>
    this.scrollRef.current.getScrollResponder().scrollTo({
      y: presetsByFormat[this.props.post.format].paddingTop * -1,
      x: 0
    });

  handleShowKeyboard = (event, hasHappened) => {
    // hasHappened && this.scrollRef.current.handleKeyboardEvent(event);
    // if (this.state.focusType === FocusType.absolute) {
    //   this.scrollToTop();
    // }
  };
  handleHideKeyboard = (event, hasHappened) => {
    // this.scrollRef.current.handleKeyboardEvent(event);
    // hasHappened && this.scrollRef.current.resetKeyboardSpace();
  };
  handleChangeFrame = event => {
    // this.scrollRef.current.handleKeyboardEvent(event);
  };

  handleChangeBottomInset = bottomInset => this.setState({ bottomInset });

  handleBack = () => {
    if (this.state.focusType !== null) {
      this.handleBlur();
    } else {
      this.props.onBack();
    }
  };

  render() {
    const { post } = this.props;
    const presets = presetsByFormat[post.format];

    const {
      bounds = {
        width: POST_WIDTH,
        height: SCREEN_DIMENSIONS.height,
        x: 0,
        y: 0
      }
    } = this.state;
    const sizeStyle = {
      width: bounds.width || POST_WIDTH,
      height: bounds.height || SCREEN_DIMENSIONS.height
    };

    return (
      <Animated.View
        style={[
          styles.wrapper,
          sizeStyle,
          {
            backgroundColor: post.backgroundColor
          }
        ]}
      >
        <NavigationEvents onWillFocus={this.handleWillFocus} />

        <Animated.Code
          exec={Animated.block([
            set(this.props.headerOpacity, sub(1.0, this.keyboardVisibleValue)),
            Animated.onChange(
              this.focusTypeValue,
              block([
                cond(
                  eq(this.focusTypeValue, FocusType.panning),

                  Animated.block([set(this.props.controlsOpacityValue, 1.0)])
                ),
                cond(eq(this.focusTypeValue, FocusType.absolute), [
                  set(this.props.controlsOpacityValue, 1.0)
                ]),

                cond(eq(this.focusTypeValue, FocusType.static), [
                  set(
                    this.props.controlsOpacityValue,
                    sub(1.0, this.keyboardVisibleValue)
                  )
                ]),
                cond(eq(this.focusTypeValue, -1), [
                  set(this.props.controlsOpacityValue, 1.0)
                ])
              ])
            ),
            // Ignore background taps when keyboard is showing/hiding
            Animated.onChange(
              this.tapGestureState,
              block([
                cond(
                  Animated.and(
                    eq(this.tapGestureState, GestureState.END),
                    Animated.or(
                      eq(this.keyboardVisibleValue, 0),
                      eq(this.keyboardVisibleValue, 1)
                    )
                  ),
                  Animated.call(
                    [this.tapGestureState, this.tapX, this.tapY],
                    this.handleTapBackground
                  )
                )
              ])
            )
          ])}
        />

        <Animated.View
          onLayout={this.updateBounds}
          style={[
            styles.safeWrapper,
            styles.scrollContainer,
            {
              // maxHeight: MAX_POST_HEIGHT,
              width: bounds.width
            }
          ]}
        >
          <PostPreview
            bounds={bounds}
            blocks={post.blocks}
            paddingTop={(presets.paddingTop || 0) + this.props.yInset}
            paddingBottom={FOOTER_HEIGHT}
            inlineNodes={this.props.inlineNodes}
            focusedBlockId={this.state.focusedBlockId}
            topInsetValue={this.topInsetValue}
            layout={post.layout}
            simultaneousHandlers={this.props.simultaneousHandlers}
            focusTypeValue={this.focusTypeValue}
            minX={bounds.x}
            onTapBlock={this.handleTapBlock}
            minY={bounds.y}
            contentViewRef={this.contentViewRef}
            backgroundColor={post.backgroundColor || "#000"}
            focusedBlockValue={this.focusedBlockValue}
            onTapBackground={this.onTapBackground}
            scrollY={this.props.scrollY}
            ref={this.scrollRef}
            maxX={bounds.width}
            swipeOnly={this.hasPlaceholderImageBlocks()}
            onFocus={this.handleFocusBlock}
            onOpenImagePicker={this.handleOpenImagePicker}
            onChangePhoto={this.handleChangeImageBlockPhoto}
            waitFor={[this.scrollRef, ...this._blockInputRefs.values()]}
            maxY={bounds.height}
            onlyShow={this.state.focusedBlockId}
            onBlur={this.handleBlurBlock}
            focusType={FocusType.static}
            setBlockInputRef={this.setBlockInputRef}
            onChangeNode={this.handleInlineNodeChange}
            setBlockAtIndex={this.handleChangeBlock}
            showEditableNodes={this.state.isSaving}
          >
            <Layer
              flipY
              pointerEvents="box-none"
              zIndex={LayerZIndex.inlineNodes}
              opacity={this.props.controlsOpacityValue}
            >
              <DarkSheet
                opacity={Animated.cond(
                  Animated.eq(this.focusTypeValue, FocusType.absolute),
                  this.keyboardVisibleValue,
                  0
                )}
              />
              <EditableNodeList
                inlineNodes={this.props.inlineNodes}
                format={post.format}
                setNodeRef={this.setNodeRef}
                focusedBlockId={this.state.focusedBlockId}
                focusedBlockValue={this.focusedBlockValue}
                setBlockInputRef={this.setBlockInputRef}
                panX={this.panX}
                panY={this.panY}
                scrollY={this.props.scrollY}
                topInsetValue={this.topInsetValue}
                focusTypeValue={this.focusTypeValue}
                keyboardVisibleValue={this.keyboardVisibleValue}
                keyboardHeightValue={this.relativeKeyboardHeightValue}
                waitFor={[this.scrollRef, ...this._blockInputRefs.values()]}
                focusType={this.state.focusType}
                minX={bounds.x}
                minY={bounds.y}
                maxX={sizeStyle.width}
                onFocus={this.handleFocusBlock}
                maxY={sizeStyle.height}
                onTapNode={this.handleTapNode}
                onlyShow={this.state.focusedBlockId}
                onBlur={this.handleBlurNode}
                onChangeNode={this.handleInlineNodeChange}
                onPan={this.handlePan}
              />
            </Layer>
          </PostPreview>

          {/* <Layer
            zIndex={LayerZIndex.sheet}
            width={sizeStyle.width}
            isFrozen
            opacity={this.props.controlsOpacityValue}
            pointerEvents="none"
            height={sizeStyle.height}
          >
            <MiddleSheet width={sizeStyle.width} height={sizeStyle.height} />
          </Layer> */}

          <Layer
            isShown
            width={sizeStyle.width}
            height={sizeStyle.height}
            zIndex={LayerZIndex.icons}
            pointerEvents="box-none"
          >
            <ActiveLayer
              onBack={this.handleBack}
              onSend={this.handleSend}
              onPressDownload={this.handleDownload}
              panX={this.panX}
              panY={this.panY}
              isPageModal={this.props.isReply}
              waitFor={[this.scrollRef, ...this._blockInputRefs.values()]}
              width={sizeStyle.width}
              height={sizeStyle.height}
              isTappingEnabled={
                this.state.activeButton === ToolbarButtonType.text
              }
              onPressToolbarButton={this.handlePressToolbarButton}
              isFocused={!!this.state.focusedBlockId}
              insertTextNode={this.handleInsertText}
              controlsOpacity={this.props.controlsOpacityValue}
              blur={this.handleBlur}
              focusType={this.state.focusType}
              onChangeFooterHeight={this.handleChangeBottomInset}
              toolbarType={this.toolbarType}
              isNodeFocused={this.state.focusType === FocusType.absolute}
              activeButton={this.state.activeButton}
              keyboardVisibleValue={this.keyboardVisibleValue}
              focusTypeValue={this.focusTypeValue}
              nodeListRef={this.nodeListRef}
            ></ActiveLayer>
          </Layer>
        </Animated.View>

        <InputAccessoryView nativeID="new-post-input">
          <TextInputToolbar block={this.focusedBlock} />
        </InputAccessoryView>
      </Animated.View>
    );
  }
}

export const PostEditor = connectActionSheet(RawwPostEditor);
export default PostEditor;
