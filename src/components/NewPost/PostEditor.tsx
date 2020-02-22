import { useActionSheet } from "@expo/react-native-action-sheet";
import { cloneDeep, debounce, isArray, isEmpty, memoize } from "lodash";
import * as React from "react";
import {
  findNodeHandle,
  LayoutChangeEvent,
  StyleSheet,
  Task,
  View
} from "react-native";
import { State as GestureState } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import ReactNative from "react-native/Libraries/Renderer/shims/ReactNative";
import { IS_SIMULATOR, SCREEN_DIMENSIONS } from "../../../config";
import { doKeyboardAnimation } from "../../lib/animations";
import { immerable } from "immer";

import {
  getAllSnapPoints,
  getImageBlocks,
  getPositionsKey,
  isEmptyTextBlock,
  isTextBlock,
  NewPostType,
  generateBlockId
} from "../../lib/buildPost";
import { SnapPoint } from "../../lib/enums";
import {
  getEstimatedBounds,
  getEstimatedBoundsToContainer,
  startExport
} from "../../lib/Exporter";
import { PostFragment } from "../../lib/graphql/PostFragment";
import {
  imageContainerFromVideoEdit,
  ImageSourceType,
  isVideo,
  YeetImageContainer,
  YeetImageRect
} from "../../lib/imageSearch";
import { scaleRectByFactor } from "../../lib/Rect";
import { createDraft, finishDraft } from "immer";

import { SPACING } from "../../lib/styles";
import { sendLightFeedback, sendSelectionFeedback } from "../../lib/Vibration";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
import { MediaPlayerComponent } from "../MediaPlayer/MediaPlayerComponent";
import { MediaPlayerContext } from "../MediaPlayer/MediaPlayerContext";
import { sendToast, ToastType } from "../Toast";
import { BlockActionType } from "./BlockActions";
import { ContentContainerContext } from "./ContentContainerContext";
import { FOOTER_HEIGHT, isDeletePressed } from "./EditorFooter";
import { GallerySectionItem } from "./ImagePicker/GallerySectionItem";
import { ActiveLayer } from "./layers/ActiveLayer";
import {
  buildImageBlock,
  buildTextBlock,
  FocusType,
  ImagePostBlock,
  isPlaceholderImageBlock,
  minImageWidthByFormat,
  PostBlockType,
  PostFormat,
  PostLayout,
  POST_WIDTH,
  TextBorderType,
  TextPostBlock,
  TextTemplate
} from "./NewPostFormat";
import {
  buildEditableNode,
  EditableNode,
  EditableNodeMap
} from "./Node/BaseNode";
import { SnapGuides } from "./Node/SnapGuides";
import {
  EditableNodeList,
  PostPreview,
  willContentScroll
} from "./PostPreview";
import { PostSchemaContext } from "./PostSchemaProvider";
import { MovableViewPositionChange } from "./SnapContainerView";
import { SnapPreview } from "./SnapPreview";
import TextInput from "./Text/CustomTextInputComponent";
import { TextInputToolbar } from "./TextInputToolbar";
import {
  DEFAULT_TOOLBAR_BUTTON_TYPE,
  ToolbarButtonType,
  ToolbarType
} from "./Toolbar";
import {
  updateBlockFrame,
  handleStopMovingNode,
  insertTextNode,
  deleteNode as deleteNodeAction,
  deleteBlock as deleteBlockAction
} from "../../lib/PostEditor/actions";

const { block, cond, set, eq, sub } = Animated;

export const HEADER_HEIGHT = 30 + SPACING.normal;

const _getPositionsKey = memoize(getPositionsKey);
const styles = StyleSheet.create({
  safeWrapper: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    width: SCREEN_DIMENSIONS.width,
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
    width: SCREEN_DIMENSIONS.width
  },
  wrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
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

  return children;
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
  showSnapGuide: boolean;
  snapPoints: Array<SnapPoint>;
  postTopY: number;
  postBottomY: number;
  isSaving: boolean;
  bottomInset: number;
  snapPoint: SnapPoint | null;
};

