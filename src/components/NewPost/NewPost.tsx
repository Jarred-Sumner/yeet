import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import { Dimensions, View, StyleSheet, StatusBar } from "react-native";
import { Transition, Transitioning } from "react-native-reanimated";
import { resizeImage } from "../../lib/imageResize";
import { ImageCropper } from "./ImageCropper";
import { ImagePicker } from "./ImagePicker";
import {
  NewPostType,
  buildImageBlock,
  PostFormat,
  DEFAULT_FORMAT,
  POST_WIDTH,
  presetsByFormat,
  buildPost,
  MAX_POST_HEIGHT
} from "./NewPostFormat";
import { PostEditor, HEADER_HEIGHT } from "./PostEditor";
import { PixelRatio } from "react-native";
import { SPACING, COLORS } from "../../lib/styles";
import { SemiBoldText } from "../Text";
import { IconButton } from "../Button";
import { IconBack } from "../Icon";
import { SafeAreaView } from "react-navigation";
import { getInset } from "react-native-safe-area-view";
import DeviceInfo from "react-native-device-info";
import { calculateAspectRatioFit } from "../../lib/imageResize";
import FormatPicker from "./FormatPicker";
import {
  YeetImageContainer,
  imageContainerFromCameraRoll,
  getSourceDimensions,
  YeetImageRect
} from "../../lib/imageSearch";

const IS_SIMULATOR = DeviceInfo.isEmulator();

const TOP_Y = getInset("top");
const BOTTOM_Y = getInset("bottom");

const SCREEN_DIMENSIONS = Dimensions.get("window");

enum NewPostStep {
  choosePhoto = "choosePhoto",
  resizePhoto = "resizePhoto",
  editPhoto = "editPhoto"
}

type State = {
  post: NewPostType;
  defaultPhoto: YeetImageContainer | null;
  step: NewPostStep;
};

const DEFAULT_PHOTO_FIXTURE = imageContainerFromCameraRoll({
  node: {
    image: {
      uri: "https://i.imgur.com/CopIMxf.jpg",
      filename: "CopIMxf.jpg",
      height: 2436,
      width: 1125
    }
  }
});

const DEFAULT_POST_FIXTURE = {
  format: "caption",
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
      value: null,
      config: {
        dimensions: {}
      }
    }
  ]
};

