import hoistNonReactStatics from "hoist-non-react-statics";
import { isEmpty, omitBy } from "lodash";
import * as React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { Transition, Transitioning } from "react-native-reanimated";
import { withNavigation } from "react-navigation";
import {
  BOTTOM_Y,
  SCREEN_DIMENSIONS,
  TOP_Y,
  IS_DEVELOPMENT
} from "../../../config";
import { ContentExport, ExportData } from "../../lib/Exporter";
import { resizeImage } from "../../lib/imageResize";
import {
  getSourceDimensions,
  YeetImageContainer,
  YeetImageRect
} from "../../lib/imageSearch";
import { COLORS, SPACING } from "../../lib/styles";
import { PostUploader, RawPostUploader } from "../PostUploader";
import { sendToast, ToastType } from "../Toast";
import FormatPicker from "./FormatPicker";
import { ImageCropper } from "./ImageCropper";
import { ImagePicker } from "./ImagePicker";
import {
  buildImageBlock,
  buildPost,
  DEFAULT_FORMAT,
  MAX_POST_HEIGHT,
  NewPostType,
  PostFormat,
  POST_WIDTH,
  DEFAULT_POST_FORMAT
} from "./NewPostFormat";
import { EditableNodeMap } from "./Node/BaseNode";
import { HEADER_HEIGHT, PostEditor } from "./PostEditor";

enum NewPostStep {
  choosePhoto = "choosePhoto",
  resizePhoto = "resizePhoto",
  editPhoto = "editPhoto"
}

type State = {
  post: NewPostType;
  defaultPhoto: YeetImageContainer | null;
  step: NewPostStep;
  inlineNodes: EditableNodeMap;
};

const DEFAULT_POST_FIXTURE = {
  [PostFormat.screenshot]: {
    format: PostFormat.screenshot,
    backgroundColor: "#fff",
    blocks: [
      {
        type: "image",
        id: "1231232",
        format: "screenshot",
        required: true,
        autoInserted: true,
        value: null,
        config: {
          dimensions: {}
        }
      }
    ]
  },
  [PostFormat.caption]: {
    format: PostFormat.canvas,
    backgroundColor: "#000",
    blocks: [
      {
        type: "text",
        id: "123123",
        format: "caption",
        value: "",
        autoInserted: true,
        config: { placeholder: "Enter a title", overrides: {} }
      },
      {
        type: "image",
        id: "1231232",
        format: "caption",
        required: true,
        autoInserted: true,
        value: null,
        config: {
          dimensions: {}
        }
      }
    ]
  },
  [PostFormat.canvas]: {
    format: PostFormat.canvas,
    backgroundColor: "#000",
    blocks: []
  }
};

// const DEVELOPMENT_POST_FIXTURE = {
//   format: "screenshot",
//   blocks: [
//     {
//       type: "image",
//       format: "screenshot",
//       dimensions: { width: 414, height: 552, x: 0, y: 0, maxX: 414, maxY: 552 },
//       id: "bmoRLK-ZMTsio5thJW5KT",
//       contentId: "ph://60863845-FF9C-4F04-A910-398D016B6384/L0/001",
//       viewTag: 803,
//       frame: { x: 0, y: 0, width: 414, height: 552 },
//       value: {
//         width: 768,
//         height: 1024,
//         source: "cameraRoll",
//         mimeType: "image/jpeg",
//         uri: "ph://60863845-FF9C-4F04-A910-398D016B6384/L0/001",
//         duration: 0
//       }
//     }
//   ],
//   nodes: [
//     {
//       block: {
//         type: "image",
//         format: "sticker",
//         dimensions: {
//           width: 310.5,
//           height: 172.638,
//           x: 0,
//           y: 0,
//           maxX: 310.5,
//           maxY: 172.638
//         },
//         id: "jUlqsRfWmT8OvTgrn0v2C",
//         contentId: "d3DiXTPbqh83K",
//         viewTag: 1379,
//         frame: { x: 15, y: 15, width: 310.5, height: 172.5 },
//         value: {
//           width: 500,
//           height: 278,
//           source: "giphy",
//           mimeType: "video/mp4",
//           uri:
//             "https://media0.giphy.com/media/d3DiXTPbqh83K/giphy.mp4?cid=f94a78089e09d52157b4b8b1ff9b2ecdba13c8fcbc47a708&rid=giphy.mp4",
//           duration: 1
//         }
//       },
//       frame: { x: 52.75, y: 322.6809997558594, width: 310.5, height: 172.5 },
//       viewTag: 1385,
//       position: { x: 52.75, rotate: 0, scale: 1, y: 322.681 }
//     }
//   ],
//   bounds: { x: 0, y: 0, width: 414, height: 754 }
// };

