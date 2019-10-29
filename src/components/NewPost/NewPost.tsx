import hoistNonReactStatics from "hoist-non-react-statics";
import { isEmpty, omitBy } from "lodash";
import * as React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { Transition, Transitioning } from "react-native-reanimated";
import { withNavigation } from "react-navigation";
import {
  BOTTOM_Y,
  IS_DEVELOPMENT,
  SCREEN_DIMENSIONS,
  TOP_Y
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
import {
  buildImageBlock,
  buildPost,
  DEFAULT_FORMAT,
  DEFAULT_POST_FORMAT,
  MAX_POST_HEIGHT,
  NewPostType,
  PostFormat,
  POST_WIDTH,
  CAROUSEL_HEIGHT
} from "./NewPostFormat";
import { EditableNodeMap } from "./Node/BaseNode";
import { HEADER_HEIGHT, PostEditor } from "./PostEditor";
import { PostHeader } from "./PostHeader";

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
    flex: 1,
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
  y: 0,
  height: SCREEN_DIMENSIONS.height,
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
    const { step, showUploader, uploadData, inlineNodes } = this.state;
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
          style={{ width: POST_WIDTH, flex: 1 }}
        >
          <PostEditor
            bounds={this.state.bounds}
            post={this.state.post}
            key={this.state.post.format}
            onBack={this.handleBack}
            yInset={CAROUSEL_HEIGHT}
            navigation={this.props.navigation}
            onChange={this.handleChangePost}
            isReply={!this.props.threadId}
            content
            onChangeFormat={this.handleChangeFormat}
            inlineNodes={inlineNodes}
            onChangeNodes={this.handleChangeNodes}
            onSubmit={this.handleCreatePost}
          />
        </Transitioning.View>

        {showUploader && (
          <PostUploader
            {...uploadData}
            ref={this.postUploaderRef}
            width={SCREEN_DIMENSIONS.width}
            height={SCREEN_DIMENSIONS.height}
            onUpload={this.handleUploadComplete}
          />
        )}

        <PostHeader
          defaultFormat={this.state.post.format}
          onChangeFormat={this.handleChangeFormat}
        />
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
}

export const NewPost = hoistNonReactStatics(
  withNavigation(RawNewPost),
  RawNewPost
);
export default NewPost;
