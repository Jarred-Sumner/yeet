import * as React from "react";
import {
  Dimensions,
  StyleSheet,
  View,
  InteractionManager,
  PixelRatio,
  Image,
  Keyboard
} from "react-native";
import { getInset } from "react-native-safe-area-view";
import Animated from "react-native-reanimated";
import { SafeAreaView, withNavigationFocus } from "react-navigation";
import { SPACING, COLORS } from "../../lib/styles";
import { IconText, IconUploadPhoto, IconSend, IconDownload } from "../Icon";
import {
  PostBlockType,
  buildTextBlock,
  CAROUSEL_HEIGHT,
  PostFormat,
  FocusBlockType,
  presetsByFormat,
  POST_WIDTH,
  isPlaceholderImageBlock,
  MAX_POST_HEIGHT
} from "./NewPostFormat";
import { TextPostBlock } from "./TextPostBlock";
import { ImagePostBlock } from "./ImagePostBlock";
import { AnimatedKeyboardTracker } from "../AnimatedKeyboardTracker";
import tinycolor from "tinycolor2";
import {
  BaseButton,
  ScrollView,
  TextInput,
  LongPressGestureHandler,
  GestureHandlerGestureEvent,
  State as GestureState,
  GestureHandlerStateChangeEvent,
  LongPressGestureHandlerEventExtra,
  FlingGestureHandler,
  LongPressGestureHandlerGestureEvent,
  Directions,
  FlingGestureHandlerGestureEvent,
  FlingGestureHandlerStateChangeEvent,
  TapGestureHandler
} from "react-native-gesture-handler";
import { IconButton } from "../Button";
import LinearGradient from "react-native-linear-gradient";
import {
  Toolbar,
  ToolbarButtonType,
  DEFAULT_TOOLBAR_BUTTON_TYPE
} from "./Toolbar";
import { TextLayer } from "./layers/TextLayer";
import { EditorFooter } from "./EditorFooter";
import { Block } from "./Node/Block";
import { HorizontalScrollView } from "../HorizontalScrollView";
import {
  BaseNode,
  EditableNode,
  EditableNodeMap,
  buildEditableNode
} from "./Node/BaseNode";
import { captureRef } from "react-native-view-shot";
import CameraRoll from "@react-native-community/cameraroll";
import { PostPreview, EditableNodeList } from "./PostPreview";
import PhotoEditor, { MimeType } from "react-native-photo-manipulator";
import DeviceInfo from "react-native-device-info";
import { Redactor } from "./Redactor";
import memoizee from "memoizee";
import { BoldText } from "../Text";
import FormatPicker from "./FormatPicker";
import { NavigationEvents } from "react-navigation";

const { block, cond, set, eq, sub } = Animated;

const IS_SIMULATOR = DeviceInfo.isEmulator();
const TOP_Y = getInset("top");
const BOTTOM_Y = getInset("bottom");

const SCREEN_DIMENSIONS = Dimensions.get("window");

export const HEADER_HEIGHT = 30 + TOP_Y + SPACING.normal;