// const DEVELOPMENT_POST_FIXTURE = {
//   format: PostFormat.screenshot,
//   backgroundColor: "#000",
//   blocks: [
//     {
//       type: "text",
//       id: "123123",
//       format: "caption",
//       value: "",
//       autoInserted: true,
//       config: { placeholder: "Enter a title", overrides: {} }
//     },
//     {
//       type: "image",
//       id: "1231232",
//       format: "caption",
//       required: true,
//       value: {
//         id: "lszAB3TzFtRaU",
//         source: {
//           type: "gif",
//           id: "lszAB3TzFtRaU",
//           slug: "will-ferrell-lszAB3TzFtRaU",
//           url: "https://giphy.com/gifs/will-ferrell-lszAB3TzFtRaU",
//           bitly_gif_url: "https://gph.is/2bZxV6R",
//           bitly_url: "https://gph.is/2bZxV6R",
//           embed_url: "https://giphy.com/embed/lszAB3TzFtRaU",
//           username: "",
//           source:
//             "https://popkey.co/m/mv3Ra-lol-will+ferrell-lolz-anchorman-guy-dude",
//           rating: "g",
//           content_url: "",
//           source_tld: "popkey.co",
//           source_post_url:
//             "https://popkey.co/m/mv3Ra-lol-will+ferrell-lolz-anchorman-guy-dude",
//           is_sticker: 0,
//           import_datetime: "2016-09-04 10:03:33",
//           trending_datetime: "2019-09-08 04:15:11",
//           images: {
//             fixed_height_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200_s.gif",
//               width: "266",
//               height: "200"
//             },
//             original_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy_s.gif",
//               width: "346",
//               height: "260"
//             },
//             fixed_width: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w.gif",
//               width: "200",
//               height: "150",
//               size: "758500",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w.mp4",
//               mp4_size: "40858",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w.webp",
//               webp_size: "411146"
//             },
//             fixed_height_small_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100_s.gif",
//               width: "133",
//               height: "100"
//             },
//             fixed_height_downsampled: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200_d.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200_d.gif",
//               width: "266",
//               height: "200",
//               size: "120489",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200_d.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200_d.webp",
//               webp_size: "57838"
//             },
//             preview: {
//               width: "268",
//               height: "200",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-preview.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-preview.mp4",
//               mp4_size: "27705"
//             },
//             fixed_height_small: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.gif",
//               width: "133",
//               height: "100",
//               size: "377998",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.mp4",
//               mp4_size: "24727",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.webp",
//               webp_size: "234746"
//             },
//             downsized_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-downsized_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-downsized_s.gif",
//               width: "346",
//               height: "260",
//               size: "30060"
//             },
//             downsized: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-downsized.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-downsized.gif",
//               width: "346",
//               height: "260",
//               size: "1946739"
//             },
//             downsized_large: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.gif",
//               width: "346",
//               height: "260",
//               size: "1946739"
//             },
//             fixed_width_small_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100w_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100w_s.gif",
//               width: "100",
//               height: "75"
//             },
//             preview_webp: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-preview.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-preview.webp",
//               width: "196",
//               height: "147",
//               size: "49116"
//             },
//             fixed_width_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w_s.gif",
//               width: "200",
//               height: "150"
//             },
//             fixed_width_small: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100w.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100w.gif",
//               width: "100",
//               height: "75",
//               size: "224250",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100w.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100w.mp4",
//               mp4_size: "17481",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100w.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100w.webp",
//               webp_size: "156146"
//             },
//             downsized_small: {
//               width: "346",
//               height: "260",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-downsized-small.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-downsized-small.mp4",
//               mp4_size: "160111"
//             },
//             fixed_width_downsampled: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w_d.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w_d.gif",
//               width: "200",
//               height: "150",
//               size: "68808",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w_d.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w_d.webp",
//               webp_size: "34312"
//             },
//             downsized_medium: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.gif",
//               width: "346",
//               height: "260",
//               size: "1946739"
//             },
//             original: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.gif",
//               width: "346",
//               height: "260",
//               size: "1946739",
//               frames: "73",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.mp4",
//               mp4_size: "155509",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.webp",
//               webp_size: "1254730"
//             },
//             fixed_height: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200.gif",
//               width: "266",
//               height: "200",
//               size: "1376195",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200.mp4",
//               mp4_size: "57453",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200.webp",
//               webp_size: "695024"
//             },
//             looping: {
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-loop.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-loop.mp4",
//               mp4_size: "890785"
//             },
//             original_mp4: {
//               width: "480",
//               height: "360",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.mp4",
//               mp4_size: "155509"
//             },
//             preview_gif: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-preview.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-preview.gif",
//               width: "124",
//               height: "93",
//               size: "49737"
//             },
//             "480w_still": {
//               url:
//                 "https://media2.giphy.com/media/lszAB3TzFtRaU/480w_s.jpg?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=480w_s.jpg",
//               width: "480",
//               height: "361"
//             }
//           },
//           title: "will ferrell lol GIF",
//           analytics: {
//             onload: {
//               url:
//                 "https://giphy-analytics.giphy.com/simple_analytics?response_id=4d7bf768c02b4a884a251f8f8c97989ab85fd37e&event_type=GIF_TRENDING&gif_id=lszAB3TzFtRaU&action_type=SEEN"
//             },
//             onclick: {
//               url:
//                 "https://giphy-analytics.giphy.com/simple_analytics?response_id=4d7bf768c02b4a884a251f8f8c97989ab85fd37e&event_type=GIF_TRENDING&gif_id=lszAB3TzFtRaU&action_type=CLICK"
//             },
//             onsent: {
//               url:
//                 "https://giphy-analytics.giphy.com/simple_analytics?response_id=4d7bf768c02b4a884a251f8f8c97989ab85fd37e&event_type=GIF_TRENDING&gif_id=lszAB3TzFtRaU&action_type=SENT"
//             }
//           }
//         },
//         preview: {
//           uri:
//             "https://media3.giphy.com/media/lszAB3TzFtRaU/100.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.webp",
//           width: 133,
//           height: 100,
//           duration: 0,
//           mimeType: "image/webp",
//           source: "giphy",
//           asset: {
//             uri:
//               "https://media3.giphy.com/media/lszAB3TzFtRaU/100.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.webp",
//             width: 133,
//             height: 100
//           },
//           transform: []
//         },
//         image: {
//           uri:
//             "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.webp",
//           width: 346,
//           height: 260,
//           duration: 1,
//           mimeType: "image/webp",
//           source: "giphy",
//           asset: {
//             uri:
//               "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.webp",
//             width: 346,
//             height: 260
//           },
//           transform: []
//         },
//         sourceType: "giphy"
//       },
//       config: {
//         dimensions: {
//           width: 414,
//           height: 311.0982658959538,
//           x: 0,
//           y: 0,
//           maxX: 414,
//           maxY: 311.0982658959538
//         }
//       }
//     }
//   ]
// };

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 16,
    height: 30,
    textAlignVertical: "center",
    color: "#FFF"
  },

  page: {
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height,
    backgroundColor: "#000"
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

const DEVELOPMENT_STEP = NewPostStep.choosePhoto;

// const post = IS_DEVELOPMENT ? DEVELOPMENT_POST_FIXTURE : DEFAULT_POST_FIXTURE;
export const DEFAULT_POST =
  IS_DEVELOPMENT && typeof DEVELOPMENT_POST_FIXTURE !== "undefined"
    ? DEVELOPMENT_POST_FIXTURE
    : DEFAULT_POST_FIXTURE[DEFAULT_POST_FORMAT];

const DEFAULT_BOUNDS = {
  x: 0,
  y: TOP_Y + SPACING.double + 30,
  height: SCREEN_DIMENSIONS.height - (TOP_Y + SPACING.double + 30) + BOTTOM_Y,
  width: SCREEN_DIMENSIONS.width
};

class RawNewPost extends React.Component<{}, State> {
  static defaultProps = {
    defaultFormat: DEFAULT_POST.format,
    defaultBlocks: DEFAULT_POST.blocks,
    defaultInlineNodes: {},
    defaultBounds: DEFAULT_BOUNDS,
    threadId: null,
    thread: null
  };
  constructor(props) {
    super(props);

    this.state = {
      post: buildPost({
        width: props.defaultWidth,
        height: props.defaultHeight,
        blocks: props.defaultBlocks,
        format: props.defaultFormat
      }),
      defaultPhoto: null,
      inlineNodes: props.defaultInlineNodes,
      showUploader: false,
      uploadData: null,
      bounds: {
        ...props.defaultBounds,
        x: DEFAULT_BOUNDS.x,
        y: DEFAULT_BOUNDS.y
      },
      step: NewPostStep.editPhoto
    };
  }

  handleChangePost = post => this.setState({ post });

  handleChoosePhoto = (photo: YeetImageContainer) => {
    this.setState({
      step: NewPostStep.resizePhoto,
      defaultPhoto: photo
    });
    this.stepContainerRef.current.animateNextTransition();
  };

  buildPostWithImage = (
    image: YeetImageContainer,
    dimensions: YeetImageRect
  ) => {
    const displayWidth = Math.min(POST_WIDTH, image.image.width);
    let { width: sourceWidth } = getSourceDimensions(image);

    const displaySize = {
      width: displayWidth,
      height: image.image.height * (displayWidth / sourceWidth)
    };

    return buildPost({
      format: DEFAULT_FORMAT,
      width: displaySize.width,
      height: displaySize.height,
      blocks: [
        buildImageBlock({
          image,
          dimensions,
          autoInserted: true,
          format: DEFAULT_FORMAT,
          width: displaySize.width,
          height: displaySize.height,
          required: true
        })
      ]
    });
  };

  handleEditPhoto = async ({ top, bottom, height, width, x }) => {
    const image = this.state.defaultPhoto;

    const [croppedPhoto, dimensions] = await resizeImage({
      image,
      top,
      bottom,
      height,
      x,
      width
    });

    this.setState({
      step: NewPostStep.editPhoto,
      croppedPhoto,
      post: this.buildPostWithImage(croppedPhoto, dimensions)
    });

    this.stepContainerRef.current.animateNextTransition();
  };

  handleChangeFormat = (format: PostFormat) => {
    if (
      this.state.post.blocks.length === 0 &&
      DEFAULT_POST_FIXTURE[format].blocks.length > 0
    ) {
      this.setState({
        post: DEFAULT_POST_FIXTURE[format]
      });
    } else {
      this.setState({
        post: buildPost({ format, blocks: this.state.post.blocks })
      });
    }

    this.stepContainerRef.current.animateNextTransition();
  };

  handleBackToChoosePhoto = () => {
    this.setState({ step: NewPostStep.choosePhoto });
    this.stepContainerRef.current.animateNextTransition();
  };

  handleBack = () => {
    this.props.navigation.navigate("FeedTab");
  };

  stepContainerRef = React.createRef();
  postUploaderRef = React.createRef<RawPostUploader>();

  render() {
    const { step, showUploader, uploadData } = this.state;
    const isHeaderFloating = step !== NewPostStep.editPhoto;
    return (
      <View style={styles.page}>
        <StatusBar hidden showHideTransition="slide" />

        <Transitioning.View
          ref={this.stepContainerRef}
          transition={
            <Transition.Together>
              <Transition.In type="fade" />
              <Transition.Out type="fade" />
            </Transition.Together>
          }
          style={{ width: POST_WIDTH, height: MAX_POST_HEIGHT }}
        >
          {this.renderStep()}
        </Transitioning.View>

        <FormatPicker
          defaultFormat={this.state.post.format}
          onChangeFormat={this.handleChangeFormat}
        />

        {showUploader && (
          <PostUploader
            {...uploadData}
            ref={this.postUploaderRef}
            width={SCREEN_DIMENSIONS.width}
            height={SCREEN_DIMENSIONS.height}
            onUpload={this.handleUploadComplete}
          />
        )}
      </View>
    );
  }

  handleChangeNodes = (inlineNodes: EditableNodeMap) => {
    this.setState({ inlineNodes: omitBy(inlineNodes, isEmpty) });
  };

  handleCreatePost = (_file: ContentExport, data: ExportData) => {
    const { colors, ...file } = _file;
    this.setState(
      {
        showUploader: true,
        uploadData: {
          file,
          data,
          colors
        }
      },
      () => {
        this.postUploaderRef.current.startUploading(true);
      }
    );
  };

  handleUploadComplete = async (mediaId: string) => {
    const post = await this.postUploaderRef.current.createPost(
      mediaId,
      this.state.uploadData.data.blocks,
      this.state.uploadData.data.nodes,
      this.state.post.format,
      this.state.uploadData.data.bounds,
      this.state.uploadData.colors,
      this.props.threadId
    );

    sendToast("Posted successfully", ToastType.success);
    this.setState({ showUploader: false, uploadData: null });
    this.props.onCreate && this.props.onCreate(post);
  };

  renderStep() {
    const { inlineNodes, step } = this.state;

    if (step === NewPostStep.editPhoto) {
      return (
        <PostEditor
          bounds={this.state.bounds}
          post={this.state.post}
          key={this.state.post.format}
          onBack={this.handleBack}
          navigation={this.props.navigation}
          onChange={this.handleChangePost}
          isReply={!this.props.threadId}
          onChangeFormat={this.handleChangeFormat}
          inlineNodes={inlineNodes}
          onChangeNodes={this.handleChangeNodes}
          onSubmit={this.handleCreatePost}
        />
      );
    } else if (step === NewPostStep.choosePhoto) {
      return (
        <ImagePicker
          height={SCREEN_DIMENSIONS.height}
          width={POST_WIDTH}
          onChange={this.handleChoosePhoto}
        />
      );
    } else if (step === NewPostStep.resizePhoto) {
      return (
        <View
          style={{ marginTop: HEADER_HEIGHT, flex: 1, position: "relative" }}
        >
          <ImageCropper
            photo={this.state.defaultPhoto}
            onDone={this.handleEditPhoto}
            onBack={this.handleBackToChoosePhoto}
          />
        </View>
      );
    } else {
      return null;
    }
  }
}

export const NewPost = hoistNonReactStatics(
  withNavigation(RawNewPost),
  RawNewPost
);
export default NewPost;
