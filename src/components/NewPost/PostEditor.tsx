import * as React from "react";
import {
  Dimensions,
  StyleSheet,
  View,
  InteractionManager,
  PixelRatio,
  Image
} from "react-native";
import { getInset } from "react-native-safe-area-view";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-navigation";
import { SPACING, COLORS } from "../../lib/styles";
import { IconText, IconUploadPhoto, IconSend, IconDownload } from "../Icon";
import { PostBlockType, buildTextBlock } from "./NewPostFormat";
import { TextPostBlock } from "./TextPostBlock";
import { ImagePostBlock } from "./ImagePostBlock";
import { BorderlessButton, ScrollView } from "react-native-gesture-handler";
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

const IS_SIMULATOR = DeviceInfo.isEmulator();
const TOP_Y = getInset("top");
const BOTTOM_Y = getInset("bottom");

const SCREEN_DIMENSIONS = Dimensions.get("window");

export const POST_WIDTH = SCREEN_DIMENSIONS.width;
export const MAX_POST_HEIGHT =
  SCREEN_DIMENSIONS.height - TOP_Y - SPACING.double;

const styles = StyleSheet.create({
  safeWrapper: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  container: {
    backgroundColor: "#fff"
  },
  wrapper: {
    position: "relative",
    justifyContent: "center",
    backgroundColor: "#fff",
    alignItems: "center",
    width: "100%",
    height: "100%"
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
      useAngle
      width={width}
      height={height}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      angle={270.32}
      angleCenter={{ x: 0.5, y: 0.5 }}
      locations={[0.2742, 0.75]}
      colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0)"]}
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
};

const TEXT_NODE_FIXTURE: EditableNode = {
  block: {
    id: "123foo",
    type: "text",
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
      focusedNodeId: null,
      isSaving: false
    };

    if (IS_SIMULATOR) {
      this.state.inlineNodes.set(TEXT_NODE_FIXTURE.block.id, TEXT_NODE_FIXTURE);
    }
  }
  controlsVisibilityValue = new Animated.Value(1);

  deleteNode = (id: string) => {
    if (this.state.inlineNodes.has(id)) {
      this.state.inlineNodes.delete(id);
    }

    if (this._inlineNodeRefs.has(id)) {
      this._inlineNodeRefs.delete(id);
    }

    if (this.state.focusedNodeId === id) {
      this.setState({ focusedNodeId: null });
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
    const block = buildTextBlock({ value: "" });
    const editableNode = buildEditableNode({
      block,
      x,
      y
    });

    this.state.inlineNodes.set(block.id, editableNode);

    this.setState({ focusedNodeId: block.id });
  };

  scrollRef = React.createRef();
  nodeListRef = React.createRef();

  handleTapNode = (node: EditableNode) => {
    if (this.state.activeButton !== ToolbarButtonType.text) {
      return;
    }
    const { focusedNodeId } = this.state;

    if (focusedNodeId === node.block.id) {
      if (node.block.type === "text" && node.block.value.trim().length === 0) {
        this.deleteNode(node.block.id);
        return;
      }

      this.setState({ focusedNodeId: null });
    } else {
      this.setState({ focusedNodeId: node.block.id });
    }
  };

  handleBlur = () => {
    const node = this.state.inlineNodes.get(this.state.focusedNodeId);

    this.handleBlurNode(node);
  };

  handleBlurNode = (node: EditableNode) => {
    if (node) {
      if (node.block.type === "text" && node.block.value.trim().length === 0) {
        this.deleteNode(node.block.id);
      } else {
        this.state.inlineNodes.set(node.block.id, node);
        this.setState({ focusedNodeId: null });
      }
    }
  };

  handleFocusNode = block => {
    this.setState({ focusedNodeId: block.id });
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

  setNodeRef = (id: string, node: View) => {
    this._inlineNodeRefs.set(id, node);
  };

  render() {
    const { post, bounds } = this.props;
    const sizeStyle = { width: bounds.width, height: bounds.height };
    return (
      <View style={[styles.wrapper]}>
        <View
          style={[
            styles.safeWrapper,
            styles.scrollContainer,
            {
              maxHeight: MAX_POST_HEIGHT,
              height: bounds.height,
              width: bounds.width
            }
          ]}
        >
          <PostPreview
            bounds={bounds}
            blocks={post.blocks}
            inlineNodes={this.state.inlineNodes}
            focusedNodeId={this.state.focusedNodeId}
            minX={bounds.x}
            minY={bounds.y}
            ref={this.postPreviewRef}
            scrollRef={this.scrollRef}
            maxX={bounds.width}
            onFocus={this.handleFocusNode}
            maxY={bounds.height}
            onTapNode={this.handleTapNode}
            onlyShow={this.state.focusedNodeId}
            onBlurNode={this.handleBlurNode}
            onChangeNode={this.handleInlineNodeChange}
            setBlockAtIndex={this.handleChangeBlock}
            showEditableNodes={this.state.isSaving}
          />

          <Layer
            zIndex={LayerZIndex.sheet}
            width={sizeStyle.width}
            isFrozen
            pointerEvents="none"
            opacity={this.controlsVisibilityValue}
            height={sizeStyle.height}
          >
            <MiddleSheet width={sizeStyle.width} height={sizeStyle.height} />
          </Layer>

          <Layer
            width={sizeStyle.width}
            height={sizeStyle.height}
            zIndex={LayerZIndex.icons}
          >
            <TextLayer
              // footer={
              //   <EditorFooter
              //     onPressDownload={this.handleDownload}
              //     onPressSend={this.handleSend}
              //   />
              // }
              waitFor={[this.scrollRef]}
              width={sizeStyle.width}
              isTappingEnabled={
                this.state.activeButton === ToolbarButtonType.text
              }
              height={sizeStyle.height}
              onPressToolbarButton={this.handlePressToolbarButton}
              isFocused={!!this.state.focusedNodeId}
              insertTextNode={this.handleInsertText}
              blur={this.handleBlur}
              activeButton={this.state.activeButton}
              nodeListRef={this.nodeListRef}
            >
              {this.state.activeButton === "text" ? (
                <EditableNodeList
                  inlineNodes={this.state.inlineNodes}
                  setNodeRef={this.setNodeRef}
                  focusedNodeId={this.state.focusedNodeId}
                  waitFor={[this.scrollRef]}
                  minX={bounds.x}
                  minY={bounds.y}
                  maxX={sizeStyle.width}
                  onFocus={this.handleFocusNode}
                  maxY={sizeStyle.height}
                  onTapNode={this.handleTapNode}
                  onlyShow={this.state.focusedNodeId}
                  onBlur={this.handleBlurNode}
                  onChangeNode={this.handleInlineNodeChange}
                />
              ) : (
                <Redactor blocks={this.props.post.blocks} />
              )}
            </TextLayer>
          </Layer>
        </View>
      </View>
    );
  }
}
