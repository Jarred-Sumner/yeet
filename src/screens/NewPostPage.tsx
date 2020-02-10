import { flatten, fromPairs, isArray } from "lodash";
import * as React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  LayoutAnimation,
  StatusBar
} from "react-native";
import { useIsFocused, useRoute } from "@react-navigation/core";
import { NewPost } from "../components/NewPost/NewPost";
import {
  buildImageBlock,
  DEFAULT_POST_FORMAT,
  generateBlockId,
  ImagePostBlock,
  minImageWidthByFormat,
  PostFormat,
  PostLayout,
  POST_WIDTH
} from "../components/NewPost/NewPostFormat";
import { sendToast, ToastType } from "../components/Toast";
import { UserContext } from "../components/UserContext";
import {
  ContentExport,
  convertExportedBlocks,
  convertExportedNodes,
  ExportData,
  guesstimateLayout
} from "../lib/Exporter";
import { PostFragment } from "../lib/graphql/PostFragment";
import { getHighlightInset } from "../components/NewPost/Text/TextBlockUtils";
import { scaleRectByFactor } from "../lib/Rect";
import { useQuery } from "react-apollo";
import LOAD_POST_QUERY from "../lib/LoadEditorPostQuery.graphql";
import {
  LoadEditorPostQuery,
  LoadEditorPostQueryVariables
} from "../lib/graphql/LoadEditorPostQuery";
import { NetworkStatus } from "apollo-client";
import { SPACING } from "../lib/styles";
import { MediumText } from "../components/Text";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  loadingWrapper: {
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    fontSize: 18,
    color: "#ccc",
    textAlign: "center"
  },
  spinner: {
    marginBottom: SPACING.double,
    alignSelf: "center"
  }
});

export class NewPostPage extends React.Component {
  constructor(props) {
    super(props);

    const { image, post, blockId } = props;

    if (post) {
      if (props.postQuery.networkStatus !== NetworkStatus.ready) {
        this.state = {
          defaultBlocks: undefined,
          defaultPositions: {},
          remixId: null,
          defaultHeight: 0,
          defaultWidth: POST_WIDTH,
          examples: {},
          thumbnail: null,
          isLoading: true,
          minX: 0,
          minY: 0
        };
      } else {
        this.loadPost(post);
      }
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
        defaultWidth: POST_WIDTH,
        defaultHeight: imageBlock.config.dimensions.height,
        remixId: null,
        thumbnail: null,
        isLoading: props.postQuery?.loading ?? false,
        minX: 0,
        minY: 0
      };
    } else {
      this.state = {
        defaultBlocks: undefined,
        defaultPositions: {},
        remixId: null,
        defaultHeight: 0,
        defaultWidth: POST_WIDTH,
        examples: {},
        thumbnail: null,
        isLoading: props.postQuery?.loading ?? false,
        minX: 0,
        minY: 0
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
  }

  loadPost = (post, isLate = false) => {
    const { userId } = this.props;

    let scaleFactor = POST_WIDTH / (post.bounds.width ?? post.media.width);

    const examples = post.examples ?? {};

    let defaultBlocks = convertExportedBlocks(
      post.blocks,
      {},
      scaleFactor,
      examples
    );
    let imageBlock = flatten(defaultBlocks).find(
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

    const defaultNodes = convertExportedNodes(
      post.nodes,
      {},
      scaleFactor,
      xPadding,
      yPadding,
      post.bounds,
      examples,
      defaultBlocks
    );

    const changes = {
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
      defaultWidth: POST_WIDTH,
      defaultHeight: post.bounds.height * scaleFactor,
      thumbnail: post.media?.coverUrl,
      minX: xPadding,
      minY: yPadding,
      backgroundColor: post?.colors?.background || "#111",
      defaultLayout: guesstimateLayout(post?.layout, defaultBlocks),
      defaultFormat: post.format,
      defaultInlineNodes: defaultNodes,
      examples,
      isLoading: false
    };

    if (isLate) {
      this.setState(changes);
    } else {
      this.state = changes;
    }
  };

  componentDidUpdate(prevProps, prevState) {
    const post = this.props.postQuery?.data?.post;
    const isLoadingPost = this.props.postQuery?.loading;

    const prevPost = prevProps.postQuery?.data?.post;

    if (this.state.isLoading && post !== prevPost && post && !isLoadingPost) {
      this.loadPost(post, true);
    }

    if (!this.state.isLoading && prevState.isLoading) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" style={styles.spinner} />
            <MediumText style={styles.loadingText}>Loading post...</MediumText>
          </View>
        ) : (
          <NewPost
            navigation={this.props.navigation}
            defaultBlocks={this.state.defaultBlocks}
            defaultPositions={this.state.defaultPositions}
            examples={this.state.examples}
            thumbnail={this.state.thumbnail}
            onExport={this.handleExport}
            isFocused={this.props.isFocused}
            backgroundColor={this.state.backgroundColor}
            defaultWidth={this.state.defaultWidth}
            defaultHeight={this.state.defaultHeight}
            defaultLayout={this.state.defaultLayout}
            minX={this.state.minX}
            minY={this.state.minY}
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
  const route = useRoute();
  const { post: postParam = {}, image, blockId } = route.params ?? {};
  const isFocused = useIsFocused();
  const postId = postParam?.id;
  const postQuery = useQuery<LoadEditorPostQuery, LoadEditorPostQueryVariables>(
    LOAD_POST_QUERY,
    {
      skip: !postId,
      returnPartialData: false,
      fetchPolicy: "no-cache",
      notifyOnNetworkStatusChange: true,

      variables: {
        id: postId
      }
    }
  );

  return (
    <NewPostPage
      {...pageProps}
      requireAuthentication={userContext.requireAuthentication}
      authState={userContext.authState}
      userId={userContext.userId}
      image={image}
      blockId={blockId}
      postQuery={postQuery}
      isFocused={isFocused}
      isFocusing={isFocused}
    />
  );
};
