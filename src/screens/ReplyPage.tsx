import * as React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useNavigation, useNavigationParam } from "react-navigation-hooks";
import { NewPost } from "../components/NewPost/NewPost";
import { PostFormat, PostLayout } from "../components/NewPost/NewPostFormat";
import {
  ContentExport,
  convertExportedBlocks,
  convertExportedNodes,
  ExportData
} from "../lib/Exporter";
import { PostFragment } from "../lib/graphql/PostFragment";
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
    format: PostFormat,
    layout: PostLayout,
    editToken: string
  ) => {
    const { threadId, navigation, fromFeed } = this.props;
    navigation.navigate("SharePost", {
      contentExport,
      exportData,
      format,
      layout,
      editToken,
      threadId,
      backKey: fromFeed ? "ThreadList" : "ViewThread"
    });
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
  const threadId = useNavigationParam("threadId");
  const fromFeed = useNavigationParam("fromFeed") || false;
  const navigation = useNavigation();

  return (
    <RawReplyPage
      {...props}
      navigation={navigation}
      threadId={threadId}
      fromFeed={fromFeed}
    />
  );
};

export default ReplyPage;
