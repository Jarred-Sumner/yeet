import * as React from "react";
import { View, StyleSheet } from "react-native";
import { NewPost, DEFAULT_POST } from "../components/NewPost/NewPost";
import { UserContext } from "../components/UserContext";
import { useNavigation, useFocusState } from "react-navigation-hooks";
import {
  buildImageBlock,
  minImageWidthByFormat,
  DEFAULT_POST_FORMAT,
  PostFormat,
  PostLayout,
  generateBlockId,
  POST_WIDTH
} from "../components/NewPost/NewPostFormat";
import {
  ContentExport,
  ExportData,
  convertExportedBlocks,
  convertExportedNodes
} from "../lib/Exporter";
import { ToastType, sendToast } from "../components/Toast";
import { PostFragment } from "../lib/graphql/PostFragment";
import { SCREEN_DIMENSIONS } from "../../config";
import { MAX_CONTENT_HEIGHT } from "../components/Feed/PostPreviewList";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1
  }
});

export class NewPostPage extends React.Component {
  constructor(props) {
    super(props);

    const image = props.navigation.getParam("image");
    const post: Partial<PostFragment> | null = props.navigation.getParam(
      "post"
    );
    const blockId = props.navigation.getParam("blockId");

    if (post) {
      const scaleFactor = (post.bounds.width ?? post.media.width) / POST_WIDTH;
      const defaultBlocks = convertExportedBlocks(post.blocks, {}, scaleFactor);
      const defaultNodes = convertExportedNodes(post.nodes, {}, scaleFactor);

      this.state = {
        defaultBlocks: defaultBlocks,
        defaultLayout: post.layout,
        defaultFormat: post.format,
        defaultInlineNodes: defaultNodes
      };
    } else if (image) {
      const minWidth = minImageWidthByFormat(DEFAULT_POST_FORMAT);

      const imageBlock = buildImageBlock({
        image,
        id: blockId || generateBlockId(),
        width: minWidth,
        layout: PostLayout.media,
        autoInserted: true,
        height: image.image.height * (minWidth / image.image.width),
        format: DEFAULT_POST_FORMAT
      });

      this.state = {
        defaultBlocks: [imageBlock]
      };
    } else {
      this.state = { defaultBlocks: undefined };
    }
  }

  handleExport = (
    contentExport: ContentExport,
    exportData: ExportData,
    format: PostFormat,
    layout: PostLayout,
    editToken: string
  ) => {
    this.props.navigation.navigate("NewThread", {
      contentExport,
      exportData,
      format,
      layout,
      editToken
    });
  };

  componentDidMount() {
    if (this.props.isFocused || this.props.isFocusing) {
      this.props.requireAuthentication();
    }
  }

  componentDidUpdate(prevProps) {
    if (
      (this.props.isFocused || this.props.isFocusing) &&
      !prevProps.isFocused
    ) {
      this.props.requireAuthentication();
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <NewPost
          navigation={this.props.navigation}
          defaultBlocks={this.state.defaultBlocks}
          onExport={this.handleExport}
          defaultWidth={this.state.defaultWidth}
          defaultHeight={this.state.defaultHeight}
          defaultLayout={this.state.defaultLayout}
          defaultFormat={this.state.defaultFormat}
          defaultInlineNodes={this.state.defaultInlineNodes}
        />
      </View>
    );
  }
}

export default pageProps => {
  const userContext = React.useContext(UserContext);
  const { isFocused, isFocusing } = useFocusState();

  return (
    <NewPostPage
      {...pageProps}
      requireAuthentication={userContext.requireAuthentication}
      authState={userContext.authState}
      isFocused={isFocused}
      isFocusing={isFocusing}
    />
  );
};
