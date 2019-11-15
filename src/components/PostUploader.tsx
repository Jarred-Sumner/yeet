import * as React from "react";
import S3Upload, { startFileUpload } from "../lib/fileUpload";
import { fromPairs, get } from "lodash";
import Animated, { Easing } from "react-native-reanimated";
import HapticFeedback from "react-native-haptic-feedback";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  PixelRatio,
  KeyboardAvoidingView
} from "react-native";
import { SemiBoldText, MediumText, Text } from "./Text";
import {
  ContentExport,
  ExportData,
  getMediaToUpload,
  ExportableYeetImage
} from "../lib/Exporter";
import { Mutation, useMutation, MutationFunction } from "react-apollo";
import SUBMIT_POST_MUTATION from "../lib/createPostMutation.graphql";
import CREATE_POST_THREAD_MUTATION from "../lib/createPostThreadMutation.graphql";
import ADD_ATTACHMENT_MUTATION from "../lib/addAttachmentMutation.graphql";
import path from "path";
import Bluebird from "bluebird";
import {
  CreatePost,
  CreatePost_createPost,
  CreatePostVariables
} from "../lib/graphql/CreatePost";
import {
  AddAttachmentMutation,
  AddAttachmentMutationVariables
} from "../lib/graphql/AddAttachmentMutation";
import { SPACING } from "../lib/styles";
import Modal from "./Modal";
import { runLoopAnimation } from "../lib/animations";
import { DimensionsRect } from "../lib/Rect";
import { PostFormat } from "./NewPost/NewPostFormat";
import {
  CreatePostThread,
  CreatePostThreadVariables,
  CreatePostThread_createPostThread
} from "../lib/graphql/CreatePostThread";
import { PostFragment } from "../lib/graphql/PostFragment";

enum UploadStatus {
  pending = "pending",
  startPresign = "startPresign",
  presignError = "presignError",
  uploadingFile = "uploadingFile",
  uploadComplete = "uploadComplete",
  uploadFileError = "uploadingFileError",
  submittingPost = "submittingPost"
}

type Props = {
  file: ContentExport;
  data: ExportData;
  submitPostThread: MutationFunction<
    CreatePostThread,
    CreatePostThreadVariables
  >;
  submitPost: MutationFunction<CreatePost, CreatePostVariables>;
  addAttachment: MutationFunction<
    AddAttachmentMutation,
    AddAttachmentMutationVariables
  >;

  width: number;
  height: number;
};

type State = {
  uploadStatus: UploadStatus;
  mediaId: string | null;
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SPACING.double,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center"
  },
  spinner: {
    marginBottom: 0
  },
  spinnerText: {
    fontSize: 72
  },
  spinnerTextTiny: {
    fontSize: 32,
    position: "relative",
    top: -8
  },
  words: {
    fontSize: 18,
    color: "white",
    flexDirection: "row"
  },
  small: {
    fontSize: 12
  },
  xdSoRandom: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  breadRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-evenly"
  },
  bread: {
    fontSize: 48,
    width: "100%"
  }
});

export class RawPostUploader extends React.Component<Props, State> {
  uploadProgressValue = new Animated.Value(this.props.width * -1);

  constructor(props: Props) {
    super(props);

    this.state = {
      uploadStatus: UploadStatus.pending,
      mediaId: null
    };
  }
  s3Upload: S3Upload | null = null;

  cancelRequests = () => {
    if (this.s3Upload) {
      this.canceled = true;
      this.s3Upload.abortUpload();
    }
  };

  componentWillUnmount() {
    this.willUnmount = true;
    this.cancelRequests();
  }

  handleUploadProgress = (percent, status) => {
    Animated.spring(this.uploadProgressValue, {
      toValue: (percent / 100) * this.props.width
    }).start();
  };

  uploadProgressClock = new Animated.Clock();

