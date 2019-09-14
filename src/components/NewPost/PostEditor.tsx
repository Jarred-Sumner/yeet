import CameraRoll from "@react-native-community/cameraroll";
import { debounce } from "lodash";
import * as React from "react";
import { Dimensions, Keyboard, StyleSheet, View } from "react-native";
import DeviceInfo from "react-native-device-info";
import {
  ScrollView,
  State as GestureState,
  TextInput
} from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated from "react-native-reanimated";
import { getInset } from "react-native-safe-area-view";
import { NavigationEvents } from "react-navigation";
import tinycolor from "tinycolor2";
import { startExport } from "../../lib/Exporter";
import { YeetImageContainer, YeetImageRect } from "../../lib/imageSearch";
import { SPACING } from "../../lib/styles";
import { AnimatedKeyboardTracker } from "../AnimatedKeyboardTracker";
import { EditorFooter, isDeletePressed } from "./EditorFooter";
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
  presetsByFormat
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
import { sendLightFeedback } from "../../lib/Vibration";
import { sendToast, ToastType } from "../Toast";
import { connectActionSheet } from "@expo/react-native-action-sheet";

const { block, cond, set, eq, sub } = Animated;

const IS_SIMULATOR = DeviceInfo.isEmulator();
const TOP_Y = getInset("top");
const BOTTOM_Y = getInset("bottom");

const SCREEN_DIMENSIONS = Dimensions.get("window");

export const HEADER_HEIGHT = 30 + TOP_Y + SPACING.normal;

const styles = StyleSheet.create({
  safeWrapper: {
    paddingTop: TOP_Y,
    borderRadius: 12,
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

class RawwPostEditor extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      activeButton: DEFAULT_TOOLBAR_BUTTON_TYPE,
      focusedBlockId: null,
      focusType: null,
      isSaving: false
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

  handlePressToolbarButton = activeButton => {
    if (activeButton === ToolbarButtonType.photo) {
      this.handleInsertPhoto();
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
              placeholder: "Write something",
              autoInserted: false,
              required: false
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
      format: PostFormat.screenshot,
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
  keyboardVisibleValue = new Animated.Value<number>(0);
  focusedBlockValue = new Animated.Value<number>(-1);
  focusTypeValue = new Animated.Value<FocusType | -1>(-1);
  controlsOpacityValue = new Animated.Value(1);
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
    if (this.hasPlaceholderImageBlocks()) {
      this.openImagePickerForPlaceholder();
      return;
    }
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

    const node = this.props.inlineNodes[focusedBlockId];
    const block = node
      ? node.block
      : this.props.post.blocks.find(block => block.id === focusedBlockId);

    if (block && block.type === "text") {
      return ToolbarType.text;
    }

    return ToolbarType.default;
  }

  handlePan = ({
    blockId,
    isPanning,
    x,
    y
  }): { blockId: string; isPanning: boolean; x: number; y: number } => {
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

  scrollToTop = () =>
    this.scrollRef.current.getScrollResponder().scrollTo({
      y: presetsByFormat[this.props.post.format].paddingTop * -1,
      x: 0
    });

  handleShowKeyboard = (event, hasHappened) => {
    hasHappened && this.scrollRef.current.handleKeyboardEvent(event);

    if (this.state.focusType === FocusType.absolute) {
      this.scrollToTop();
    }
  };
  handleHideKeyboard = (event, hasHappened) => {
    // this.scrollRef.current.handleKeyboardEvent(event);
    hasHappened && this.scrollRef.current.resetKeyboardSpace();
  };
  handleChangeFrame = event => {
    this.scrollRef.current.handleKeyboardEvent(event);
  };

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
          onKeyboardShow={this.handleShowKeyboard}
          onKeyboardHide={this.handleHideKeyboard}
          onKeyboardWillChangeFrame={this.handleChangeFrame}
        />
        <Animated.Code
          exec={Animated.block([
            Animated.onChange(
              this.focusTypeValue,
              block([
                cond(
                  eq(this.focusTypeValue, FocusType.panning),

                  Animated.block([set(this.controlsOpacityValue, 1.0)])
                ),
                cond(
                  eq(this.focusTypeValue, FocusType.absolute),
                  set(this.controlsOpacityValue, 1.0)
                ),

                cond(eq(this.focusTypeValue, FocusType.static), [
                  set(
                    this.controlsOpacityValue,
                    sub(1.0, this.keyboardVisibleValue)
                  )
                ]),
                cond(eq(this.focusTypeValue, -1), [
                  set(this.controlsOpacityValue, 1.0)
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
            paddingTop={presets.paddingTop || 0}
            inlineNodes={this.props.inlineNodes}
            focusedBlockId={this.state.focusedBlockId}
            focusTypeValue={this.focusTypeValue}
            minX={bounds.x}
            onTapBlock={this.handleTapBlock}
            minY={bounds.y}
            contentViewRef={this.contentViewRef}
            backgroundColor={post.backgroundColor}
            focusedBlockValue={this.focusedBlockValue}
            onTapBackground={this.onTapBackground}
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
              opacity={this.controlsOpacityValue}
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
                focusTypeValue={this.focusTypeValue}
                keyboardVisibleValue={this.keyboardVisibleValue}
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
            pointerEvents="box-none"
          >
            <ActiveLayer
              onBack={this.handleBack}
              onSend={this.handleSend}
              onPressDownload={this.handleDownload}
              panX={this.panX}
              panY={this.panY}
              waitFor={[this.scrollRef, ...this._blockInputRefs.values()]}
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
              toolbarType={this.toolbarType}
              isNodeFocused={this.state.focusType === FocusType.absolute}
              activeButton={this.state.activeButton}
              keyboardVisibleValue={this.keyboardVisibleValue}
              focusTypeValue={this.focusTypeValue}
              nodeListRef={this.nodeListRef}
            ></ActiveLayer>
          </Layer>
        </Animated.View>
      </Animated.View>
    );
  }
}

export const PostEditor = connectActionSheet(RawwPostEditor);
export default PostEditor;
