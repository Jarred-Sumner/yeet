import * as React from "react";
import { View, StyleSheet } from "react-native";
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

class ReplyPage extends React.Component<{}, State> {
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

  handleExport = (
    contentExport: ContentExport,
    exportData: ExportData,
    format: PostFormat
  ) => {
    this.setState(
      {
        contentExport,
        format,
        exportData,
        showUploader: true
      },
      () => {
        this.postUploaderRef.current.startUploading(true);
      }
    );
  };

  handleUploadComplete = async (mediaId: string) => {
    const { contentExport, exportData, format } = this.state;

    if (!exportData || !contentExport || !format) {
      sendToast("Something went wrong. Please try again", ToastType.error);
      return;
    }

    const threadId = this.props.navigation.getParam("threadId");
    console.log("Creating post for ", mediaId, "in", threadId);

    try {
      const post = await this.postUploaderRef.current.createPost({
        mediaId,
        blocks: exportData.blocks,
        autoplaySeconds: contentExport.duration,
        format,
        bounds: exportData.bounds,
        nodes: exportData.nodes,
        colors: {
          background: contentExport.colors?.background ?? null,
          primary: contentExport.colors?.primary ?? null,
          secondary: contentExport.colors?.secondary ?? null,
          detail: contentExport.colors?.detail ?? null
        },
        threadId
      });

      sendToast("Posted successfully", ToastType.success);

      this.handleCreate();
    } catch (error) {
      sendToast("Something went wrong. Please try again", ToastType.error);
      console.error(error);
    } finally {
      this.setState({ showUploader: false, exportData: null });
    }
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

        <PostUploader
          ref={this.postUploaderRef}
          onUpload={this.handleUploadComplete}
          onCancel={this.handleCancel}
          visible={this.state.showUploader}
          file={this.state.contentExport}
          data={this.state.exportData}
        />
      </View>
    );
  }
}

export default withNavigation(ReplyPage);
