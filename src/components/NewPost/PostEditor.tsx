import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  PixelRatio,
  StyleSheet,
  View
} from "react-native";
import DeviceInfo from "react-native-device-info";
import {
  BaseButton,
  ScrollView,
  State as GestureState,
  TapGestureHandler,
  TextInput
} from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import PhotoEditor from "react-native-photo-manipulator";
import Animated from "react-native-reanimated";
import { getInset } from "react-native-safe-area-view";
import { captureRef } from "react-native-view-shot";
import { NavigationEvents } from "react-navigation";
import tinycolor from "tinycolor2";
import { SPACING } from "../../lib/styles";
import { AnimatedKeyboardTracker } from "../AnimatedKeyboardTracker";
import { EditorFooter } from "./EditorFooter";
import { ImagePickerRoute } from "./ImagePicker";
import { TextLayer } from "./layers/TextLayer";
import { getCommand } from "../../lib/transformsToFFMPEG";
import { startExport } from "../../lib/Exporter";
import { throttle } from "lodash";
import {
  buildTextBlock,
  FocusBlockType,
  isPlaceholderImageBlock,
  MAX_POST_HEIGHT,
  PostBlockType,
  PostFormat,
  POST_WIDTH,
  presetsByFormat,
  buildImageBlock,
  minImageWidthByFormat
} from "./NewPostFormat";
import {
  buildEditableNode,
  EditableNode,
  EditableNodeMap
} from "./Node/BaseNode";
import { EditableNodeList, PostPreview } from "./PostPreview";
import Toolbar, {
  DEFAULT_TOOLBAR_BUTTON_TYPE,
  ToolbarButtonType
} from "./Toolbar";
import { YeetImageContainer, YeetImageRect } from "../../lib/imageSearch";

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

type State = {
  activeButton: ToolbarButtonType;
  inlineNodes: EditableNodeMap;
  focusedBlockId: string | null;
  focusType: FocusBlockType | null;
  isSaving: boolean;
};