  uploadImage = (id: string, image: ExportableYeetImage, postId: string) => {
    return new Bluebird((resolve, reject) => {
      this._startUploading(
        true,
        {
          type: image.mimeType,
          uri: image.uri,
          width: image.width,
          height: image.height
        },
        ({ mediaId }) => {
          return this.props
            .addAttachment({
              variables: {
                mediaId,
                id: image.uri,
                postId
              }
            })
            .then(
              error => {
                resolve(mediaId);
                return Promise.resolve();
              },
              err => console.error(err)
            );
        },
        {
          contentId: id,
          type: "Media",
          contentType: image.mimeType,
          duration: image.duration || 0,
          postId
        }
      );
    });
  };

  createPost = ({
    mediaId,
    autoplaySeconds,
    blocks,
    nodes,
    format,
    bounds,
    colors,
    threadId
  }: {
    mediaId: string;
    blocks: Array<Object>;
    nodes: Array<Object>;
    format: PostFormat;
    autoplaySeconds: number;
    bounds: DimensionsRect;
    colors: any;
    threadId?: string;
  }): Promise<CreatePost_createPost> => {
    this.setState({ uploadStatus: UploadStatus.submittingPost });

    return this.props
      .submitPost({
        variables: {
          mediaId,
          blocks,
          nodes,
          format,
          autoplaySeconds,
          bounds,
          colors,
          threadId
        }
      })
      .then(
        ({ data: { createPost: post }, errors }) => {
          if (errors) {
            console.error(errors);
          }

          return Promise.resolve(
            this.handleSubmission(post, errors ? errors[0] : null)
          ).then(post => {
            console.log("HERE");
            return post;
          });
        },
        err => {
          console.log(err);
          return Promise.resolve(this.handleSubmission(null, err));
        }
      );
  };

  createPostThread = ({
    mediaId,
    blocks,
    nodes,
    body,
    format,
    bounds,
    autoplaySeconds,
    colors
  }: {
    mediaId: string;
    blocks: Array<Object>;
    nodes: Array<Object>;
    body: string;
    format: PostFormat;
    bounds: DimensionsRect;
    colors: any;
    autoplaySeconds: number;
  }): Promise<CreatePostThread_createPostThread> => {
    this.setState({ uploadStatus: UploadStatus.submittingPost });

    return this.props
      .submitPostThread({
        variables: {
          mediaId,
          body,
          blocks,
          nodes,
          format,
          autoplaySeconds,
          bounds,
          colors
        }
      })
      .then(
        ({ data: { createPostThread: thread }, errors }) => {
          const post = thread.posts.data[0];

          return Promise.resolve(
            this.handleSubmission(post, errors ? errors[0] : null)
          ).then(post => {
            console.log("HERE");
            return thread;
          });
        },
        err => {
          return this.handleSubmission(null, err);
        }
      );
  };

  handleSubmission = async (post: PostFragment | null, error?: Error) => {
    if (error) {
      console.error(error);
      this.setState({ uploadStatus: UploadStatus.uploadFileError });
      return;
    }

    if (!post) {
      debugger;
      return null;
    }

    console.log("3");

    const mediaMap = getMediaToUpload(this.props.data);

    if (Object.keys(mediaMap).length > 0) {
      try {
        await Bluebird.map(
          Object.entries(mediaMap),
          ([id, image]) => this.uploadImage(id, image, post.id),
          { concurrency: 2 }
        );
      } catch (exception) {
        console.error(exception);
      }
    }

    console.log("4");

    this.setState({ uploadStatus: UploadStatus.complete });
    return post;
  };

  triggerUploadComplete = true;
  handleUploadComplete = ({ mediaId, ...otherProps }) => {
    if (!mediaId) {
      console.log("Upload failed but reported as complete", otherProps);
      debugger;
      this.handleUploadError(otherProps.error);
      return Promise.reject();
    }

    this.setState(
      {
        uploadStatus: UploadStatus.uploadComplete,
        mediaId,
        error: null
      },
      () => {
        console.log("Upload complete", mediaId);
        this.props.onUpload(mediaId);
      }
    );

    Animated.spring(this.uploadProgressValue, {
      toValue: this.props.width
    }).start();

    this.s3Upload = null;

    return Promise.resolve();
  };

