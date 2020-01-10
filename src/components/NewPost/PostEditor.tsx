import {
  connectActionSheet,
  useActionSheet
} from "@expo/react-native-action-sheet";
import { flatten } from "lodash";
import * as React from "react";
import { StyleSheet, View, findNodeHandle } from "react-native";
import {
  ScrollView,
  State as GestureState
} from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated from "react-native-reanimated";
import { NavigationEvents } from "react-navigation";
import { IS_SIMULATOR, SCREEN_DIMENSIONS } from "../../../config";
import { getEstimatedBounds, startExport } from "../../lib/Exporter";
import {
  ImageSourceType,
  isVideo,
  YeetImageContainer,
  YeetImageRect
} from "../../lib/imageSearch";
import { Rectangle } from "../../lib/Rectangle";
import { SPACING } from "../../lib/styles";
import { sendLightFeedback } from "../../lib/Vibration";
import { InputAccessoryView } from "../InputAccessoryView";
import { FOOTER_HEIGHT, isDeletePressed } from "./EditorFooter";
import { isArray, memoize } from "lodash";
import { GallerySectionItem } from "./ImagePicker/FilterBar";
import { ActiveLayer } from "./layers/ActiveLayer";
import {
  buildImageBlock,
  buildTextBlock,
  FocusType,
  ImagePostBlock,
  isPlaceholderImageBlock,
  MAX_POST_HEIGHT,
  minImageWidthByFormat,
  PostBlockType,
  PostFormat,
  PostLayout,
  POST_WIDTH,
  presetsByFormat,
  TextBorderType,
  TextPostBlock,
  TextTemplate
} from "./NewPostFormat";
import {
  buildEditableNode,
  EditableNode,
  EditableNodeMap
} from "./Node/BaseNode";
import { EditableNodeList, PostPreview } from "./PostPreview";
import TextInput from "./Text/CustomTextInputComponent";
import { TextInputToolbar } from "./TextInputToolbar";
import {
  DEFAULT_TOOLBAR_BUTTON_TYPE,
  ToolbarButtonType,
  ToolbarType
} from "./Toolbar";
import { NewPostType, isFixedSizeBlock } from "../../lib/buildPost";
import { MediaPlayerContext } from "../MediaPlayer/MediaPlayerContext";
import { MarginView } from "./Node/MarginView";
import { AnimatedEvent } from "./Node/createAnimatedTransformableViewComponent";
import { createAnimatedEvent } from "./Node/createAnimatedEvent";
import { BlurView } from "@react-native-community/blur";

const { block, cond, set, eq, sub } = Animated;

export const HEADER_HEIGHT = 30 + SPACING.normal;