// https://media.giphy.com/media/jQS9YkJXofyeI/giphy.gif
const IMAGE_NODE_FIXTUER = {
  block: {
    type: "image",
    id: "rxGYrJd5XMCfJCPkdVgb0",
    format: "sticker",
    autoInserted: false,
    required: true,
    value: {
      id: "65OP280inML06GeRnJ",
      source: {
        type: "gif",
        id: "65OP280inML06GeRnJ",
        slug: "65OP280inML06GeRnJ",
        url: "https://giphy.com/gifs/65OP280inML06GeRnJ",
        bitly_gif_url: "https://gph.is/g/aQNmg5x",
        bitly_url: "https://gph.is/g/aQNmg5x",
        embed_url: "https://giphy.com/embed/65OP280inML06GeRnJ",
        username: "",
        source: "https://www.reddit.com/r/gifs/comments/ccpzd8/mesmerized/",
        rating: "g",
        content_url: "",
        source_tld: "www.reddit.com",
        source_post_url:
          "https://www.reddit.com/r/gifs/comments/ccpzd8/mesmerized/",
        is_sticker: 0,
        import_datetime: "2019-07-14 06:18:00",
        trending_datetime: "2019-09-08 04:30:06",
        images: {
          fixed_height_still: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200_s.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200_s.gif",
            width: "161",
            height: "200",
            size: "14243"
          },
          original_still: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy_s.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy_s.gif",
            width: "320",
            height: "398",
            size: "63951"
          },
          fixed_width: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200w.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200w.gif",
            width: "200",
            height: "249",
            size: "1979118",
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200w.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200w.mp4",
            mp4_size: "522842",
            webp:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200w.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200w.webp",
            webp_size: "967118"
          },
          fixed_height_small_still: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/100_s.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100_s.gif",
            width: "81",
            height: "100",
            size: "5076"
          },
          fixed_height_downsampled: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200_d.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200_d.gif",
            width: "161",
            height: "200",
            size: "92533",
            webp:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200_d.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200_d.webp",
            webp_size: "56638"
          },
          preview: {
            width: "225",
            height: "280",
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy-preview.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy-preview.mp4",
            mp4_size: "33078"
          },
          fixed_height_small: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/100.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100.gif",
            width: "81",
            height: "100",
            size: "440386",
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/100.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100.mp4",
            mp4_size: "116001",
            webp:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/100.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100.webp",
            webp_size: "249056"
          },
          downsized_still: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy-downsized_s.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy-downsized_s.gif",
            width: "320",
            height: "398",
            size: "47679"
          },
          downsized: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy-downsized.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy-downsized.gif",
            width: "320",
            height: "398",
            size: "1891360"
          },
          downsized_large: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy.gif",
            width: "320",
            height: "398",
            size: "6319733"
          },
          fixed_width_small_still: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/100w_s.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100w_s.gif",
            width: "100",
            height: "125",
            size: "7379"
          },
          preview_webp: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy-preview.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy-preview.webp",
            width: "104",
            height: "130",
            size: "36250"
          },
          fixed_width_still: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200w_s.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200w_s.gif",
            width: "200",
            height: "249",
            size: "20498"
          },
          fixed_width_small: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/100w.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100w.gif",
            width: "100",
            height: "125",
            size: "638419",
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/100w.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100w.mp4",
            mp4_size: "45547",
            webp:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/100w.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100w.webp",
            webp_size: "345986"
          },
          downsized_small: {
            width: "141",
            height: "176",
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy-downsized-small.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy-downsized-small.mp4",
            mp4_size: "137032"
          },
          fixed_width_downsampled: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200w_d.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200w_d.gif",
            width: "200",
            height: "249",
            size: "135514",
            webp:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200w_d.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200w_d.webp",
            webp_size: "83762"
          },
          downsized_medium: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy-downsized-medium.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy-downsized-medium.gif",
            width: "320",
            height: "398",
            size: "4107337"
          },
          original: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy.gif",
            width: "320",
            height: "398",
            size: "6319733",
            frames: "99",
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy.mp4",
            mp4_size: "1005430",
            webp:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy.webp",
            webp_size: "1858058",
            hash: "dfb8892959e75a4950b48c407cc8c770"
          },
          fixed_height: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200.gif",
            width: "161",
            height: "200",
            size: "1375517",
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200.mp4",
            mp4_size: "359036",
            webp:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/200.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=200.webp",
            webp_size: "709256"
          },
          looping: {
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy-loop.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy-loop.mp4",
            mp4_size: "2054256"
          },
          original_mp4: {
            width: "320",
            height: "398",
            mp4:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy.mp4?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy.mp4",
            mp4_size: "1005430"
          },
          preview_gif: {
            url:
              "https://media3.giphy.com/media/65OP280inML06GeRnJ/giphy-preview.gif?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy-preview.gif",
            width: "61",
            height: "76",
            size: "47496"
          },
          "480w_still": {
            url:
              "https://media2.giphy.com/media/65OP280inML06GeRnJ/480w_s.jpg?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=480w_s.jpg",
            width: "480",
            height: "597"
          }
        },
        title: "cat face GIF",
        analytics: {
          onload: {
            url:
              "https://giphy-analytics.giphy.com/simple_analytics?response_id=463f08155a3bf7c971e49ba7b36d47926e4874fb&event_type=GIF_TRENDING&gif_id=65OP280inML06GeRnJ&action_type=SEEN"
          },
          onclick: {
            url:
              "https://giphy-analytics.giphy.com/simple_analytics?response_id=463f08155a3bf7c971e49ba7b36d47926e4874fb&event_type=GIF_TRENDING&gif_id=65OP280inML06GeRnJ&action_type=CLICK"
          },
          onsent: {
            url:
              "https://giphy-analytics.giphy.com/simple_analytics?response_id=463f08155a3bf7c971e49ba7b36d47926e4874fb&event_type=GIF_TRENDING&gif_id=65OP280inML06GeRnJ&action_type=SENT"
          }
        }
      },
      preview: {
        uri:
          "https://media3.giphy.com/media/65OP280inML06GeRnJ/100.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100.webp",
        width: 81,
        height: 100,
        duration: 0,
        mimeType: "image/webp",
        source: "giphy",
        asset: {
          uri:
            "https://media3.giphy.com/media/65OP280inML06GeRnJ/100.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=100.webp",
          width: 81,
          height: 100
        },
        transform: []
      },
      image: {
        uri:
          "https://media3.giphy.com/media/l1J9IzyMGr7lAniLK/giphy.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy.webp",
        width: 320,
        height: 398,
        duration: 1,
        mimeType: "image/webp",
        source: "giphy",
        asset: {
          uri:
            "https://media3.giphy.com/media/l1J9IzyMGr7lAniLK/giphy.webp?cid=f94a7808463f08155a3bf7c971e49ba7b36d47926e4874fb&rid=giphy.webp",
          width: 320,
          height: 398
        },
        transform: []
      },
      sourceType: "giphy"
    },
    config: {
      dimensions: {
        width: 100,
        height: 124.375,
        x: 0,
        y: 0,
        maxX: 100,
        maxY: 124.375
      }
    }
  },
  position: {
    x: 25,
    y: 480.8125,
    scale: 4.2,
    rotate: 0.48
  }
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
      this.state.inlineNodes.set(IMAGE_NODE_FIXTUER.block.id, {
        ...IMAGE_NODE_FIXTUER,
        position: {
          ...IMAGE_NODE_FIXTUER.position,
          animatedX: new Animated.Value(IMAGE_NODE_FIXTUER.position.x),
          animatedY: new Animated.Value(IMAGE_NODE_FIXTUER.position.y),
          animatedRotate: new Animated.Value(
            IMAGE_NODE_FIXTUER.position.rotate
          ),
          animatedScale: new Animated.Value(IMAGE_NODE_FIXTUER.position.scale)
        }
      });
    }
  }

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

    if (this._blockInputRefs.has(id)) {
      this._blockInputRefs.delete(id);
    }

    if (this.state.focusedBlockId === id) {
      this.setState({ focusedBlockId: null, focusType: null });
      this.focusedBlockValue.setValue(-1);
      this.focusTypeValue.setValue(-1);
    }
  };

  handlePressToolbarButton = activeButton => {
    console.warn({ activeButton });
    if (activeButton === ToolbarButtonType.photo) {
      this.handleInsertPhoto();
    } else {
      this.setState({ activeButton });
    }
  };

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
    this._blockInputRefs.set(block.id, React.createRef());
    this.focusTypeValue.setValue(FocusBlockType.absolute);
    this.focusedBlockValue.setValue(block.id.hashCode());
    this.setState({
      focusedBlockId: block.id,
      focusType: FocusBlockType.absolute
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
          focusType: FocusBlockType.absolute
        });
        this.focusedBlockValue.setValue(node.block.id.hashCode());
        this.focusTypeValue.setValue(FocusBlockType.absolute);
      }
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
    const focusType = this.state.inlineNodes.has(block.id)
      ? FocusBlockType.absolute
      : FocusBlockType.static;
    this.setState({
      focusedBlockId: block.id,
      focusType
    });

    this.focusedBlockValue.setValue(block.id.hashCode());
    this.focusTypeValue.setValue(focusType);
  };

  handleDownload = () => {
    this.createSnapshot();
  };
  handleSend = () => {};

  createSnapshot = async () => {
    // this._inlineNodeRefs.entries().map([]);
    // const overlayURI = await captureRef(this.nodeListRef.current, {
    //   format: "png",
    //   quality: 1.0
    // });
    return startExport(
      this.props.post.blocks,
      this.state.inlineNodes,
      this._blockInputRefs,
      this.scrollRef,
      this._inlineNodeRefs
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
  keyboardVisibleValue = new Animated.Value(0);
  focusedBlockValue = new Animated.Value(-1);
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
      this.focusedBlockValue.setValue(-1);
      this.focusTypeValue.setValue(-1);
    }
  };

  updateBounds = ({
    nativeEvent: {
      layout: { x, y, width, height }
    }
  }) => {
    this.setState({ bounds: { x, y: y, width, height } });
  };

  handleOpenImagePicker = (block, shouldAnimate = true) => {
    this.props.navigation.navigate("EditBlockPhoto", {
      blockId: block.id,
      post: this.props.post,
      initialRoute: ImagePickerRoute.camera,
      shouldAnimate,
      onChange: this.handleChangeImageBlockPhoto
    });
  };

  handleInsertPhoto = (block, shouldAnimate = false) => {
    this.props.navigation.push("InsertSticker", {
      blockId: block && block.id,
      post: this.props.post,
      initialRoute: ImagePickerRoute.internet,
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
    this.state.inlineNodes.set(block.id, editableNode);

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

  tapRef = React.createRef();
  allowBackgroundTap = false;
  setBackgroundTapIgnored = allowBackgroundTap => {
    this.allowBackgroundTap = allowBackgroundTap;
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
            onTapBackground={this.handleTapBackground}
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
          >
            <Layer
              flipY
              pointerEvents="box-none"
              zIndex={LayerZIndex.inlineNodes}
              width="100%"
              height="100%"
              opacity={this.controlsOpacityValue}
            >
              <DarkSheet
                opacity={Animated.cond(
                  Animated.eq(this.focusTypeValue, FocusBlockType.absolute),
                  this.keyboardVisibleValue,
                  0
                )}
              />
              <EditableNodeList
                inlineNodes={this.state.inlineNodes}
                setNodeRef={this.setNodeRef}
                focusedBlockId={this.state.focusedBlockId}
                focusedBlockValue={this.focusedBlockValue}
                setBlockInputRef={this.setBlockInputRef}
                focusTypeValue={this.focusTypeValue}
                keyboardVisibleValue={this.keyboardVisibleValue}
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
            </Layer>
          </PostPreview>

          <Layer
            zIndex={LayerZIndex.sheet}
            width={sizeStyle.width}
            isFrozen
            opacity={this.controlsOpacityValue}
            pointerEvents="none"
            width={sizeStyle.height}
          >
            <MiddleSheet width={sizeStyle.width} height={sizeStyle.height} />
          </Layer>

          <Layer
            isShown
            width={sizeStyle.width}
            height={sizeStyle.height}
            zIndex={LayerZIndex.icons}
          >
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
              isNodeFocused={this.state.focusType === FocusBlockType.absolute}
              activeButton={this.state.activeButton}
              keyboardVisibleValue={this.keyboardVisibleValue}
              focusTypeValue={this.focusTypeValue}
              nodeListRef={this.nodeListRef}
            ></TextLayer>
          </Layer>
        </Animated.View>
      </Animated.View>
    );
  }
}
