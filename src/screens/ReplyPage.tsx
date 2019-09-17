import * as React from "react";
import { View, StyleSheet } from "react-native";
import { NewPost } from "../components/NewPost/NewPost";
import { withNavigation } from "react-navigation";
import { PostFragment } from "../lib/graphql/PostFragment";
import { convertExportedBlocks, convertExportedNodes } from "../lib/Exporter";
import { PostFormat } from "../components/NewPost/NewPostFormat";

const styles = StyleSheet.create({
  container: {}
});

class ReplyPage extends React.Component {
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
        />
      </View>
    );
  }
}

export default withNavigation(ReplyPage);