const styles = StyleSheet.create({
  safeWrapper: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    width: POST_WIDTH,
    flex: 1,
    position: "relative"
  },
  darkSheetStyle: {
    position: "absolute",
    left: 0,
    right: 0
  },
  darkSheetContent: {
    opacity: 0.75,
    flex: 1
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
  post: NewPostType;
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

const DarkSheet = ({
  opacity,
  keyboardHeight,
  width = SCREEN_DIMENSIONS.width,
  height = SCREEN_DIMENSIONS.height
}) => {
  const containerStyle = React.useMemo(
    () => [
      styles.darkSheetStyle,
      {
        width,
        height,
        opacity
      }
    ],
    [styles.darkSheetStyle, opacity, height, keyboardHeight]
  );

  return (
    <Animated.View
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      pointerEvents="none"
      style={containerStyle}
    >
      <View style={styles.darkSheetContent} />
    </Animated.View>
  );
};

class RawwPostEditor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeButton: DEFAULT_TOOLBAR_BUTTON_TYPE,
      focusedBlockId: null,
      focusType: null,
      isSaving: false,
      bottomInset: 0
    };

    this._blockInputRefs = new Map([
      ...Object.values(props.post.blocks).map(({ id }) => [
        id,
        React.createRef<View>()
      ])
    ]);

    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

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

  handleWillFocus = () => {};

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

    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

    this.clearFocus();
  };

  componentWillUnmount() {}

  handlePressToolbarButton = activeButton => {
    if (activeButton === ToolbarButtonType.photo) {
      this.handleInsertPhoto(undefined, GallerySectionItem.photos);
    } else if (activeButton === ToolbarButtonType.gif) {
      this.handleInsertPhoto(undefined, GallerySectionItem.gifs);
    } else if (activeButton === ToolbarButtonType.sticker) {
      this.handleInsertPhoto(undefined, "all", true, true, true);
    } else if (activeButton === ToolbarButtonType.text) {
      this.handleInsertText({
        x: 0,
        y: 150
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
            this.postPreviewHandlers = [
              this.scrollRef,
              ...this._blockInputRefs.values()
            ];

            this.focusTypeValue.setValue(FocusType.static);
            this.focusedBlockValue.setValue(block.id.hashCode());
            this.setState(
              {
                focusedBlockId: block.id,
                focusType: FocusType.static
              },
              () => {
                this._blockInputRefs.get(block.id).current.focus();
                this.postPreviewHandlers = [
                  this.scrollRef,
                  ...this._blockInputRefs.values()
                ];
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
            this.postPreviewHandlers = [
              this.scrollRef,
              ...this._blockInputRefs.values()
            ];
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
    this.props.onChange({
      ...this.props.post,
      blocks: {
        ...this.props.post.blocks,
        [block.id]: block
      }
    });
  };

  handleChangeTemplate = (template: TextTemplate, _block?: TextPostBlock) => {
    const __block: TextPostBlock = _block || this.focusedBlock;

    if (!__block) {
      return;
    }

    this.handleChangeFocusedBlock(
      buildTextBlock({
        value: __block.value,
        autoInserted: __block.autoInserted,
        template,
        layout: __block.layout,
        format: __block.format,
        minHeight: __block.config?.minHeight,
        overrides: __block.config?.overrides,
        placeholder: __block.config?.placeholder,
        id: __block.id,
        required: __block.required
      })
    );
  };

  handleChangeFocusedBlock = (block: PostBlockType) => {
    if (this.state.focusType === FocusType.absolute) {
      const node = { ...this.props.inlineNodes[block.id], block };
      this.props.onChangeNodes({
        ...this.props.inlineNodes,
        [node.block.id]: node
      });
    } else if (this.state.focusType === FocusType.static) {
      this.handleChangeBlock(block);
    }
  };

  handleInsertText = ({ x, y }) => {
    const block = buildTextBlock({
      value: "",
      format: PostFormat.sticker,
      template: TextTemplate.basic,
      layout: PostLayout.text,
      placeholder: " ",
      autoInserted: false
    });
    const editableNode = buildEditableNode({
      block,
      x: x - SPACING.normal,
      y: y + SPACING.normal
    });

    this.props.onChangeNodes({
      ...this.props.inlineNodes,
      [block.id]: editableNode
    });
    this._blockInputRefs.set(block.id, React.createRef());
    this.focusTypeValue.setValue(FocusType.absolute);
    this.focusedBlockValue.setValue(block.id.hashCode());

    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

    this.setState(
      {
        focusedBlockId: block.id,
        focusType: FocusType.absolute
      },
      () => {
        this._blockInputRefs.get(block.id)?.current?.focus();
      }
    );
  };

  nodeListRef = React.createRef();

  handleTapNode = (node: EditableNode) => {
    if (this.state.activeButton !== ToolbarButtonType.text) {
      return;
    }

    const { focusedBlockId, focusType } = this.state;

    if (focusedBlockId === node.block.id) {
      if (node.block.type === "text" && node.block.value.trim().length === 0) {
        this.deleteNode(node.block.id);
        return;
      }

      this.clearFocus();
    } else if (
      (focusType === -1 ||
        focusType === FocusType.panning ||
        !focusedBlockId) &&
      node.block.type === "text"
    ) {
      const blockId = node.block.id;
      this._blockInputRefs.get(blockId).current?.focus();

      this.handleFocusBlock(node.block);

      return false;
    }
  };

  handleBlur = () => {
    if (
      this.state.focusType === FocusType.absolute ||
      this.state.focusType === FocusType.panning
    ) {
      this.handleBlurNode(this.focusedNode);
    } else if (this.focusedBlock) {
      this.handleBlurBlock(this.focusedBlock);
    }
  };

  handleBlurNode = (node: EditableNode) => {
    this.handleInlineNodeChange(node);
  };

  handleBlurBlock = (block: PostBlockType) => {
    if (block) {
      this.handleChangeBlock(block);
    }

    this.clearFocus();
  };

  handleFocusBlock = (block: PostBlockType) => {
    if (this.focusedBlock?.id === block.id) {
      return;
    }

    const focusType = this.props.inlineNodes[block.id]
      ? FocusType.absolute
      : FocusType.static;

    this.focusedBlockValue.setValue(block.id.hashCode());
    this.focusTypeValue.setValue(focusType);

    if (block.type === "text") {
      this._blockInputRefs.get(block.id).current?.focus();
    }

    this.setState({
      focusedBlockId: block.id,
      focusType
    });
  };

  clearFocus = () => {
    this.dismissKeyboard();

    this.setState({ focusedBlockId: null, focusType: null }, () => {
      this.focusedBlockValue.setValue(-1);
      this.focusTypeValue.setValue(-1);
    });
  };

  get currentTextInput() {
    return this._blockInputRefs.get(this.state.focusedBlockId)?.current;
  }

  dismissKeyboard = () => {
    this.currentTextInput?.blur();
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
    if (this.props.onBeforeExport) {
      await this.props.onBeforeExport();
    }

    return startExport(
      this.props.post.positions.map(rows => {
        if (isArray(rows)) {
          return rows.map(id => this.props.post.blocks[id]);
        } else {
          return this.props.post.blocks[rows];
        }
      }),
      this.props.inlineNodes,
      this._blockInputRefs,
      this.contentViewRef,
      this._inlineNodeRefs,
      isServerOnly
    );
  };

  blankResizeRef = React.createRef();
  _inlineNodeRefs = new Map();
  _blockInputRefs: Map<string, React.MutableRefObject<TextInput>>;

  setBlockInputRef = (id: string): React.MutableRefObject<TextInput> => {
    let ref;
    if (this._blockInputRefs.has(id)) {
      ref = this._blockInputRefs.get(id);
    } else {
      ref = React.createRef<TextInput>();
      this._blockInputRefs.set(id, ref);
    }

    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

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
  tapYAbsolute = new Animated.Value(-1);

  tapGestureState = new Animated.Value(GestureState.UNDETERMINED);
  onTapBackground = Animated.event(
    [
      {
        nativeEvent: {
          state: this.tapGestureState,
          x: this.tapX,
          y: this.tapY,
          absoluteY: this.tapYAbsolute
        }
      }
    ],
    { useNativeDriver: true }
  );

  // findNode = (x: number, y: number) => {
  //   Object.values(this.props.inlineNodes).find(node => {
  //     node.position.x
  //   })
  // };

  handleTapBackground = async ([
    tapGestureState,
    x,
    y,
    focusTypeValue,
    focusBlockValue,
    keyboardHeightValue,
    tapYAbsolute
  ]) => {
    const { focusedBlockId, focusType } = this.state;

    if (focusedBlockId && focusType === FocusType.absolute) {
      const _bounds = await getEstimatedBounds(
        this._inlineNodeRefs.get(focusedBlockId)
      );
      const bounds = new Rectangle(
        _bounds.x - SPACING.normal * 2,
        _bounds.y - SPACING.normal,
        _bounds.width + SPACING.normal * 3,
        _bounds.height + SPACING.normal * 2
      );

      if (bounds.contains(new Rectangle(x, y, 1, 1))) {
        return;
      }
    }

    console.log("TAP BACKGROUND", x, y);

    this.handlePressBackground({ x, y, focusTypeValue, focusBlockValue });
  };

  handlePressBackground = ({ x, y, focusTypeValue, focusBlockValue }) => {
    if (this.state.focusType === null && focusTypeValue === -1) {
      this.handlePressToolbarButton(ToolbarButtonType.text);
    } else {
      this.clearFocus();
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

  handleInsertPhoto = (
    block,
    initialRoute = "all",
    shouldAnimate = false,
    transparent: boolean = false,
    autoFocus: boolean = false
  ) => {
    this.props.onOpenGallery({
      blockId: block?.id,
      initialRoute,
      shouldAnimate,
      onChange: this.handleInsertSticker,
      transparent,
      autoFocus
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
    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

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
    const _block = this.props.post.blocks[blockId];

    const minWidth = minImageWidthByFormat(_block.format);

    const block = buildImageBlock({
      image,
      id: blockId,
      layout: _block.layout,
      width: minWidth,
      autoInserted: _block.autoInserted,
      height: image.image.height * (minWidth / image.image.width),
      dimensions,
      format: _block.format
    });

    this.handleChangeBlock(block);
  };

  buttonRef = React.createRef();
  lastTappedBlockId = null;
  openImagePickerForPlaceholder = () => {
    const block = Object.values(this.props.post.blocks).find(
      isPlaceholderImageBlock
    );

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

  get focusedBlock(): PostBlockType | null {
    const { focusedBlockId, focusType } = this.state;

    const node = this.props.inlineNodes[focusedBlockId];
    return node ? node.block : this.props.post.blocks[focusedBlockId];
  }

  get focusedNode() {
    const { focusedBlockId, focusType } = this.state;

    const node = this.props.inlineNodes[focusedBlockId];
    return node;
  }

  resetText = () => {
    for (const entry of this._blockInputRefs.entries()) {
      const [id, ref] = entry;
      const block =
        this.props.post.blocks[id] ?? this.props.inlineNodes[id]?.block;

      if (!block || block.type !== "text") {
        continue;
      }

      ref.current.setNativeProps({ text: block.value });
    }
  };

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
        window.requestAnimationFrame(() => {
          this.clearFocus();
        });
      }
    }
  };

  handleTapBlock = (blockId: string) => (this.lastTappedBlockId = blockId);
  hasPlaceholderImageBlocks = () =>
    !!Object.values(this.props.post.blocks).find(isPlaceholderImageBlock);

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
  textColorValue = Animated.color(0, 0, 0, 1);
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
    isFixedSizeBlock(this.focusedBlock) &&
      hasHappened &&
      this.scrollRef.current.handleKeyboardEvent(event);
    // if (this.state.focusType === FocusType.absolute) {
    // this.scrollToTop();
    // }
  };
  handleHideKeyboard = (event, hasHappened) => {
    this.scrollRef.current.handleKeyboardEvent(event);
    hasHappened && this.scrollRef.current.resetKeyboardSpace();
  };
  handleChangeFrame = event => {
    this.scrollRef.current.handleKeyboardEvent(event);
  };

  handleChangeBottomInset = bottomInset => this.setState({ bottomInset });
  handleChangeOverrides = overrides => {
    const _block: TextPostBlock = {
      ...this.focusedBlock,
      config: {
        ...this.focusedBlock.config,
        overrides: { ...this.focusedBlock.config.overrides, ...overrides }
      }
    };

    this.handleChangeFocusedBlock(_block);
  };

  handleChangeBorderType = (border: TextBorderType, overrides: Object) => {
    let block = {
      ...this.focusedBlock,
      config: {
        ...this.focusedBlock.config,
        overrides: { ...this.focusedBlock.config.overrides, ...overrides },
        border
      }
    };

    if (overrides) {
      block.config.overrides = overrides;
    }
    this.handleChangeFocusedBlock(block);
  };

  handleBack = () => {
    if (this.state.focusType === FocusType.absolute) {
      this.clearFocus();
    } else if (this.state.focusType !== null) {
      this.handleBlur();
    } else {
      this.props.onBack();
    }
  };

  darkSheetOpacityValue = Animated.cond(
    Animated.eq(this.focusTypeValue, FocusType.absolute),
    this.keyboardVisibleValue,
    0
  );

  getPostContainerStyle = memoize((backgroundColor, width) => {
    return [
      styles.safeWrapper,
      styles.scrollContainer,
      {
        backgroundColor,
        width
      }
    ];
  });

  get postContainerStyle() {
    return this.getPostContainerStyle(
      this.props.post,
      this.state.bounds?.width || POST_WIDTH
    );
  }

  postPreviewHandlers = [];
  postBottomY = new Animated.Value<number>(0);
  velocityX = new Animated.Value<number>(0);
  velocityY = new Animated.Value<number>(0);
  currentX = new Animated.Value<number>(0);
  currentY = new Animated.Value<number>(0);
  currentWidth = new Animated.Value<number>(0);
  currentHeight = new Animated.Value<number>(0);

  onTransform = Animated.event(
    [
      {
        nativeEvent: {
          layout: {
            width: this.currentWidth,
            height: this.currentHeight,
            x: this.currentX,
            y: this.currentY
          }
        }
      }
    ],
    { useNativeDriver: true }
  );

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
      <View
        style={[
          styles.wrapper,
          sizeStyle,
          {
            backgroundColor: "black"
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
                    [
                      this.tapGestureState,
                      this.tapX,
                      this.tapY,
                      this.focusTypeValue,
                      this.focusedBlockValue,
                      this.keyboardHeightValue,
                      this.tapYAbsolute
                    ],
                    this.handleTapBackground
                  )
                )
              ])
            )
          ])}
        />

        <View onLayout={this.updateBounds} style={this.postContainerStyle}>
          <PostPreview
            bounds={bounds}
            blocks={post.blocks}
            positions={post.positions}
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
            bottomY={this.postBottomY}
            onTapBackground={this.onTapBackground}
            scrollY={this.props.scrollY}
            ref={this.scrollRef}
            maxX={bounds.width}
            scrollEnabled={this.state.focusType !== FocusType.absolute}
            onFocus={this.handleFocusBlock}
            onOpenImagePicker={this.handleOpenImagePicker}
            onChangePhoto={this.handleChangeImageBlockPhoto}
            waitFor={this.postPreviewHandlers}
            maxY={bounds.height}
            onlyShow={this.state.focusedBlockId}
            onBlur={this.handleBlurBlock}
            focusType={this.state.focusType}
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
                keyboardHeight={this.relativeKeyboardHeightValue}
                opacity={this.darkSheetOpacityValue}
              ></DarkSheet>
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
                velocityX={this.velocityX}
                onTransform={this.onTransform}
                velocityY={this.velocityY}
                focusTypeValue={this.focusTypeValue}
                keyboardVisibleValue={this.keyboardVisibleValue}
                keyboardHeightValue={this.relativeKeyboardHeightValue}
                keyboardHeight={this.props.keyboardHeight}
                waitFor={this.postPreviewHandlers}
                focusType={this.state.focusType}
                minX={bounds.x}
                minY={bounds.y}
                maxX={sizeStyle.width}
                bottomY={this.postBottomY}
                onFocus={this.handleFocusBlock}
                maxY={sizeStyle.height}
                onTapNode={this.handleTapNode}
                onlyShow={this.state.focusedBlockId}
                onBlur={this.handleBlurNode}
                onChangeNode={this.handleInlineNodeChange}
                onPan={this.handlePan}
              />
              <MarginView
                minX={10}
                absoluteX={this.panX}
                absoluteY={this.panY}
                velocityX={this.velocityX}
                velocityY={this.velocityY}
                minY={10}
                focusType={this.state.focusType}
                bottom={this.postBottomY}
                focusTypeValue={this.focusTypeValue}
                x={this.currentX}
                y={this.currentY}
                width={this.currentWidth}
                height={this.currentHeight}
              />
            </Layer>
          </PostPreview>

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
              focusedBlock={this.focusedBlock}
              keyboardVisibleOpacity={this.keyboardVisibleValue}
              panX={this.panX}
              inputRef={this._blockInputRefs[this.state.focusedBlockId]}
              panY={this.panY}
              isPageModal={this.props.isReply}
              waitFor={this.postPreviewHandlers}
              width={sizeStyle.width}
              height={sizeStyle.height}
              relativeHeight={this.relativeKeyboardHeightValue}
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
              exampleCount={this.props.exampleCount}
              exampleIndex={this.props.exampleIndex}
              onPressExample={this.props.onPressExample}
              toolbarType={this.toolbarType}
              isNodeFocused={this.state.focusType === FocusType.absolute}
              activeButton={this.state.activeButton}
              keyboardVisibleValue={this.keyboardVisibleValue}
              focusTypeValue={this.focusTypeValue}
              nodeListRef={this.nodeListRef}
            ></ActiveLayer>
          </Layer>
        </View>

        <TextInputToolbar
          nativeID="new-post-input"
          onChooseTemplate={this.handleChangeTemplate}
          focusType={this.state.focusType}
          block={this.focusedBlock}
          onChangeOverrides={this.handleChangeOverrides}
          focusType={this.state.focusType}
          onChangeBorderType={this.handleChangeBorderType}
        />
      </View>
    );
  }
}

export const PostEditor = React.forwardRef((props, ref) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const { pausePlayers, unpausePlayers } = React.useContext(MediaPlayerContext);

  return (
    <RawwPostEditor
      {...props}
      ref={ref}
      showActionSheetWithOptions={showActionSheetWithOptions}
      pausePlayers={pausePlayers}
      unpausePlayers={unpausePlayers}
    />
  );
});
export default PostEditor;
