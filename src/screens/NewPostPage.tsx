import * as React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { NewPost, DEFAULT_POST } from "../components/NewPost/NewPost";
import { UserContext } from "../components/UserContext";
import { useNavigation, useFocusState } from "react-navigation-hooks";
import { flatten } from "lodash";
import {
  buildImageBlock,
  minImageWidthByFormat,
  DEFAULT_POST_FORMAT,
  PostFormat,
  PostLayout,
  generateBlockId,
  POST_WIDTH,
  ImagePostBlock
} from "../components/NewPost/NewPostFormat";
import {
  ContentExport,
  ExportData,
  convertExportedBlocks,
  convertExportedNodes,
  guesstimateLayout
} from "../lib/Exporter";
import { ToastType, sendToast } from "../components/Toast";
import { PostFragment } from "../lib/graphql/PostFragment";
import { fromPairs, isArray } from "lodash";
import { SCREEN_DIMENSIONS } from "../../config";
import { MAX_CONTENT_HEIGHT } from "../components/Feed/PostPreviewList";
import { SPACING } from "../lib/styles";

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  spinner: {
    marginTop: 150,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center"
  }
});

export class NewPostPage extends React.Component {
  constructor(props) {
    super(props);

    const image = props.navigation.getParam("image");
    const post: Partial<PostFragment> | null = this.props.navigation.getParam(
      "post"
    );
    const blockId = props.navigation.getParam("blockId");

    if (post) {
      this.state = {
        isLoading: true,
        remixId: post?.id
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
        defaultBlocks: { [imageBlock.id]: imageBlock },
        defaultPositions: [[imageBlock.id]],
        examples: {},
        remixId: null,
        thumbnail: null,
        isLoading: false
      };
    } else {
      this.state = {
        defaultBlocks: undefined,
        defaultPositions: {},
        remixId: null,
        examples: {},
        thumbnail: null,
        isLoading: false
      };
    }
  }

  handleExport = (
    contentExport: ContentExport,
    exportData: ExportData,
    format: PostFormat,
    layout: PostLayout,
    editToken: string
  ) => {
    const remixId = this.state.remixId;
    this.props.navigation.navigate("NewThread", {
      contentExport,
      exportData,
      remixId,
      format,
      layout,
      editToken
    });
  };

  componentDidMount() {
    if (this.props.isFocused || this.props.isFocusing) {
      this.props.requireAuthentication();
    }

    const post: Partial<PostFragment> | null = this.props.navigation.getParam(
      "post"
    );

    if (this.state.isLoading && post) {
      this.loadPost().catch(err => {
        console.error(err);

        sendToast("Loading didn't work :(", ToastType.error);

        this.setState({
          defaultBlocks: undefined,
          defaultPositions: {},
          thumbnail: null,
          isLoading: false
        });
      });
    }
  }

  loadPost = async () => {
    const { userId } = this.props;
    const post: Partial<PostFragment> | null = this.props.navigation.getParam(
      "post"
    );

    let scaleFactor = POST_WIDTH / (post.bounds.width ?? post.media.width);

    const examples = post.examples ?? {};

    let defaultBlocks = convertExportedBlocks(
      post.blocks,
      {},
      scaleFactor,
      examples
    );
    const imageBlock = flatten(defaultBlocks).find(
      image => image.type === "image"
    ) as ImagePostBlock;

    let xPadding = post.bounds.x * scaleFactor;
    let yPadding = post.bounds.y * scaleFactor;

    if (
      imageBlock &&
      imageBlock.format === PostFormat.post &&
      imageBlock.config.dimensions.width !== POST_WIDTH &&
      imageBlock.layout === PostLayout.media
    ) {
      scaleFactor = POST_WIDTH / imageBlock.value.image.width;

      xPadding = post.bounds.x * scaleFactor;
      yPadding = post.bounds.y * scaleFactor;

      defaultBlocks = convertExportedBlocks(
        post.blocks,
        {},
        scaleFactor,
        examples
      );
    }

    const defaultNodes = await convertExportedNodes(
      post.nodes,
      {},
      scaleFactor,
      xPadding,
      yPadding,
      post.bounds,
      examples
    );

    this.setState({
      remixId: post.id,
      defaultBlocks: fromPairs(
        flatten(defaultBlocks).map(block => [block.id, block])
      ),
      defaultPositions: defaultBlocks.map(block => {
        if (isArray(block)) {
          return block.map(_block => _block.id);
        } else {
          return block.id;
        }
      }),
      thumbnail: post.media.coverUrl,
      backgroundColor: post?.colors?.background || "black",
      defaultLayout: guesstimateLayout(post?.layout, defaultBlocks),
      defaultFormat: post.format,
      defaultInlineNodes: defaultNodes,
      examples,
      isLoading: false
    });
  };

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
        {this.state.isLoading ? (
          <ActivityIndicator size="large" style={styles.spinner} />
        ) : (
          <NewPost
            navigation={this.props.navigation}
            defaultBlocks={this.state.defaultBlocks}
            defaultPositions={this.state.defaultPositions}
            examples={this.state.examples}
            thumbnail={this.state.thumbnail}
            onExport={this.handleExport}
            backgroundColor={this.state.backgroundColor}
            defaultWidth={this.state.defaultWidth}
            defaultHeight={this.state.defaultHeight}
            defaultLayout={this.state.defaultLayout}
            defaultFormat={this.state.defaultFormat}
            defaultInlineNodes={this.state.defaultInlineNodes}
          />
        )}
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
      userId={userContext.userId}
      isFocused={isFocused}
      isFocusing={isFocusing}
    />
  );
};