  handleUploadError = (error, more, other) => {
    if (this.canceled) {
      console.log("Cancelled");
      return Promise.resolve();
    }

    console.error(error);
    alert("Uploading failed. Please try again");
    Animated.spring(this.uploadProgressValue, {
      toValue: this.props.width * -1
    });

    HapticFeedback.trigger("notificationError");

    this.setState({
      uploadStatus: UploadStatus.uploadFileError
    });

    this.s3Upload = null;

    return Promise.resolve();
  };

  startUploading = (resetStatus: boolean) => {
    return this._startUploading(
      resetStatus,
      this.props.file,
      this.handleUploadComplete,
      {
        type: "Media",
        contentType: this.props.file.type,
        duration: this.props.file.duration,
        pixelRatio: PixelRatio.get()
      }
    );
  };

  _startUploading = async (
    resetStatus = false,
    file,
    onUploadComplete,
    params
  ) => {
    this.setState({
      uploadStatus: UploadStatus.uploadingFile
    });

    this.s3Upload = await startFileUpload({
      file: {
        fileName: path.basename(file.uri),
        uri: file.uri,
        width: file.width,
        height: file.height,
        type: file.type || file.mediaType || file.contentType
      },
      onFinishS3Put: onUploadComplete,
      onError: this.handleUploadError,
      onProgress: this.handleUploadProgress,
      params
    });

    this.canceled = false;
    console.log("Start upload", file);
  };
  canceled = false;

  breadSpinner = new Animated.Value(0);

  get isUploading() {
    return [
      UploadStatus.pending,
      UploadStatus.startPresign,
      UploadStatus.uploadingFile,
      UploadStatus.submittingPost
    ].includes(this.state.uploadStatus);
  }

  render() {
    return (
      <Modal
        visible={this.props.visible}
        onDismiss={this.props.onCancel}
        onPressBackdrop={this.props.onCancel}
      >
        <KeyboardAvoidingView behavior="padding">
          <Animated.Code
            exec={Animated.block([
              Animated.set(
                this.breadSpinner,
                runLoopAnimation({ easing: Easing.linear, duration: 100000 })
              )
            ])}
          />

          <View style={styles.content}>
            <Animated.View
              style={[
                styles.spinner,
                {
                  transform: [
                    {
                      rotate: Animated.concat(
                        Animated.interpolate(this.breadSpinner, {
                          inputRange: [0, 1],
                          outputRange: [0, 360],
                          extrapolate: Animated.Extrapolate.CLAMP
                        }),
                        "rad"
                      )
                    }
                  ]
                }
              ]}
            >
              <Text style={styles.spinnerText}>🍞</Text>
            </Animated.View>
            <Text style={[styles.spinnerText, styles.spinnerTextTiny]}>♨️</Text>
            <View>
              <MediumText style={styles.words}>
                Your post is baking!!
              </MediumText>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
}

export const PostUploader = React.forwardRef((props, ref) => {
  const [submitPost] = useMutation<CreatePost, CreatePostVariables>(
    SUBMIT_POST_MUTATION
  );

  const [addAttachment] = useMutation<
    AddAttachmentMutation,
    AddAttachmentMutationVariables
  >(ADD_ATTACHMENT_MUTATION);

  const [submitPostThread] = useMutation<
    CreatePostThread,
    CreatePostThreadVariables
  >(CREATE_POST_THREAD_MUTATION);

  return (
    <RawPostUploader
      {...props}
      submitPostThread={submitPostThread}
      submitPost={submitPost}
      ref={ref}
      addAttachment={addAttachment}
    />
  );
});

export default PostUploader;