class RawwPostEditor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeButton: DEFAULT_TOOLBAR_BUTTON_TYPE,
      focusedBlockId: null,
      focusType: null,
      postTopY: 0,
      snapPoints: [],
      postBottomY: 0,
      isSaving: false,
      bottomInset: 0,
      snapPoint: null,
      showSnapGuide: false,
      contentContainerContextValue: {
        contentContainerTag: null,
        movableViewTags: [],
        addMovableViewTag: this.insertMovableViewTag,
        removeMovableViewTag: this.removeMovableViewTag
      }
    };

    this._blockInputRefs = new Map([
      ...Object.values(props.post.blocks).map(({ id }) => [
        id,
        React.createRef<View>()
      ])
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

  handleWillFocus = () => {};

  lastSnapPoint: SnapPoint | null = null;
  lastSetSnapPoint: number;
  snapPointPreviewCallback: number | null = null;
  handleChangeSnapPoint = snapPoint => {
    if (this.snapPointPreviewCallback) {
      window.clearTimeout(this.snapPointPreviewCallback);
      this.snapPointPreviewCallback = null;
    }

    if (snapPoint) {
      this.lastSnapPoint = snapPoint;
    }

    this.lastSetSnapPoint = new Date().getTime();

    this.setState({ snapPoint }, () => {
      const snapPoint = this.state.snapPoint;

      sendSelectionFeedback();
      if (!!snapPoint) {
        const _key = snapPoint.key;
        if (this.snapPointPreviewCallback) {
          window.clearTimeout(this.snapPointPreviewCallback);
          this.snapPointPreviewCallback = null;
        }

        const timeout = window.setTimeout(() => {
          if (this.snapPointPreviewCallback === timeout) {
            this.snapPointPreviewCallback = null;
          }

          if (this.state.snapPoint && this.state.snapPoint.key === _key) {
            this.setState({ showSnapGuide: true });
          }
        }, 500);

        this.snapPointPreviewCallback = timeout;
      }
    });
  };

  // handleChangeSnapPoint = debounce(this._handleChangeSnapPoint, 10);
  currentScale = new Animated.Value(1.0);

  deleteNode = (id: string) => {
    if (this._inlineNodeRefs.has(id)) {
      this._inlineNodeRefs.delete(id);
    }

    if (this._blockInputRefs.has(id)) {
      this._blockInputRefs.delete(id);
    }

    this.props.updateSchema(schema =>
      deleteNodeAction(schema, { blockId: id })
    );

    this.clearFocus();
  };

  nodeFrameTask: Task | null = null;

  componentDidMount() {
    // window.requestIdleCallback(this.measureEverything);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      _getPositionsKey(prevProps.post.positions) !==
      _getPositionsKey(this.props.post.positions)
    ) {
      if (this.snapPointPreviewCallback) {
        window.clearTimeout(this.snapPointPreviewCallback);
        this.snapPointPreviewCallback = null;
      }

      // this.measureEverything();
    }

    if (
      prevState.focusType === FocusType.panning &&
      this.state.focusType !== FocusType.panning
    ) {
      if (this.snapPointPreviewCallback) {
        window.clearTimeout(this.snapPointPreviewCallback);
        this.snapPointPreviewCallback = null;
      }
    }
  }

  // measureAllBlocks = async () => {
  //   for (const key in this.props.post.blocks) {
  //     const block = this.props.post.blocks[key];

  //     this
  //   }
  // };

  componentWillUnmount() {
    this._isMounted = false;
    this.nodeFrameTask?.cancel();
    if (this.snapPointPreviewCallback) {
      window.clearTimeout(this.snapPointPreviewCallback);
    }
  }

  handlePressToolbarButton = activeButton => {
    if (activeButton === ToolbarButtonType.photo) {
      this.handleInsertPhoto(undefined, GallerySectionItem.cameraRoll);
    } else if (activeButton === ToolbarButtonType.gif) {
      this.handleInsertPhoto(undefined, GallerySectionItem.gifs);
    } else if (activeButton === ToolbarButtonType.search) {
      this.handleInsertPhoto(
        undefined,
        GallerySectionItem.search,
        true,
        true,
        true
      );
    } else if (activeButton === ToolbarButtonType.text) {
      this.handleInsertText({
        x: SPACING.half,
        y: this.state.postTopY > 0 ? 50 : 100
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

            this.setState(
              {
                focusedBlockId: block.id,
                focusType: FocusType.static,
                snapPoint: null
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
    const currentNode = this.props.inlineNodes.get(editableNode.block.id);
    if (!currentNode) {
      return;
    }

    const isFirstInsertion =
      isTextBlock(currentNode.block) &&
      isEmpty(currentNode.block.value) &&
      !isEmpty(editableNode.block.value);

    if (isFirstInsertion) {
      this.props.onChangeNodes({
        ...this.props.inlineNodes,
        [editableNode.block.id]: editableNode
      });
    } else {
      this.props.onChangeNodes({
        ...this.props.inlineNodes,
        [editableNode.block.id]: editableNode
      });
    }
  };

  handleChangeBlock = (block: PostBlockType) => {};

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
    } else if (this.state.focusType === FocusType.static) {
    }
  };

  handleInsertText = ({ x, y }: { x: number; y: number }) => {
    const id = generateBlockId();

    this._blockInputRefs.set(id, React.createRef());

    ReactNative.unstable_batchedUpdates(() => {
      doKeyboardAnimation();
      this.props.updateSchema(schema => insertTextNode(schema, { id, x, y }));

      this.setState(
        {
          focusedBlockId: id,
          focusType: FocusType.absolute,
          snapPoint: null,
          snapPoints: []
        },
        () => {
          // this._blockInputRefs.get(block.id)?.current?.focus();
        }
      );
    });
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
    this.clearFocus();
  };

  handleBlurBlock = (block: PostBlockType) => {
    if (block) {
      this.handleChangeBlock(block);
    }

    this.clearFocus();
  };

  handleFocusBlock = (block: PostBlockType) => {
    console.log("FOUCS BLOCK", block);

    const focusType = this.props.inlineNodes.get(block.id)
      ? FocusType.absolute
      : FocusType.static;

    if (
      this.focusedBlock?.id === block.id &&
      this.state.focusType === focusType
    ) {
      return;
    }

    this.setState(
      {
        focusedBlockId: block.id,
        focusType
      },
      () => {
        if (block.type === "text") {
          const ref = this._blockInputRefs.get(block.id).current;
          if (!ref?.isFocused) {
            ref?.focus();
          }
        }
      }
    );
  };

  clearFocus = () => {
    this.dismissKeyboard();

    this.setState({
      focusedBlockId: null,
      focusType: null,
      snapPoint: null,
      showSnapGuide: false,
      snapPoints: []
    });
  };

  get currentTextInput() {
    if (this.focusedBlock?.type === "text") {
      return this._blockInputRefs.get(this.state.focusedBlockId)?.current;
    } else {
      return null;
    }
  }

  dismissKeyboard = () => {
    this.currentTextInput?.blur();
  };

  handleSend = async () => {
    console.log("Start sending");
    try {
      const [snapshot, data] = await this.createSnapshot(true);

      return this.props.onSubmit(snapshot, data);
    } catch (exception) {
      console.error(exception);
      sendToast("Try again plz.", ToastType.error);
    }
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
          return rows.map(id => this.props.post.blocks.get(id));
        } else {
          return this.props.post.blocks.get(rows);
        }
      }),
      this.props.inlineNodes,
      this._blockInputRefs,
      this.contentViewRef,
      this._inlineNodeRefs,
      isServerOnly,
      this.props.bounds?.x ?? 0,
      this.props.bounds?.y ?? 0,
      isEmpty(this.props.post.backgroundColor)
        ? "rgb(0, 0, 0)"
        : this.props.post.backgroundColor
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

    return ref;
  };

  setNodeRef = (id: string, node: View) => {
    this._inlineNodeRefs.set(id, node);
    const { contentContainerContextValue } = this.state;

    const tag = findNodeHandle(node);
    if (tag) {
      let tags = contentContainerContextValue.movableViewTags.slice();

      if (!tags.includes(tag)) {
        tags.push(tag);
        console.log("RENDER ", tag);
        this.setState({
          contentContainerContextValue: {
            ...contentContainerContextValue,
            movableViewTags: tags
          }
        });
      }
    }
  };

  scrollRef = React.createRef<KeyboardAwareScrollView>();
  keyboardVisibleValue = this.props.keyboardVisibleValue;
  keyboardHeightValue = this.props.keyboardHeightValue;
  animatedKeyboardVisibleValue = this.props.animatedKeyboardVisibleValue;
  focusedBlockValue = new Animated.Value<number>(-1);
  focusTypeValue = new Animated.Value<FocusType | -1>(-1);

  tapGestureState = new Animated.Value(GestureState.UNDETERMINED);

  // findNode = (x: number, y: number) => {
  //   Object.values(this.props.inlineNodes).find(node => {
  //     node.position.x
  //   })
  // };

  handlePressBackground = ({ x, y }) => {
    if (this.state.focusType === null) {
      this.handlePressToolbarButton(ToolbarButtonType.text);
    } else {
      this.clearFocus();
    }
  };

  _isMounted = true;

  handleOpenImagePicker = (block: ImagePostBlock, shouldAnimate = true) => {
    let initialRoute;
    if (block.value) {
      if (block.value.image.source === ImageSourceType.giphy) {
        initialRoute = GallerySectionItem.gifs;
      } else if (block.value.image.source === ImageSourceType.cameraRoll) {
        initialRoute = GallerySectionItem.cameraRoll;
      } else if (block.value.image?.mimeType) {
        initialRoute = GallerySectionItem.all;
      }
    }

    this.props.onOpenGallery({
      blockId: block.id,
      initialRoute,
      shouldAnimate,
      onChange: this.handleChangeImageBlockPhoto
    });
  };

  deleteBlock = (id: string) => {
    this.props.updateSchema(schema =>
      deleteBlockAction(schema, { blockId: id })
    );
  };

  handleBlockAction = ({
    id,
    action
  }: {
    id: string;
    action: BlockActionType;
  }) => {
    const node = this.props.inlineNodes.get(id);
    const block = node ?? this.props.post.blocks.get(id);
    const blockInputRef = this._blockInputRefs.get(id)?.current;
    const isNode = !!node;

    switch (action) {
      case BlockActionType.change: {
        this.handleOpenImagePicker(block);
        return;
      }

      case BlockActionType.crop: {
      }

      case BlockActionType.delete: {
        if (isNode) {
          this.deleteNode(id);
        } else {
          this.deleteBlock(id);
        }

        return;
      }

      case BlockActionType.move: {
        const frame = scaleRectByFactor(
          0.8,
          block.frame ?? { width: 0, height: 0, x: 0, y: 0 }
        );

        const position = {
          x: Math.max(frame.x, 0),
          y: (this.state.bottomInset - frame.y - frame.height) * -1
        };

        const _block = cloneDeep(block);
        _block.format = PostFormat.sticker;

        const editableNode = buildEditableNode({
          block: _block,
          scale: 0.8,
          rotate: 0,
          verticalAlign: "bottom",
          ...position
        });

        this.props.onChangeNodes({
          ...this.props.inlineNodes,
          [block.id]: editableNode
        });
        this.deleteBlock(id);
      }

      case BlockActionType.trim: {
        if (!isVideo(block.value?.image?.mimeType)) {
          return;
        }

        (blockInputRef as MediaPlayerComponent).editVideo().then(resp => {
          if (typeof resp === "object" && typeof resp.url === "string") {
            const imageContainer = imageContainerFromVideoEdit(
              resp,
              block.value
            );

            this.handleChangeImageBlockPhoto(id, imageContainer, resp.size);
          }
        });
      }
    }
  };

  handleInsertPhoto = (
    block,
    initialRoute = GallerySectionItem.all,
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
    _image: YeetImageContainer,
    post: Partial<PostFragment>
  ) => {
    let image = _image;

    if (post) {
      const imageBlocks = getImageBlocks(post);

      if (imageBlocks[0]) {
        const container: YeetImageContainer = {
          image: imageBlocks[0].value,
          preview: imageBlocks[0].value,
          id: imageBlocks[0].id
        };
        image = container;
      }
    }

    const minWidth = minImageWidthByFormat(PostFormat.sticker);

    const block = buildImageBlock({
      image,
      id: blockId,
      layout: PostLayout.media,
      width: minWidth,
      height: image.image.height * (minWidth / image.image.width),
      autoInserted: false,
      format: PostFormat.sticker
    });

    const editableNode = buildEditableNode({
      block,
      x: POST_WIDTH / 2 - block.config.dimensions.maxX / 2,
      y: block.config.dimensions.maxY + 100
    });

    this._blockInputRefs.set(block.id, React.createRef());

    this.props.onChangeNodes({
      ...this.props.inlineNodes,
      [block.id]: editableNode
    });

    this.setState(
      {
        focusedBlockId: null,
        focusType: null,
        snapPoint: null,
        activeButton: null
      },
      async () => {
        const node = { ...this.props.inlineNodes.get(block.id) };
        this.props.onChangeNodes({
          ...this.props.inlineNodes,
          [block.id]: node
        });
      }
    );
  };

  handleChangeImageBlockPhoto = (
    blockId: string,
    image: YeetImageContainer,
    dimensions?: YeetImageRect
  ) => {
    console.log({ blockId, image });
    const node = this.props.inlineNodes.get(blockId);
    const _block = node?.block ?? this.props.post.blocks.get(blockId);
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

    if (node) {
      this.handleInlineNodeChange({
        ...node,
        block: block
      });
    } else {
      this.handleChangeBlock(block);
    }
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

    const node = this.props.inlineNodes.get(focusedBlockId);
    return node ? node.block : this.props.post.blocks.get(focusedBlockId);
  }

  get focusedNode() {
    const { focusedBlockId, focusType } = this.state;

    const node = this.props.inlineNodes.get(focusedBlockId);
    return node;
  }

  resetText = () => {
    for (const entry of this._blockInputRefs.entries()) {
      const [id, ref] = entry;
      const block =
        this.props.post.blocks.get(id) ?? this.props.inlineNodes.get(id)?.block;

      if (!block || block.type !== "text") {
        continue;
      }

      ref?.current?.setNativeProps({ text: block.value });
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
    console.trace();

    if (isPanning) {
    } else {
      const { focusedBlockId, focusType } = this.state;

      if (
        focusedBlockId === blockId &&
        focusType === FocusType.panning &&
        isDeletePressed(x, y)
      ) {
        this.deleteNode(blockId);
        sendLightFeedback();
      } else if (
        (this.state.snapPoint !== null ||
          (this.lastSnapPoint &&
            new Date().getTime() - this.lastSetSnapPoint < 100)) &&
        focusedBlockId === blockId &&
        focusType === FocusType.panning
      ) {
        const snapPoint = this.state.snapPoint ?? this.lastSnapPoint;
        sendLightFeedback();
        const blocks = cloneDeep(snapPoint.value.blocks);
        const positions = cloneDeep(snapPoint.value.positions);

        this.setState(
          {
            showSnapGuide: false,
            snapPoint: null,
            snapPoints: []
          },
          () => {
            this.props.onChange({
              ...this.props.post,
              blocks,
              positions
            });
            this.deleteNode(focusedBlockId);
            // this.clearFocus();
          }
        );
      } else {
        this.clearFocus();
      }

      this.lastSnapPoint = null;
      this.lastSetSnapPoint = null;
    }
  };

  hasPlaceholderImageBlocks = () =>
    !!Object.values(this.props.post.blocks).find(isPlaceholderImageBlock);

  get panningNode() {
    const { focusedBlockId, focusType } = this.state;

    if (focusType === FocusType.panning) {
      return this.props.inlineNodes.get(focusedBlockId);
    } else {
      return null;
    }
  }

  // onTapBackground = Animated.event(
  //   [
  //     {
  //       nativeEvent: {
  //         state: this.tapGestureState,
  //         x: this.panX,
  //         y: this.panY
  //       }
  //     }
  //   ],
  //   { useNativeDriver: true }
  // );

  contentViewRef = React.createRef();

  scrollToTop = () =>
    this.scrollRef.current.getScrollResponder().scrollTo({
      y: this.props.paddingTop * -1,
      x: 0
    });

  handleShowKeyboard = (event, hasHappened) => {
    console.log("POST BOTTOM Y", this.state.postBottomY);
    // window.requestAnimationFrame(() =>
    //   // this.scrollRef.current.handleKeyboardEvent(event)
    // );

    // if (this.state.focusType === FocusType.absolute) {
    // this.scrollToTop();
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
    if (this.state.focusType === FocusType.absolute) {
      this.clearFocus();
    } else if (this.state.focusType !== null) {
      this.handleBlur();
    } else {
      this.props.onBack();
    }
  };

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
    return this.getPostContainerStyle(this.props.post, SCREEN_DIMENSIONS.width);
  }

  _handleUpdateBlockFrame = (blockId: string, ref: React.RefObject<View>) => {
    // return getEstimatedBoundsToContainer(ref, this.contentViewRef.current).then(
    //   frame => {
    //     frame[immerable] = true;
    //     this.props.updateSchema(schema =>
    //       updateBlockFrame(schema, { blockId, frame })
    //     );
    //   }
    // );
  };
  handleUpdateBlockFrame = debounce(this._handleUpdateBlockFrame, 20);

  postPreviewHandlers = [];

  onContentLayout = (event: LayoutChangeEvent) => {
    getEstimatedBounds(this.contentViewRef.current).then(
      ({ x, y, width, height }) => {
        this.setState({
          postBottomY: y + height,
          postTopY: y
        });
      }
    );
  };

  handleSetPostBottom = ([postBottomY, postTopY]) =>
    this.setState({ postBottomY, postTopY });

  // onContentLayout = Animated.event(
  //   [
  //     {
  //       nativeEvent: {
  //         layout: {
  //           y: this.props.offsetY,
  //           height: this.postBottomY
  //         }
  //       }
  //     }
  //   ],
  //   { useNativeDriver: true }
  // );
  hideSnapGuide = () => this.setState({ showSnapGuide: false });
  _contentViewRef = contentView => {
    this.contentViewRef.current = contentView;
    if (contentView) {
      const contextValue = cloneDeep(this.state.contentContainerContextValue);

      contextValue.contentContainerTag = findNodeHandle(contentView);

      this.setState({
        contentContainerContextValue: contextValue
      });
    }
  };

  handleStartMoving = (data: MovableViewPositionChange) => {
    const {
      uid: blockId,
      transform: { x, y },
      frame
    } = data;

    const focusType = FocusType.panning;
    // if (blockId !== this.state.focusedBlockId) {
    //   this.focusedBlockValue.setValue(blockId.hashCode());
    // }

    // if (this.state.focusType !== focusType) {
    //   this.focusTypeValue.setValue(focusType);
    // }
    const block = cloneDeep(this.props.inlineNodes.get(blockId)?.block);
    block.frame = frame;

    const snapPoints = block
      ? getAllSnapPoints(
          block,
          this.props.post.blocks,
          this.props.post.positions,
          32
        )
      : [];

    ReactNative.unstable_batchedUpdates(() => {
      this.props.updateSchema(schema =>
        updateBlockFrame(schema, { blockId, frame })
      );

      this.setState({
        focusedBlockId: blockId,
        focusType,
        snapPoints
      });
    });
  };

  handleStopMoving = (data: MovableViewPositionChange) => {
    ReactNative.unstable_batchedUpdates(() => {
      this.handlePan({
        blockId: data.uid,
        x: data.transform.x,
        y: data.transform.y,
        isPanning: false
      });

      const node = this.props.inlineNodes.get(data.uid);

      if (node) {
        const { x, y, scaleX: scale, rotate } = data.transform;
        this.props.updateSchema(schema => handleStopMovingNode(schema, data));

        const needsForceTransformUpdpate =
          x !== node.position.x || y !== node.position.y;

        if (needsForceTransformUpdpate) {
          const transform = [
            scale !== 1.0 && {
              scale
            },
            rotate && { rotate: rotate + "rad" }
          ].filter(Boolean);

          this._inlineNodeRefs.get(node.block.id).setNativeProps({
            transform: transform.length !== 0 ? transform : null
          });
        }
      }
    });
  };

  render() {
    const { post, minX, minY } = this.props;

    const { snapPoint } = this.state;

    const {
      bounds = {
        width: SCREEN_DIMENSIONS.width,
        height: SCREEN_DIMENSIONS.height,
        x: minX,
        y: minY
      }
    } = this.state;

    const sizeStyle = {
      width: bounds.width || SCREEN_DIMENSIONS.width,
      height: bounds.height || SCREEN_DIMENSIONS.height
    };

    return (
      <View style={styles.wrapper}>
        <ContentContainerContext.Provider
          value={this.state.contentContainerContextValue}
        >
          <View style={this.postContainerStyle}>
            <PostPreview
              bounds={bounds}
              paddingTop={this.props.paddingTop}
              paddingBottom={FOOTER_HEIGHT}
              inlineNodes={this.props.inlineNodes}
              focusedBlockId={this.state.focusedBlockId}
              topInsetValue={this.topInsetValue}
              postTopY={this.state.postTopY}
              postBottomY={this.state.postBottomY}
              keyboardHeight={this.props.keyboardHeight}
              simultaneousHandlers={this.props.simultaneousHandlers}
              focusTypeValue={this.focusTypeValue}
              isFocused={this.props.isFocused}
              minX={bounds.x}
              positionsKey={_getPositionsKey(post.positions)}
              offsetY={this.props.offsetY}
              minY={bounds.y}
              contentViewRef={this._contentViewRef}
              onLayout={this.onContentLayout}
              setPostBottom={this.handleSetPostBottom}
              backgroundColor={post.backgroundColor || "#000"}
              focusedBlockValue={this.focusedBlockValue}
              bottomY={this.postBottomY}
              onTapBackground={this.handlePressBackground}
              scrollY={this.props.scrollY}
              ref={this.scrollRef}
              maxX={bounds.width}
              scrollEnabled
              onFocus={this.handleFocusBlock}
              snapPoints={this.state.snapPoints}
              onOpenImagePicker={this.handleOpenImagePicker}
              onChangePhoto={this.handleChangeImageBlockPhoto}
              onAction={this.handleBlockAction}
              waitFor={this.postPreviewHandlers}
              maxY={bounds.height}
              onLayoutBlock={this.handleUpdateBlockFrame}
              onlyShow={this.state.focusedBlockId}
              onBlur={this.handleBlurBlock}
              focusType={this.state.focusType}
              setBlockInputRef={this.setBlockInputRef}
              onChangeNode={this.handleInlineNodeChange}
              setBlockAtIndex={this.handleChangeBlock}
              showEditableNodes={this.state.isSaving}
              onMoveStart={this.handleStartMoving}
              onMoveEnd={this.handleStopMoving}
            >
              <Layer
                flipY
                pointerEvents="box-none"
                zIndex={LayerZIndex.inlineNodes}
                opacity={this.props.controlsOpacityValue}
              >
                <EditableNodeList
                  setNodeRef={this.setNodeRef}
                  focusedBlockId={this.state.focusedBlockId}
                  focusedBlockValue={this.focusedBlockValue}
                  setBlockInputRef={this.setBlockInputRef}
                  panX={this.panX}
                  panY={this.panY}
                  absoluteX={this.absoluteX}
                  absoluteY={this.absoluteY}
                  scrollY={this.props.scrollY}
                  topInsetValue={this.topInsetValue}
                  focusTypeValue={this.focusTypeValue}
                  keyboardHeight={this.props.keyboardHeight}
                  focusType={this.state.focusType}
                  currentScale={this.currentScale}
                  height={this.postBottomY}
                  minX={bounds.x}
                  minY={bounds.y}
                  maxX={sizeStyle.width}
                  offsetY={this.props.offsetY}
                  onAction={this.handleBlockAction}
                  bottomY={this.postBottomY}
                  onFocus={this.handleFocusBlock}
                  maxY={bounds.height}
                  onTapNode={this.handleTapNode}
                  onlyShow={this.state.focusedBlockId}
                  onBlur={this.handleBlurNode}
                  onChangeNode={this.handleInlineNodeChange}
                  onPan={this.handlePan}
                />
              </Layer>

              {this.state.focusType === FocusType.panning &&
                this.state.snapPoints.length > 0 && (
                  <SnapGuides
                    snapPoint={this.state.snapPoint}
                    snapPoints={this.state.snapPoints}
                  />
                )}
            </PostPreview>

            {this.state.focusType === FocusType.panning &&
              this.state.showSnapGuide && (
                <Layer
                  isShown
                  width={sizeStyle.width}
                  height={sizeStyle.height}
                  zIndex={LayerZIndex.icons}
                  pointerEvents="box-none"
                >
                  <SnapPreview
                    key={_getPositionsKey(this.props.post.positions)}
                    snapPoint={snapPoint}
                    focusTypeValue={this.focusTypeValue}
                    onDismiss={this.hideSnapGuide}
                    offsetY={this.props.offsetY}
                    bottom={this.postBottomY}
                    positionKey={_getPositionsKey(this.props.post.positions)}
                  />
                </Layer>
              )}
            <Layer
              isShown
              width={sizeStyle.width}
              height={this.postBottomY}
              zIndex={LayerZIndex.icons}
              pointerEvents="box-none"
            >
              <ActiveLayer
                onBack={this.handleBack}
                onSend={this.handleSend}
                focusedBlock={this.focusedBlock}
                keyboardVisibleOpacity={this.keyboardVisibleValue}
                panX={this.absoluteX}
                inputRef={this._blockInputRefs[this.state.focusedBlockId]}
                panY={this.absoluteY}
                isPageModal={this.props.isReply}
                waitFor={this.postPreviewHandlers}
                width={sizeStyle.width}
                height={sizeStyle.height}
                currentScale={this.currentScale}
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
        </ContentContainerContext.Provider>

        <TextInputToolbar
          nativeID="new-post-input"
          focusedId={this.state.focusedBlockId}
          onChangeOverrides={this.handleChangeOverrides}
          focusType={this.state.focusType}
        />
      </View>
    );
  }
}

export const PostEditor = React.forwardRef((props, ref) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const { pausePlayers, unpausePlayers } = React.useContext(MediaPlayerContext);
  const {
    schema: { post, inlineNodes },
    updateSchema
  } = React.useContext(PostSchemaContext);

  return (
    <RawwPostEditor
      {...props}
      ref={ref}
      post={post}
      updateSchema={updateSchema}
      inlineNodes={inlineNodes}
      showActionSheetWithOptions={showActionSheetWithOptions}
      pausePlayers={pausePlayers}
      unpausePlayers={unpausePlayers}
    />
  );
});
export default PostEditor;
