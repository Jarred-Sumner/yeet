import * as React from "react";
import S3Upload, { startFileUpload } from "../lib/fileUpload";
import { fromPairs, get } from "lodash";
import Animated from "react-native-reanimated";
import HapticFeedback from "react-native-haptic-feedback";
import { ActivityIndicator, View, PixelRatio } from "react-native";
import { SemiBoldText } from "./Text";
import {
  ContentExport,
  ExportData,
  getMediaToUpload,
  ExportableYeetImage
} from "../lib/Exporter";
import { Mutation } from "react-apollo";
import SUBMIT_POST_MUTATION from "../lib/createPostMutation.graphql";
import ADD_ATTACHMENT_MUTATION from "../lib/addAttachmentMutation.graphql";
import path from "path";
import Bluebird from "bluebird";
import { CreatePost, CreatePost_createPost } from "../lib/graphql/CreatePost";
import { AddAttachmentMutation } from "../lib/graphql/AddAttachmentMutation";

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
  width: number;
  height: number;
};

type State = {
  uploadStatus: UploadStatus;
  mediaId: string | null;
};
export class RawPostUploader extends React.Component<Props> {
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

  createPost = (
    mediaId: string,
    blocks,
    nodes,
    format,
    bounds,
    colors,
    threadId
  ): Promise<CreatePost_createPost> => {
    this.setState({ uploadStatus: UploadStatus.submittingPost });

    return this.props
      .submitPost({
        variables: { mediaId, blocks, nodes, format, bounds, colors, threadId }
      })
      .then(
        async (resp: { data: CreatePost }) => {
          const {
            data: { createPost: post },
            error
          } = resp;

          if (error) {
            console.error(error);
            return;
          }

          if (!post) {
            debugger;
            return null;
          }

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

          this.setState({ uploadStatus: UploadStatus.complete });
          return post;
        },
        err => {
          console.error(err);
          this.triggerUploadComplete = true;
        }
      );
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

    Animated.spring(this.uploadProgressValue, {
      toValue: this.props.width * 1
    }).start();

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
      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          justifyContent: "center",
          alignItems: "center",
          left: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)"
        }}
      >
        {this.isUploading ? (
          <ActivityIndicator size="large" />
        ) : (
          <SemiBoldText>{this.state.uploadStatus}</SemiBoldText>
        )}
      </Animated.View>
    );
  }
}

export const PostUploader = React.forwardRef((props, ref) => {
  return (
    <Mutation mutation={SUBMIT_POST_MUTATION}>
      {submitPost => (
        <Mutation mutation={ADD_ATTACHMENT_MUTATION}>
          {addAttachment => (
            <RawPostUploader
              {...props}
              submitPost={submitPost}
              ref={ref}
              addAttachment={addAttachment}
            />
          )}
        </Mutation>
      )}
    </Mutation>
  );
});

export default PostUploader;
