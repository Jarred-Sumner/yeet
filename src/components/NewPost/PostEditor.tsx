import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  cloneDeep,
  isArray,
  isEmpty,
  memoize,
  throttle,
  debounce
} from "lodash";
import * as React from "react";
import { InteractionManager, StyleSheet, Task, View } from "react-native";
import {
  ScrollView,
  State as GestureState
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import processTransform from "react-native/Libraries/StyleSheet/processTransform";
import * as TransformMatrix from "transformation-matrix";
import { IS_SIMULATOR, SCREEN_DIMENSIONS } from "../../../config";
import {
  getPositionsKey,
  isEmptyTextBlock,
  isFixedSizeBlock,
  NewPostType,
  isTextBlock,
  getImageBlocks
} from "../../lib/buildPost";
import { SnapPoint } from "../../lib/enums";
import {
  getEstimatedBounds,
  getEstimatedBoundsToContainer,
  startExport
} from "../../lib/Exporter";
import {
  imageContainerFromVideoEdit,
  ImageSourceType,
  isVideo,
  YeetImageContainer,
  YeetImageRect
} from "../../lib/imageSearch";
import { Rectangle } from "../../lib/Rectangle";
import { SPACING, COLORS } from "../../lib/styles";
import { sendLightFeedback, sendSelectionFeedback } from "../../lib/Vibration";
import { MediaPlayerComponent } from "../MediaPlayer/MediaPlayerComponent";
import { MediaPlayerContext } from "../MediaPlayer/MediaPlayerContext";
import { BlockActionType } from "./BlockActions";
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
import { MarginView } from "./Node/MarginView";
import {
  EditableNodeList,
  PostPreview,
  willContentScroll
} from "./PostPreview";
import TextInput from "./Text/CustomTextInputComponent";
import { TextInputToolbar } from "./TextInputToolbar";
import {
  DEFAULT_TOOLBAR_BUTTON_TYPE,
  ToolbarButtonType,
  ToolbarType
} from "./Toolbar";
import { scaleRectByFactor } from "../../lib/Rect";
import { moving } from "../../lib/animations";
import { SnapPreview } from "./SnapPreview";
import Alert from "../../lib/Alert";
import { sendToast, ToastType } from "../Toast";
import { SnapGuides } from "./Node/SnapGuides";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
import { PostFragment } from "../../lib/graphql/PostFragment";

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
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
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
  showSnapGuide: boolean;
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
      postBottomY: 0,
      isSaving: false,
      bottomInset: 0,
      snapPoint: null,
      showSnapGuide: false
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

    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

    this.props.onChangeNodes({
      ...this.props.inlineNodes,
      [id]: undefined
    });

    this.clearFocus();
  };

  nodeFrameTask: Task | null = null;
  componentDidMount() {
    this.nodeFrameTask = InteractionManager.runAfterInteractions(() => {
      this.getNodeFrames();
    });
  }

  getNodeFrames = async () => {
    const newNodes = { ...this.props.inlineNodes };

    for (let node of Object.values(this.props.inlineNodes)) {
      const frame = await this.getNodeFrame(node);
      newNodes[node.block.id].block.frame = frame;
    }

    this.props.onChangeNodes(newNodes);
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      _getPositionsKey(prevProps.post.positions) !==
      _getPositionsKey(this.props.post.positions)
    ) {
      if (this.snapPointPreviewCallback) {
        window.clearTimeout(this.snapPointPreviewCallback);
        this.snapPointPreviewCallback = null;
      }
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

  getNodeFrame = async (editableNode: EditableNode) => {
    const bounds = await getEstimatedBoundsToContainer(
      this._blockInputRefs.get(editableNode.block.id).current.boundsHandle,
      this.contentViewRef.current
    );

    const transform = processTransform([
      {
        scale: editableNode.position.scale
      }
      // {
      //   rotate: `${editableNode.position.rotate}rad`
      // }
    ]);

    const rect = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
    const points = TransformMatrix.applyToPoints(
      TransformMatrix.compose(
        TransformMatrix.scale(transform[0].scale, transform[0].scale)
      ),
      [
        [rect.left, rect.top],
        [rect.left, rect.bottom],
        [rect.right, rect.top],
        [rect.right, rect.bottom]
      ]
    );

    return {
      x: points[0][0],
      y: points[0][1],
      width: Math.abs(points[3][0] - points[0][0]),
      height: Math.abs(points[3][1] - points[0][1])
    };
  };

  componentWillUnmount() {
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
            this.postPreviewHandlers = [
              this.scrollRef,
              ...this._blockInputRefs.values()
            ];

            this.focusTypeValue.setValue(FocusType.static);
            this.focusedBlockValue.setValue(block.id.hashCode());
            this.setState(
              {
                focusedBlockId: block.id,
                focusType: FocusType.static,
                snapPoint: null
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

  handleInlineNodeChange = async (editableNode: EditableNode) => {
    const currentNode = this.props.inlineNodes[editableNode.block.id];
    if (!currentNode) {
      return;
    }

    let frame = editableNode.block.frame;

    try {
      editableNode.block.frame = await this.getNodeFrame(editableNode);
    } catch (exception) {
      console.error(exception);
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

  handleChangeBlock = (block: PostBlockType) => {
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
      const node = { ...this.focusedNode, block };

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
      border: TextBorderType.stroke,
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

    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

    this.setState(
      {
        focusedBlockId: block.id,
        focusType: FocusType.absolute,
        snapPoint: null
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
    if (isEmptyTextBlock(node.block)) {
      this.deleteNode(node.block.id);
    } else {
      this.handleInlineNodeChange(node);
    }
  };

  handleBlurBlock = (block: PostBlockType) => {
    if (block) {
      this.handleChangeBlock(block);
    }

    this.clearFocus();
  };

  handleFocusBlock = (block: PostBlockType) => {
    const focusType = this.props.inlineNodes[block.id]
      ? FocusType.absolute
      : FocusType.static;

    if (
      this.focusedBlock?.id === block.id &&
      this.state.focusType === focusType
    ) {
      return;
    }

    this.focusedBlockValue.setValue(block.id.hashCode());
    this.focusTypeValue.setValue(focusType);

    this.setState(
      {
        focusedBlockId: block.id,
        focusType
      },
      () => {
        if (block.type === "text") {
          this._blockInputRefs.get(block.id).current?.focus();
        }
      }
    );
  };

  clearFocus = () => {
    this.dismissKeyboard();

    this.setState(
      {
        focusedBlockId: null,
        focusType: null,
        snapPoint: null,
        showSnapGuide: false
      },
      () => {
        this.focusedBlockValue.setValue(-1);
        this.focusTypeValue.setValue(-1);
      }
    );
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
          return rows.map(id => this.props.post.blocks[id]);
        } else {
          return this.props.post.blocks[rows];
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

    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

    return ref;
  };

  setNodeRef = (id: string, node: View) => {
    this._inlineNodeRefs.set(id, node);
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

  handleTapBackground = async ([
    tapGestureState,
    x,
    y,
    focusTypeValue,
    focusBlockValue,
    keyboardHeightValue,
    tapYAbsolute
  ]) => {
    if (!this.props.isFocused) {
      return;
    }

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
      initialRoute,
      shouldAnimate,
      onChange: this.handleChangeImageBlockPhoto
    });
  };

  deleteBlock = (id: string) => {
    const blocks = cloneDeep(this.props.post.blocks);
    delete blocks[id];

    const positions = this.props.post.positions
      .map(row => {
        if (isArray(row)) {
          let _row = row.filter(_id => id !== _id);
          if (isEmpty(_row)) {
            return null;
          } else {
            return _row;
          }
        } else if (row === id) {
          return null;
        } else {
          return [row];
        }
      })
      .filter(Boolean);
    this.props.onChange({ ...this.props.post, blocks, positions });
  };

  handleBlockAction = ({
    id,
    action
  }: {
    id: string;
    action: BlockActionType;
  }) => {
    const node = this.props.inlineNodes[id];
    const block = node ?? this.props.post.blocks[id];
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
        this.clearFocus();

        if (isNode) {
          this.deleteNode(id);
        } else {
          this.deleteBlock(id);
        }
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

        console.log({ position });

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
    this.postPreviewHandlers = [
      this.scrollRef,
      ...this._blockInputRefs.values()
    ];

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
        const node = { ...this.props.inlineNodes[block.id] };
        node.block.frame = await this.getNodeFrame(node);
        this.props.onChangeNodes({
          ...this.props.inlineNodes,
          [block.id]: node
        });
      }
    );
    this.focusedBlockValue.setValue(-1);
    this.focusTypeValue.setValue(-1);
  };

  handleChangeImageBlockPhoto = (
    blockId: string,
    image: YeetImageContainer,
    dimensions?: YeetImageRect
  ) => {
    const node = this.props.inlineNodes[blockId];
    const _block = node?.block ?? this.props.post.blocks[blockId];
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
            snapPoint: null
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
  panY = new Animated.Value(
    willContentScroll(this.props.post.height, this.props.paddingTop)
      ? this.props.paddingTop * -1
      : 0
  );

  onTapBackground = Animated.event(
    [
      {
        nativeEvent: {
          state: this.tapGestureState,
          x: this.panX,
          y: this.panY
        }
      }
    ],
    { useNativeDriver: true }
  );

  absoluteX = new Animated.Value(0);
  absoluteY = new Animated.Value(0);

  textColorValue = Animated.color(0, 0, 0, 1);
  contentViewRef = React.createRef();
  topInsetValue = new Animated.Value<number>(
    willContentScroll(this.props.post.height, this.props.paddingTop)
      ? this.props.paddingTop
      : 0
  );

  relativeKeyboardHeightValue = new Animated.Value(0);

  scrollToTop = () =>
    this.scrollRef.current.getScrollResponder().scrollTo({
      y: this.props.paddingTop * -1,
      x: 0
    });

  handleShowKeyboard = (event, hasHappened) => {
    window.requestAnimationFrame(() => {
      hasHappened &&
        (isFixedSizeBlock(this.focusedBlock) ||
          (isTextBlock(this.focusedBlock) && !this.focusedNode)) &&
        this.scrollRef.current.handleKeyboardEvent(event);
    });

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
    const _block: TextPostBlock = cloneDeep(this.focusedBlock);
    Object.assign(_block.config.overrides ?? {}, overrides);

    this.handleChangeFocusedBlock(_block);
  };

  handleChangeBorderType = (border: TextBorderType, overrides: Object) => {
    const _block: TextPostBlock = cloneDeep(this.focusedBlock);

    _block.config.border = border;
    if (overrides) {
      Object.assign(_block.config.overrides, overrides);
    }

    this.handleChangeFocusedBlock(_block);
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

  _handleUpdateBlockFrame = async (
    block: PostBlockType,
    ref: React.RefObject<View>
  ) => {
    const frame = await getEstimatedBoundsToContainer(
      ref,
      this.contentViewRef.current
    );

    this.handleChangeBlock({
      ...block,
      frame
    });
  };
  handleUpdateBlockFrame = debounce(this._handleUpdateBlockFrame, 20);

  postPreviewHandlers = [];
  postBottomY = new Animated.Value<number>(0);

  // onContentLayout = ({ nativeEvent: { layout } }) =>
  //   console.log("ON LAYOUT", { layout });

  handleSetPostBottom = ([postBottomY, postTopY]) =>
    this.setState({ postBottomY, postTopY });

  onContentLayout = Animated.event(
    [
      {
        nativeEvent: {
          layout: {
            y: this.props.offsetY,
            height: this.postBottomY
          }
        }
      }
    ],
    { useNativeDriver: true }
  );

  hideSnapGuide = () => this.setState({ showSnapGuide: false });

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
      <View
        style={[
          styles.wrapper,
          sizeStyle,
          {
            backgroundColor: COLORS.background
          }
        ]}
      >
        {/* <NavigationEvents onWillFocus={this.handleWillFocus} /> */}

        {this.props.isFocused && (
          <Animated.Code
            exec={Animated.block([
              Animated.onChange(this.keyboardVisibleValue, [
                set(
                  this.props.headerOpacity,
                  sub(1.0, this.keyboardVisibleValue)
                ),
                set(this.props.controlsOpacityValue, 1.0)
              ]),

              Animated.onChange(
                this.focusTypeValue,
                block([
                  cond(eq(this.focusTypeValue, FocusType.absolute), [
                    set(this.props.controlsOpacityValue, 1.0),
                    set(
                      this.props.headerOpacity,
                      sub(1.0, this.keyboardVisibleValue)
                    )
                  ]),

                  cond(eq(this.focusTypeValue, FocusType.static), [
                    set(
                      this.props.controlsOpacityValue,
                      sub(1.0, this.keyboardVisibleValue)
                    ),
                    set(
                      this.props.headerOpacity,
                      sub(1.0, this.keyboardVisibleValue)
                    )
                  ]),
                  cond(eq(this.focusTypeValue, -1), [
                    set(this.props.controlsOpacityValue, 1.0),
                    set(this.currentScale, 1.0),
                    set(this.props.headerOpacity, 1.0)
                  ]),
                  cond(eq(this.focusTypeValue, FocusType.panning), [
                    set(this.props.headerOpacity, 0)
                  ])
                ])
              ),

              Animated.onChange(this.keyboardHeightValue, [
                Animated.set(
                  this.relativeKeyboardHeightValue,
                  Animated.cond(
                    Animated.greaterThan(
                      this.props.offsetY,
                      this.props.scrollY
                    ),
                    Animated.add(
                      Animated.sub(
                        this.keyboardHeightValue,
                        this.props.offsetY
                      ),
                      -40
                    ),
                    Animated.add(
                      this.keyboardHeightValue,
                      Animated.sub(
                        Animated.sub(this.props.scrollY, this.props.offsetY),
                        40
                      )
                    )
                  )
                )
              ]),

              Animated.onChange(
                this.postBottomY,
                Animated.call(
                  [this.postBottomY, this.props.offsetY],
                  this.handleSetPostBottom
                )
              ),
              Animated.onChange(
                this.props.offsetY,
                Animated.call(
                  [this.postBottomY, this.props.offsetY],
                  this.handleSetPostBottom
                )
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
                    [
                      Animated.call(
                        [
                          this.tapGestureState,
                          this.panX,
                          this.panY,
                          this.focusTypeValue,
                          this.focusedBlockValue,
                          this.keyboardHeightValue
                        ],
                        this.handleTapBackground
                      )
                    ]
                  )
                ])
              )
            ])}
          />
        )}

        <View style={this.postContainerStyle}>
          <PostPreview
            bounds={bounds}
            blocks={post.blocks}
            positions={post.positions}
            paddingTop={this.props.paddingTop}
            paddingBottom={FOOTER_HEIGHT}
            inlineNodes={this.props.inlineNodes}
            focusedBlockId={this.state.focusedBlockId}
            onLayoutBlock={this.handleUpdateBlockFrame}
            topInsetValue={this.topInsetValue}
            layout={post.layout}
            simultaneousHandlers={this.props.simultaneousHandlers}
            focusTypeValue={this.focusTypeValue}
            isFocused={this.props.isFocused}
            minX={bounds.x}
            onTapBlock={this.handleTapBlock}
            positionsKey={_getPositionsKey(post.positions)}
            offsetY={this.props.offsetY}
            minY={bounds.y}
            contentViewRef={this.contentViewRef}
            onLayout={this.onContentLayout}
            setPostBottom={this.handleSetPostBottom}
            backgroundColor={post.backgroundColor || "#000"}
            focusedBlockValue={this.focusedBlockValue}
            bottomY={this.postBottomY}
            onTapBackground={this.onTapBackground}
            scrollY={this.props.scrollY}
            ref={this.scrollRef}
            maxX={bounds.width}
            scrollEnabled
            onFocus={this.handleFocusBlock}
            onOpenImagePicker={this.handleOpenImagePicker}
            onChangePhoto={this.handleChangeImageBlockPhoto}
            onAction={this.handleBlockAction}
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
              <EditableNodeList
                inlineNodes={this.props.inlineNodes}
                format={post.format}
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
                keyboardVisibleValue={this.keyboardVisibleValue}
                keyboardHeightValue={this.relativeKeyboardHeightValue}
                animatedKeyboardVisibleValue={this.animatedKeyboardVisibleValue}
                keyboardHeight={this.props.keyboardHeight}
                waitFor={this.postPreviewHandlers}
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
              {this.state.focusType === FocusType.panning &&
                this.focusedNode?.block?.frame && (
                  <SnapGuides
                    blocks={this.props.post.blocks}
                    block={this.focusedNode?.block}
                    positions={this.props.post.positions}
                    snapPoint={snapPoint}
                    currentScale={this.currentScale}
                    x={this.panX}
                    focusTypeValue={this.focusTypeValue}
                    y={this.panY}
                    onChange={this.handleChangeSnapPoint}
                  />
                )}
            </Layer>
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
              onChangeLayout={this.props.onChangeLayout}
              layout={this.props.post.layout}
            ></ActiveLayer>
          </Layer>
        </View>

        {this.focusedBlock?.type !== "image" && (
          <TextInputToolbar
            nativeID="new-post-input"
            onChooseTemplate={this.handleChangeTemplate}
            block={this.focusedBlock}
            onChangeOverrides={this.handleChangeOverrides}
            focusType={this.state.focusType}
            onChangeBorderType={this.handleChangeBorderType}
          />
        )}
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