const styles = StyleSheet.create({
  safeWrapper: {
    borderRadius: 12,
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
    marginTop: TOP_Y,
    borderRadius: 12,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
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
  icons = 2,
  footer = 2,
  inlineNodes = 3
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
      locations={[
        0.0,
        (60 + SPACING.half) / MAX_POST_HEIGHT,
        1.0 - 60 / MAX_POST_HEIGHT,
        1.0
      ]}
      colors={[
        "rgba(0,0,0,0.1)",
        "rgba(100,100,100,0.0)",
        "rgba(100,100,100,0.0)",
        "rgba(0,0,0,0.1)"
      ]}
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

type State = {
  activeButton: ToolbarButtonType;
  inlineNodes: EditableNodeMap;
  focusedBlockId: string | null;
  focusType: FocusBlockType | null;
  isSaving: boolean;
};

const TEXT_NODE_FIXTURE: EditableNode = {
  block: {
    id: "123foo",
    type: "text",
    format: "screenshot",
    value: "hiii",
    config: { variant: "standard", overrides: {} }
  },
  position: {
    x: 20,
    y: 40,
    animatedX: new Animated.Value(20),
    animatedY: new Animated.Value(40),
    scale: 1.0,
    animatedScale: new Animated.Value(1.0),
    rotate: 0,
    animatedRotate: new Animated.Value(0)
  }
};

export class PostEditor extends React.Component<{}, State> {
  constructor(props) {
    super(props);
    this.state = {
      activeButton: DEFAULT_TOOLBAR_BUTTON_TYPE,
      inlineNodes: new Map(),
      focusedBlockId: null,
      focusType: null,
      isSaving: false
    };

    this._blockInputRefs = new Map([
      ...props.post.blocks.map(({ id }) => [id, React.createRef()])
    ]);

    if (IS_SIMULATOR) {
      // this.state.inlineNodes.set(TEXT_NODE_FIXTURE.block.id, TEXT_NODE_FIXTURE);
    }
  }
  controlsVisibilityValue = new Animated.Value(1);

  handleWillFocus = () => {
    this.scrollRef.current &&
      this.scrollRef.current.scrollTo({
        x: 0,
        y: (presetsByFormat[this.props.post.format].paddingTop || 0) * -1,
        animated: false
      });
  };

  deleteNode = (id: string) => {
    if (this.state.inlineNodes.has(id)) {
      this.state.inlineNodes.delete(id);
    }

    if (this._inlineNodeRefs.has(id)) {
      this._inlineNodeRefs.delete(id);
    }

    if (this.state.focusedBlockId === id) {
      this.setState({ focusedBlockId: null, focusType: null });
      this.focusedBlockValue.setValue("");
      this.focusTypeValue.setValue(-1);
    }
  };

  handlePressToolbarButton = activeButton => this.setState({ activeButton });
  handleInlineNodeChange = (editableNode: EditableNode) => {
    if (
      editableNode.block.type === "text" &&
      editableNode.block.value.trim().length === 0 &&
      this.state.inlineNodes.has(editableNode.block.id)
    ) {
      this.deleteNode(editableNode.block.id);
    } else {
      this.state.inlineNodes.set(editableNode.block.id, editableNode);
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
      format: PostFormat.screenshot,
      placeholder: " ",
      autoInserted: false
    });
    const editableNode = buildEditableNode({
      block,
      x,
      y
    });

    this.state.inlineNodes.set(block.id, editableNode);

    this.setState({
      focusedBlockId: block.id,
      focusType: FocusBlockType.absolute
    });
    this.focusedBlockValue.setValue(block.id);
    this.focusTypeValue.setValue(FocusBlockType.absolute);
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
      this.focusedBlockValue.setValue("");
      this.focusTypeValue.setValue(-1);
    } else {
      this.setState({
        focusedBlockId: node.block.id,
        focusType: FocusBlockType.absolute
      });
      this.focusedBlockValue.setValue(node.block.id);
      this.focusTypeValue.setValue(FocusBlockType.absolute);
    }
  };

  handleBlur = () => {
    const node = this.state.inlineNodes.get(this.state.focusedBlockId);

    this.handleBlurNode(node);
  };

  handleBlurNode = (node: EditableNode) => {
    if (node) {
      if (node.block.type === "text" && node.block.value.trim().length === 0) {
        this.deleteNode(node.block.id);
      } else {
        this.state.inlineNodes.set(node.block.id, node);
        this.setState({ focusedBlockId: null, focusType: null });
        this.focusedBlockValue.setValue("");
        this.focusTypeValue.setValue(-1);
      }
    }
  };

  handleBlurBlock = (block: PostBlockType) => {
    const index = this.props.post.blocks.findIndex(({ id }) => id === block.id);

    this.handleChangeBlock(block, index);
    this.setState({ focusType: null, focusedBlockId: null });
    this.focusedBlockValue.setValue("");
    this.focusTypeValue.setValue(-1);
  };

  handleFocusBlock = block => {
    const focusType = this.state.inlineNodes.has(block.id)
      ? FocusBlockType.absolute
      : FocusBlockType.static;
    this.setState({
      focusedBlockId: block.id,
      focusType
    });

    this.focusedBlockValue.setValue(block.id);
    this.focusTypeValue.setValue(focusType);
  };

  handleDownload = () => {
    this.createSnapshot();
  };
  handleSend = () => {};

  createSnapshot = async () => {
    this._inlineNodeRefs.entries().map([]);
    const overlayURI = await captureRef(this.nodeListRef.current, {
      format: "png",
      quality: 1.0
    });

    const overlayDimensions = await new Promise((resolve, reject) => {
      Image.getSize(
        overlayURI,
        (width, height) => resolve({ width, height }),
        reject
      );
    });

    const blockURI = await captureRef(this.scrollRef.current, {
      format: "png",
      quality: 1.0,

      snapshotContentContainer: true
    }).then(
      uri => {
        console.log("Image saved to", uri);
        return uri;
      },
      error => {
        console.error("Oops, snapshot failed", error);
        return error;
      }
    );

    const blockDimensions = await new Promise((resolve, reject) => {
      Image.getSize(
        blockURI,
        (width, height) => resolve({ width, height }),
        reject
      );
    });

    const rect = {
      x: 0,
      y: 0,
      width: blockDimensions.width,
      height: blockDimensions.height
    };

    const size = {
      width: Math.max(blockDimensions.width, overlayDimensions.width),
      height: Math.max(blockDimensions.height, overlayDimensions.height)
    };

    let backgroundURI = blockURI;
    if (
      size.width > blockDimensions.width ||
      size.height > blockDimensions.height
    ) {
      backgroundURI = await new Promise((resolve, reject) => {
        this.setState(
          {
            blankResize: {
              width: PixelRatio.roundToNearestPixel(
                size.width / PixelRatio.get()
              ),
              height: PixelRatio.roundToNearestPixel(
                size.height / PixelRatio.get()
              )
            }
          },
          () => {
            window.requestAnimationFrame(async () => {
              const uri = await captureRef(this.blankResizeRef.current, {
                format: "png",
                quality: 1.0
              }).then(
                uri => {
                  this.setState({ blankResize: null });
                  return PhotoEditor.overlayImage(
                    uri,
                    blockURI,
                    { x: 0, y: 0 },
                    "image/png"
                  );
                },
                error => {
                  console.error("Oops, snapshot failed", error);
                  return reject(error);
                }
              );

              resolve(uri);
            });
          }
        );
      });
    }

    const combined = await PhotoEditor.overlayImage(
      backgroundURI,
      overlayURI,
      { x: 0, y: 0 },
      "image/png"
    );

    const result = await CameraRoll.saveToCameraRoll(combined, "photo");
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
  keyboardVisibleValue = new Animated.Value(0);
  focusedBlockValue = new Animated.Value("");
  focusTypeValue = new Animated.Value(-1);
  controlsOpacityValue = new Animated.Value(1);

  handleTapBackground = event => {
    const {
      nativeEvent: { state: gestureState, ...data }
    } = event;
    if (gestureState === GestureState.END) {
      this.handlePressBackground(data);
    }
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
    }
  };

  updateBounds = ({
    nativeEvent: {
      layout: { x, y, width, height }
    }
  }) => {
    this.setState({ bounds: { x, y: y, width, height } });
  };

  handleOpenImagePicker = block => {
    this.props.navigation.navigate("EditBlockPhoto", {
      blockId: block.id,
      post: this.props.post,
      onChange: this.handleChangeImageBlockPhoto
    });
  };

  handleChangeImageBlockPhoto = (
    blockId: string,
    photo: CameraRoll.PhotoIdentifier
  ) => {
    const blockIndex = this.props.post.blocks.findIndex(
      block => block.id === blockId
    );

    const block = { ...this.props.post.blocks[blockIndex] };

    const {
      width: intrinsicWidth,
      height: intrinsicHeight,
      uri
    } = photo.node.image;

    const displaySize = {
      width: POST_WIDTH,
      height: intrinsicHeight * (POST_WIDTH / intrinsicWidth)
    };

    const source = Image.resolveAssetSource({
      uri,
      width: displaySize.width,
      height: displaySize.height
    });

    block.value.intrinsicWidth = intrinsicWidth;
    block.value.intrinsicHeight = intrinsicHeight;
    block.value.src = source;
    block.value.originalSrc = uri;
    block.value.uri = source.uri;
    block.value.width = displaySize.width;
    block.value.height = displaySize.height;

    const blocks = [...this.props.post.blocks];
    blocks.splice(blockIndex, 1, block);

    this.props.onChange({
      ...this.props.post,
      blocks
    });

    return {
      width: block.value.width,
      height: block.value.height,
      source: source
    };
  };

  formatScrollViewRef = React.createRef();

  buttonRef = React.createRef();
  lastTappedBlockId = null;
  handleScrollBeginDrag = (
    {
      // nativeEvent: {
      //   contentOffset: { y }
      // }
    }
  ) => {
    if (!this.lastTappedBlockId) {
      return;
    }

    const block = this.props.post.blocks.find(
      block => block.id === this.lastTappedBlockId
    );

    if (!block) {
      return;
    }

    if (isPlaceholderImageBlock(block)) {
      this.handleOpenImagePicker(block);
    }
  };

  handleTapBlock = (blockId: string) => (this.lastTappedBlockId = blockId);
  hasPlaceholderImageBlocks = () =>
    !!this.props.post.blocks.find(isPlaceholderImageBlock);

  render() {
    const { post } = this.props;
    const presets = presetsByFormat[post.format];

    const {
      bounds = { width: POST_WIDTH, height: MAX_POST_HEIGHT, x: 0, y: 0 }
    } = this.state;
    const sizeStyle = {
      width: bounds.width || POST_WIDTH,
      height: bounds.height || MAX_POST_HEIGHT
    };

    return (
      <Animated.View
        style={[
          styles.wrapper,
          {
            backgroundColor: post.backgroundColor,
            shadowColor: tinycolor(post.backgroundColor)
              .lighten(10)
              .toString(),
            borderWidth: 0,
            borderColor: tinycolor(post.backgroundColor)
              .lighten(5)
              .toString(),
            shadowOpacity: 0.25,
            height: MAX_POST_HEIGHT,
            width: POST_WIDTH,
            shadowOffset: {
              width: 0,
              height: 0
            },
            shadowRadius: 2
          }
        ]}
      >
        <NavigationEvents onWillFocus={this.handleWillFocus} />
        <AnimatedKeyboardTracker
          keyboardVisibleValue={this.keyboardVisibleValue}
        />
        <Animated.Code
          exec={block([
            cond(
              eq(this.focusTypeValue, FocusBlockType.absolute),
              set(this.controlsOpacityValue, 1.0),
              cond(
                eq(this.focusTypeValue, FocusBlockType.static),
                [
                  set(
                    this.controlsOpacityValue,
                    sub(1.0, this.keyboardVisibleValue)
                  )
                ],
                [set(this.controlsOpacityValue, 1.0)]
              )
            )
          ])}
        />

        <TapGestureHandler
          waitFor={this.buttonRef}
          onHandlerStateChange={this.handleTapBackground}
        >
          <Animated.View>
            <BaseButton
              ref={this.buttonRef}
              waitFor={[this.scrollRef, ...this._blockInputRefs.values()]}
            >
              <Animated.View
                onLayout={this.updateBounds}
                style={[
                  styles.safeWrapper,
                  styles.scrollContainer,
                  {
                    maxHeight: MAX_POST_HEIGHT,
                    width: bounds.width
                  }
                ]}
              >
                <PostPreview
                  bounds={bounds}
                  blocks={post.blocks}
                  paddingTop={presets.paddingTop || 0}
                  inlineNodes={this.state.inlineNodes}
                  focusedBlockId={this.state.focusedBlockId}
                  focusTypeValue={this.focusTypeValue}
                  minX={bounds.x}
                  onTapBlock={this.handleTapBlock}
                  minY={bounds.y}
                  backgroundColor={post.backgroundColor}
                  focusedBlockValue={this.focusedBlockValue}
                  ref={this.scrollRef}
                  maxX={bounds.width}
                  bounces={!this.hasPlaceholderImageBlocks()}
                  onFocus={this.handleFocusBlock}
                  onScrollBeginDrag={this.handleScrollBeginDrag}
                  onOpenImagePicker={this.handleOpenImagePicker}
                  maxY={bounds.height}
                  onlyShow={this.state.focusedBlockId}
                  onBlur={this.handleBlurBlock}
                  focusType={FocusBlockType.static}
                  setBlockInputRef={this.setBlockInputRef}
                  onChangeNode={this.handleInlineNodeChange}
                  setBlockAtIndex={this.handleChangeBlock}
                  showEditableNodes={this.state.isSaving}
                />

                <Layer
                  zIndex={LayerZIndex.sheet}
                  width={sizeStyle.width}
                  isFrozen
                  opacity={this.controlsOpacityValue}
                  pointerEvents="none"
                  height={sizeStyle.height}
                >
                  <MiddleSheet
                    width={sizeStyle.width}
                    height={sizeStyle.height}
                  />
                </Layer>

                <TextLayer
                  onBack={this.props.onBack}
                  footer={
                    <EditorFooter
                      onPressDownload={this.handleDownload}
                      onPressSend={this.handleSend}
                      waitFor={[
                        this.scrollRef,
                        this.formatScrollViewRef,
                        ...this._blockInputRefs.values()
                      ]}
                    />
                  }
                  waitFor={[
                    this.scrollRef,
                    this.formatScrollViewRef,
                    ...this._blockInputRefs.values()
                  ]}
                  width={sizeStyle.width}
                  isTappingEnabled={
                    this.state.activeButton === ToolbarButtonType.text
                  }
                  height={sizeStyle.height}
                  onPressToolbarButton={this.handlePressToolbarButton}
                  isFocused={!!this.state.focusedBlockId}
                  insertTextNode={this.handleInsertText}
                  controlsOpacity={this.controlsOpacityValue}
                  blur={this.handleBlur}
                  focusType={this.state.focusType}
                  isNodeFocused={
                    this.state.focusType === FocusBlockType.absolute
                  }
                  activeButton={this.state.activeButton}
                  keyboardVisibleValue={this.keyboardVisibleValue}
                  focusTypeValue={this.focusTypeValue}
                  nodeListRef={this.nodeListRef}
                >
                  <EditableNodeList
                    inlineNodes={this.state.inlineNodes}
                    setNodeRef={this.setNodeRef}
                    focusedBlockId={this.state.focusedBlockId}
                    focusedBlockValue={this.focusedBlockValue}
                    focusTypeValue={this.focusTypeValue}
                    waitFor={[
                      this.scrollRef,
                      this.formatScrollViewRef,
                      ...this._blockInputRefs.values()
                    ]}
                    focusType={FocusBlockType.absolute}
                    minX={bounds.x}
                    minY={bounds.y}
                    maxX={sizeStyle.width}
                    onFocus={this.handleFocusBlock}
                    maxY={sizeStyle.height}
                    onTapNode={this.handleTapNode}
                    onlyShow={this.state.focusedBlockId}
                    onBlur={this.handleBlurNode}
                    onChangeNode={this.handleInlineNodeChange}
                  />
                </TextLayer>
              </Animated.View>
            </BaseButton>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    );
  }
}