const DEVELOPMENT_POST_FIXTURE = {
  format: "caption",
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
      value: {
        id: "iDshRoUFkNZ0fvIq26",
        source: {
          type: "gif",
          id: "iDshRoUFkNZ0fvIq26",
          slug: "hearing-ayanna-pressley-iDshRoUFkNZ0fvIq26",
          url:
            "https://giphy.com/gifs/hearing-ayanna-pressley-iDshRoUFkNZ0fvIq26",
          bitly_gif_url: "https://gph.is/g/aRmpbgw",
          bitly_url: "https://gph.is/g/aRmpbgw",
          embed_url: "https://giphy.com/embed/iDshRoUFkNZ0fvIq26",
          username: "",
          source:
            "https://www.c-span.org/video/?462505-1/hearing-border-child-separation-policy",
          rating: "g",
          content_url: "",
          source_tld: "www.c-span.org",
          source_post_url:
            "https://www.c-span.org/video/?462505-1/hearing-border-child-separation-policy",
          is_sticker: 0,
          import_datetime: "2019-07-12 23:02:58",
          trending_datetime: "0000-00-00 00:00:00",
          images: {
            fixed_height_still: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200_s.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200_s.gif",
              width: "297",
              height: "200",
              size: "27766"
            },
            original_still: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy_s.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy_s.gif",
              width: "480",
              height: "323",
              size: "105547"
            },
            fixed_width: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200w.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200w.gif",
              width: "200",
              height: "135",
              size: "219154",
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200w.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200w.mp4",
              mp4_size: "34264",
              webp:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200w.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200w.webp",
              webp_size: "140754"
            },
            fixed_height_small_still: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100_s.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100_s.gif",
              width: "149",
              height: "100",
              size: "9800"
            },
            fixed_height_downsampled: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200_d.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200_d.gif",
              width: "297",
              height: "200",
              size: "162407",
              webp:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200_d.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200_d.webp",
              webp_size: "106644"
            },
            preview: {
              width: "238",
              height: "160",
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy-preview.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy-preview.mp4",
              mp4_size: "24816"
            },
            fixed_height_small: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100.gif",
              width: "149",
              height: "100",
              size: "145135",
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100.mp4",
              mp4_size: "20713",
              webp:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100.webp",
              webp_size: "87986"
            },
            downsized_still: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy_s.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy_s.gif",
              width: "480",
              height: "323",
              size: "105547"
            },
            downsized: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.gif",
              width: "480",
              height: "323",
              size: "1264781"
            },
            downsized_large: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.gif",
              width: "480",
              height: "323",
              size: "1264781"
            },
            fixed_width_small_still: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100w_s.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100w_s.gif",
              width: "100",
              height: "68",
              size: "5084"
            },
            preview_webp: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy-preview.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy-preview.webp",
              width: "152",
              height: "102",
              size: "43726"
            },
            fixed_width_still: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200w_s.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200w_s.gif",
              width: "200",
              height: "135",
              size: "17911"
            },
            fixed_width_small: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100w.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100w.gif",
              width: "100",
              height: "68",
              size: "70674",
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100w.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100w.mp4",
              mp4_size: "11314",
              webp:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100w.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100w.webp",
              webp_size: "48706"
            },
            downsized_small: {
              width: "480",
              height: "322",
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy-downsized-small.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy-downsized-small.mp4",
              mp4_size: "199558"
            },
            fixed_width_downsampled: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200w_d.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200w_d.gif",
              width: "200",
              height: "135",
              size: "80644",
              webp:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200w_d.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200w_d.webp",
              webp_size: "57074"
            },
            downsized_medium: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.gif",
              width: "480",
              height: "323",
              size: "1264781"
            },
            original: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.gif",
              width: "480",
              height: "323",
              size: "1264781",
              frames: "20",
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.mp4",
              mp4_size: "165735",
              webp:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.webp",
              webp_size: "501698",
              hash: "50b5e1f3a933069e411422a88cfc14dc"
            },
            fixed_height: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200.gif",
              width: "297",
              height: "200",
              size: "439100",
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200.mp4",
              mp4_size: "67882",
              webp:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/200.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=200.webp",
              webp_size: "255358"
            },
            looping: {
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy-loop.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy-loop.mp4",
              mp4_size: "1877248"
            },
            original_mp4: {
              width: "480",
              height: "322",
              mp4:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy.mp4?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.mp4",
              mp4_size: "165735"
            },
            preview_gif: {
              url:
                "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/giphy-preview.gif?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy-preview.gif",
              width: "98",
              height: "66",
              size: "49041"
            },
            "480w_still": {
              url:
                "https://media2.giphy.com/media/iDshRoUFkNZ0fvIq26/480w_s.jpg?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=480w_s.jpg",
              width: "480",
              height: "323"
            }
          },
          title: "ayanna pressley not today GIF",
          analytics: {
            onload: {
              url:
                "https://giphy-analytics.giphy.com/simple_analytics?response_id=ba4dc10f195bb0383ee9a530402e34e60ca845da&event_type=GIF_TRENDING&gif_id=iDshRoUFkNZ0fvIq26&action_type=SEEN"
            },
            onclick: {
              url:
                "https://giphy-analytics.giphy.com/simple_analytics?response_id=ba4dc10f195bb0383ee9a530402e34e60ca845da&event_type=GIF_TRENDING&gif_id=iDshRoUFkNZ0fvIq26&action_type=CLICK"
            },
            onsent: {
              url:
                "https://giphy-analytics.giphy.com/simple_analytics?response_id=ba4dc10f195bb0383ee9a530402e34e60ca845da&event_type=GIF_TRENDING&gif_id=iDshRoUFkNZ0fvIq26&action_type=SENT"
            }
          }
        },
        preview: {
          uri:
            "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100.webp",
          width: 149,
          height: 100,
          duration: 0,
          mimeType: "image/webp",
          source: "giphy",
          asset: {
            uri:
              "https://media3.giphy.com/media/iDshRoUFkNZ0fvIq26/100.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=100.webp",
            width: 149,
            height: 100
          },
          transform: []
        },
        image: {
          uri:
            "https://media.giphy.com/media/35MAdPmdmRO3oCmWN0/giphy.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.webp",
          width: 480,
          height: 323,
          duration: 1,
          mimeType: "image/webp",
          source: "giphy",
          asset: {
            uri:
              "https://media.giphy.com/media/35MAdPmdmRO3oCmWN0/giphy.webp?cid=f94a7808ba4dc10f195bb0383ee9a530402e34e60ca845da&rid=giphy.webp",
            width: 480,
            height: 323
          },
          transform: []
        },
        sourceType: "giphy"
      },
      config: {
        dimensions: {
          width: 414,
          height: 278.58750000000003,
          x: 0,
          y: 0,
          maxX: 414,
          maxY: 278.58750000000003
        }
      }
    }
  ]
};

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

export class NewPost extends React.Component<{}, State> {
  state = {
    post: DEVELOPMENT_POST_FIXTURE,
    defaultPhoto: DEFAULT_PHOTO_FIXTURE,
    bounds: {
      x: 0,
      y: TOP_Y + SPACING.double + 30,
      height:
        SCREEN_DIMENSIONS.height - (TOP_Y + SPACING.double + 30) + BOTTOM_Y,
      width: SCREEN_DIMENSIONS.width
    },
    step: NewPostStep.editPhoto
  };

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
    this.setState({
      post: buildPost({ format, blocks: this.state.post.blocks })
    });

    this.stepContainerRef.current.animateNextTransition();
  };

  handleBackToChoosePhoto = () => {
    this.setState({ step: NewPostStep.choosePhoto });
    this.stepContainerRef.current.animateNextTransition();
  };

  handleBack = () => {
    const { step } = this.state;

    if (step === NewPostStep.choosePhoto) {
    } else if (step === NewPostStep.editPhoto) {
      this.setState({ step: NewPostStep.resizePhoto });
    } else if (step === NewPostStep.resizePhoto) {
      this.setState({ step: NewPostStep.choosePhoto });
    }
  };

  stepContainerRef = React.createRef();

  render() {
    const { step } = this.state;
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
      </View>
    );
  }

  renderStep() {
    const { step } = this.state;
    console.log(JSON.stringify(this.state.post));

    if (step === NewPostStep.editPhoto) {
      return (
        <PostEditor
          bounds={this.state.bounds}
          post={this.state.post}
          key={this.state.post.format}
          onBack={this.handleBack}
          navigation={this.props.navigation}
          onChange={this.handleChangePost}
          onChangeFormat={this.handleChangeFormat}
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
