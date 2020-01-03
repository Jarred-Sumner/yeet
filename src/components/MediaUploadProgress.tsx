import * as React from "react";
import { ImageSourcePropType, StyleSheet, View } from "react-native";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../config";
import {
  MediaUpload,
  MediaUploadContext,
  PostUploadTask,
  PostUploadTaskStatus,
  PostUploadTaskType
} from "../lib/MediaUploadTask";
import { COLORS, SPACING } from "../lib/styles";
import Image from "./Image";
import { MediumText } from "./Text";
import { isVideo } from "../lib/imageSearch";
import { IconChevronRight } from "./Icon";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

const THUMBNAIL_SIZE = 30;

type Props = {
  progress: number;
  postUploadTask: PostUploadTask;
  thumbnail: ImageSourcePropType;
  status: PostUploadTaskStatus;
  file: MediaUpload | null;
  onPressPost: () => void;
  setPostUploadTask: (task: PostUploadTask) => void;
};

const PROGRESS_BAR_WIDTH =
  SCREEN_DIMENSIONS.width - SPACING.double * 2 - THUMBNAIL_SIZE - 20;

const PROGRESS_BAR_HEIGHT = 8;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderBottomColor: "#000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden"
  },
  image: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginHorizontal: SPACING.normal
  },
  content: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: SPACING.half
  },
  barContainer: {
    width: PROGRESS_BAR_WIDTH,
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    overflow: "hidden",
    backgroundColor: COLORS.muted
  },
  bar: {
    height: PROGRESS_BAR_HEIGHT,
    width: PROGRESS_BAR_WIDTH,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    overflow: "hidden"
  },
  pendingBar: {
    backgroundColor: COLORS.secondary
  },
  completedBar: {
    backgroundColor: COLORS.success
  },
  errorBar: {
    backgroundColor: COLORS.error
  },
  cancelledBar: {
    backgroundColor: COLORS.muted
  },
  label: {
    color: COLORS.muted,
    marginBottom: SPACING.half,
    textAlign: "left",
    width: PROGRESS_BAR_WIDTH
  },
  iconContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: SPACING.normal,
    paddingVertical: SPACING.half,
    alignItems: "center"
  },
  shownIcon: {
    display: "flex"
  },
  hiddenIcon: {
    display: "none"
  }
});

const BAR_COLOR_BY_STATUS = {
  [PostUploadTaskStatus.waiting]: styles.pendingBar,
  [PostUploadTaskStatus.progressing]: styles.pendingBar,
  [PostUploadTaskStatus.posting]: styles.pendingBar,
  [PostUploadTaskStatus.uploading]: styles.pendingBar,
  [PostUploadTaskStatus.complete]: styles.completedBar,
  [PostUploadTaskStatus.error]: styles.errorBar,
  [PostUploadTaskStatus.cancelled]: styles.cancelledBar
};

const statusLabel = (
  status: PostUploadTaskStatus,
  file: MediaUpload,
  upload: PostUploadTask
) => {
  const { requiredFile } = upload?.task ?? {};
  const isVideoPost = isVideo(requiredFile?.media?.mimeType);
  const mediaTypeLabel = isVideoPost ? "video" : "photo";
  const postTypeLabel =
    upload?.type === PostUploadTaskType.newPost ? "post" : "thread";

  const hasPosted = !!upload?.post;

  if (status === PostUploadTaskStatus.waiting) {
    return `Preparing ${mediaTypeLabel}...`;
  } else if (
    status === PostUploadTaskStatus.progressing &&
    requiredFile.isProgressing
  ) {
    return `Uploading ${mediaTypeLabel}...`;
  } else if (status === PostUploadTaskStatus.posting) {
    return `Creating ${postTypeLabel}...`;
  } else if (
    upload.status === PostUploadTaskStatus.complete ||
    (status === PostUploadTaskStatus.error && !hasPosted)
  ) {
    return "Posted successfully!";
  } else if (
    requiredFile.isCompleted &&
    hasPosted &&
    upload.status === PostUploadTaskStatus.progressing
  ) {
    const currentIndex = upload.task.optionalFiles.indexOf(file);

    return `Posted, but processing ${currentIndex + 1} of ${
      upload.task.optionalFiles.length
    }`;
  } else if (status === PostUploadTaskStatus.error && !hasPosted) {
    return "Something broke...please try again.";
  } else if (status === PostUploadTaskStatus.cancelled && !hasPosted) {
    return "Cancelled post";
  } else {
    return status;
  }
};

class MediaUploadProgressComponent extends React.Component<Props> {
  render() {
    const {
      progress,
      status,
      postUploadTask,
      file,
      onPressPost,
      hideIcon
    } = this.props;

    if (status === PostUploadTaskStatus.cancelled) {
      return null;
    }

    const hasPosted = !!postUploadTask?.post;

    return (
      <TouchableWithoutFeedback onPress={onPressPost} disabled={!hasPosted}>
        <View style={styles.container}>
          <Image
            source={this.props.thumbnail}
            borderRadius={2}
            style={styles.image}
            paused
          />

          <View style={styles.content}>
            <View style={styles.labelContainer}>
              <MediumText style={styles.label}>
                {statusLabel(status, file, postUploadTask)}
              </MediumText>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  BAR_COLOR_BY_STATUS[status],
                  {
                    transform: [
                      {
                        translateX: PROGRESS_BAR_WIDTH * -1
                      },
                      {
                        translateX: progress * PROGRESS_BAR_WIDTH
                      }
                    ]
                  }
                ]}
              />
            </View>
          </View>

          <View
            style={[
              styles.iconContainer,
              hasPosted && !hideIcon ? styles.shownIcon : styles.hiddenIcon
            ]}
          >
            <IconChevronRight color="#ccc" size={18} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export const MediaUploadProgress = props => {
  const {
    postUploadTask,
    setPostUploadTask,
    progress,
    onPressPost,
    status,
    currentFile
  } = React.useContext(MediaUploadContext);

  return (
    <MediaUploadProgressComponent
      hideIcon={props.hideIcon}
      progress={progress}
      status={status}
      postUploadTask={postUploadTask}
      file={currentFile}
      onPressPost={onPressPost}
      thumbnail={postUploadTask.contentExport.thumbnail}
    />
  );
};
