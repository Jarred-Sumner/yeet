import * as React from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  useNavigation,
  useNavigationState,
  useRoute
} from "@react-navigation/core";
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
    const { fromFeed = false, threadId } = this.props;
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
    const { post, thread, threadId } = this.props;

    let blocks = {};
    let positions = [];
    let nodes = undefined;
    let format = undefined;
    let bounds = undefined;

    if (post) {
      positions = convertExportedBlocks(post.blocks, post.attachments).map(
        block => {
          if (typeof block.length === "number") {
            return block.map(_block => {
              blocks[_block.id] = _block;
              return _block.id;
            });
          }
        }
      );
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
          defaultPositions={positions}
          defaultBounds={bounds}
          onExport={this.handleExport}
        />
      </View>
    );
  }
}

export const ReplyPage = props => {
  const route = useRoute();
  const { threadId = null, fromFeed = false, post = null } = route.params ?? {};
  const navigation = useNavigation();

  return (
    <RawReplyPage
      {...props}
      navigation={navigation}
      threadId={threadId}
      post={post}
      fromFeed={fromFeed}
    />
  );
};

export default ReplyPage;
