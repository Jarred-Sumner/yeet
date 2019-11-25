import * as React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { NewPost } from "../components/NewPost/NewPost";
import { withNavigation } from "react-navigation";
import { PostFragment } from "../lib/graphql/PostFragment";
import {
  convertExportedBlocks,
  convertExportedNodes,
  ContentExport,
  ExportData
} from "../lib/Exporter";
import { PostFormat } from "../components/NewPost/NewPostFormat";
import { sendToast, ToastType } from "../components/Toast";
import PostUploader, { RawPostUploader } from "../components/PostUploader";
import { useNavigation } from "react-navigation-hooks";
import {
  MediaUploadContext,
  PostUploadTask,
  PostUploadTaskType
} from "../lib/MediaUploadTask";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black"
  }
});

type State = {
  contentExport: ContentExport | null;
  exportData: ExportData | null;
  showUploader: boolean;
  format: PostFormat | null;
};

class RawReplyPage extends React.Component<{}, State> {
  state = {
    contentExport: null,
    exportData: null,
    showUploader: false
  };
  postUploaderRef = React.createRef<RawPostUploader>();
  handleCreate = () => {
    const fromFeed = this.props.navigation.getParam("fromFeed") ?? false;

    const threadId = this.props.navigation.getParam("threadId");

    if (fromFeed) {
      this.props.navigation.goBack();
      this.props.navigation.navigate("ViewThread", {
        threadId
      });
    } else {
      this.props.navigation.goBack();
    }
  };

  handleExport = async (
    contentExport: ContentExport,
    exportData: ExportData,
    format: PostFormat
  ) => {
    const { postUploadTask, setPostUploadTask, navigation } = this.props;

    if (postUploadTask && !postUploadTask.isFinished) {
      const shouldCancel = await new Promise(resolve =>
        Alert.alert(
          "Cancel pending upload?",
          "Another post is currently being uploaded. Cancel that one and post this one instead?",
          [
            {
              text: "Yes, post this instead",
              onPress: () => resolve(true)
            },
            {
              text: "No, don't.",
              style: "cancel",
              onPress: () => resolve(false)
            }
          ]
        )
      );

      if (shouldCancel) {
        await postUploadTask.cancel();
      } else {
        return;
      }
    }

    const threadId = navigation.getParam("threadId");

    const _task = new PostUploadTask({
      contentExport,
      format,
      exportData,
      threadId,
      type: PostUploadTaskType.newPost
    });

    _task.start();

    setPostUploadTask(_task);

    this.handleCreate();
  };

  render() {
    const { navigation } = this.props;
    const post: PostFragment | null = navigation.getParam("post") || null;
    const thread = navigation.getParam("thread");
    const threadId = navigation.getParam("threadId");

    let blocks = undefined;
    let nodes = undefined;
    let format = undefined;
    let bounds = undefined;

    if (post) {
      blocks = convertExportedBlocks(post.blocks, post.attachments);
      nodes = convertExportedNodes(post.nodes, post.attachments);
      format = PostFormat[post.format];
      bounds = post.bounds;
    }

    return (
      <View style={styles.container}>
        <NewPost
          thread={thread}
          threadId={threadId}
          defaultInlineNodes={nodes}
          defaultBlocks={blocks}
          defaultFormat={format}
          defaultBounds={bounds}
          onExport={this.handleExport}
        />
      </View>
    );
  }
}

export const ReplyPage = props => {
  const navigation = useNavigation();
  const { setPostUploadTask, postUploadTask } = React.useContext(
    MediaUploadContext
  );

  return (
    <RawReplyPage
      {...props}
      navigation={navigation}
      setPostUploadTask={setPostUploadTask}
      postUploadTask={postUploadTask}
    />
  );
};

export default ReplyPage;
