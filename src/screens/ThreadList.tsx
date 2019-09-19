// @flow
import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { Query } from "react-apollo";
import { Dimensions, SafeAreaView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { withNavigation } from "react-navigation";
import { BOTTOM_Y, TOP_Y, SCREEN_DIMENSIONS } from "../../config";
import { IconButton } from "../components/Button";
import {
  IconPlus,
  IconProfile,
  IconHeart,
  IconRemix
} from "../components/Icon";
import {
  ViewThreads,
  ViewThreads_postThreads
} from "../lib/graphql/ViewThreads";
import { SPACING } from "../lib/styles";
import VIEW_THREADS_QUERY from "../lib/ViewThreads.graphql";
import { FlatList, BaseButton } from "react-native-gesture-handler";
import Media from "../components/PostList/ViewMedia";
import { range, max, min } from "lodash";
import { pxBoundsToPoint, scaleToWidth } from "../lib/Rect";
import { SemiBoldText } from "../components/Text";
import { Avatar } from "../components/Avatar";
import { ProgressBarList, OverlayGradient } from "../components/PostList/Post";
import { SharedElement } from "react-navigation-shared-element";

const LAYOUT_DIRECTION = "column-reverse";
const LAYOUT_DIRECTION_OFFSET = {
  column: BOTTOM_Y + 80 + TOP_Y,
  "column-reverse": TOP_Y + 60.5
}[LAYOUT_DIRECTION];

const Footer = ({ onPressPlus }) => (
  <SafeAreaView
    forceInset={{
      bottom: LAYOUT_DIRECTION === "column-reverse" ? "never" : "always",
      left: "never",
      right: "never",
      top: LAYOUT_DIRECTION === "column" ? "never" : "always"
    }}
  >
    <View
      style={{
        justifyContent: "space-between",
        paddingHorizontal: SPACING.double,
        paddingVertical: SPACING.normal,
        flexDirection: "row"
      }}
    >
      <IconButton type="shadow" color="#ccc" Icon={IconProfile} />
      <IconButton
        type="shadow"
        color="#ccc"
        Icon={IconPlus}
        onPress={onPressPlus}
      />
    </View>
  </SafeAreaView>
);

type Props = ViewThreads & {};

const CELLS_PER_ROW = 2;
const CELL_SPACING = SPACING.half / 2;
const MAX_CELL_HEIGHT =
  (SCREEN_DIMENSIONS.height + CELL_SPACING) / CELLS_PER_ROW;
const CELL_WIDTH =
  SCREEN_DIMENSIONS.width / CELLS_PER_ROW - CELL_SPACING * CELLS_PER_ROW;

const threadStyles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden"
  },
  layer: {
    ...StyleSheet.absoluteFillObject
  },
  overlayLayer: {
    justifyContent: "space-between",
    zIndex: 2
  },
  profile: {
    flexDirection: "row",
    alignItems: "center"
  },
  footer: {
    flexDirection: "row",
    padding: SPACING.half,
    justifyContent: "space-between"
  },
  header: {
    opacity: 1.0
  },
  progressBars: {
    height: 3
  },
  username: {
    fontSize: 16,
    marginLeft: SPACING.half
  },
  likesCount: {
    color: "white",
    flexDirection: "row",
    alignItems: "center"
  },
  mediaLayer: {
    zIndex: 0
  },
  gradientLayer: {
    zIndex: 1
  },
  remixCount: {
    color: "white",
    flexDirection: "column",
    paddingHorizontal: SPACING.half,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: SPACING.half
  },
  remixCountText: {
    marginTop: SPACING.half,

    fontSize: 16
  },
  likesCountText: {
    marginLeft: SPACING.half,
    fontSize: 16
  }
});

const SeparatorComponent = () => (
  <View style={{ width: "100%", height: CELL_SPACING }} collapsable={false} />
);

const ThreadCell = ({
  thread,
  onPress,
  width: _width,
  isLonelyCell = false,
  height,
  paused,
  isLeftSide
}: {
  thread: ViewThreads_postThreads;
  onPress: Function;
  width: number;
  height: number;
}) => {
  const width = _width;
  console.time(
    `Loaded ${thread.firstPost.media.id} ${thread.firstPost.media.mimeType}`
  );
  const handleLoad = React.useCallback(() => {
    console.timeEnd(
      `Loaded ${thread.firstPost.media.id} ${thread.firstPost.media.mimeType}`
    );
  }, []);

  const handlePress = React.useCallback(() => {
    onPress(thread);
  }, [thread, onPress]);

  const profile = thread.firstPost.profile;

  const handleFinish = React.useCallback(() => {}, []);

  return (
    <View
      style={{
        width: isLonelyCell ? "100%" : _width,
        height
      }}
    >
      <BaseButton exclusive={false} onPress={handlePress}>
        <View
          style={[
            threadStyles.container,
            {
              width: _width,
              height,
              backgroundColor: thread.firstPost.colors.primary
            }
          ]}
        >
          <View style={[threadStyles.layer, threadStyles.mediaLayer]}>
            <SharedElement id={`post.${thread.firstPost.id}.media`}>
              <Media
                containerWidth={_width}
                containerHeight={height}
                width={width}
                height={height}
                onLoad={handleLoad}
                size="thumbnail"
                hideContent={false}
                paused={paused}
                media={thread.firstPost.media}
              />
            </SharedElement>
          </View>

          <View style={[threadStyles.layer, threadStyles.gradientLayer]}>
            <OverlayGradient
              width={width}
              height={height}
              layoutDirection="column-reverse"
            />
          </View>

          <View style={[threadStyles.layer, threadStyles.overlayLayer]}>
            <View style={threadStyles.header}>
              <View style={threadStyles.remixCount}>
                <IconRemix size={28} color="#fff" />

                <SemiBoldText style={threadStyles.remixCountText}>
                  {thread.postsCount - 1}
                </SemiBoldText>
              </View>
            </View>
            <View style={threadStyles.footer}>
              <View style={threadStyles.profile}>
                <Avatar
                  label={profile.username}
                  size={24}
                  url={profile.photoURL}
                />
                <SemiBoldText style={threadStyles.username}>
                  {profile.username}
                </SemiBoldText>
              </View>

              <View style={threadStyles.likesCount}>
                <IconHeart size={14} color="#fff" />

                <SemiBoldText style={threadStyles.likesCountText}>
                  {thread.firstPost.likesCount}
                </SemiBoldText>
              </View>
            </View>
          </View>
        </View>
      </BaseButton>
    </View>
  );
};

const calculcateRowHeight = (
  rowNumber: number,
  postThreads: Array<ViewThreads_postThreads>
) => {
  const firstThread = postThreads[rowNumber * CELLS_PER_ROW];
  const secondThread = postThreads[rowNumber * CELLS_PER_ROW + 1];

  return Math.min(
    MAX_CELL_HEIGHT,
    min(
      [
        firstThread &&
          Math.max(
            // scaleToWidth(
            //   CELL_WIDTH - CELL_SPACING / 2 - CELL_SPACING / 4,
            //   pxBoundsToPoint(
            //     firstThread.firstPost.bounds,
            //     firstThread.firstPost.media.pixelRatio
            //   )
            // ).height
            scaleToWidth(
              CELL_WIDTH - CELL_SPACING / 2,
              pxBoundsToPoint(
                firstThread.firstPost.media,
                firstThread.firstPost.media.pixelRatio
              )
            ).height
          ),
        secondThread &&
          Math.max(
            // scaleToWidth(
            //   CELL_WIDTH - CELL_SPACING / 2 - CELL_SPACING / 4,
            //   pxBoundsToPoint(
            //     secondThread.firstPost.bounds,
            //     secondThread.firstPost.media.pixelRatio
            //   )
            // ).height
            scaleToWidth(
              CELL_WIDTH - CELL_SPACING / 2,
              pxBoundsToPoint(
                secondThread.firstPost.media,
                secondThread.firstPost.media.pixelRatio
              )
            ).height
          )
      ].filter(Boolean)
    )
  );
};

type RowHeightEntry = {
  height: number;
  offset: number;
};

class ThreadList extends React.PureComponent<
  Props,
  { rowHeights: Array<RowHeightEntry> }
> {
  constructor(props: Props) {
    super(props);

    this.state = {
      rowHeights: [],
      postThreads: props.postThreads
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (props.postThreads.length !== state.postThreads.length) {
      newState.postThreads = props.postThreads;

      const rowHeights: Array<RowHeightEntry> = [];
      let offset = 0;

      range(0, Math.ceil(props.postThreads.length / CELLS_PER_ROW)).forEach(
        (row, index) => {
          const height = calculcateRowHeight(row, props.postThreads);

          rowHeights[row] = {
            height,
            offset
          };

          offset = offset + height;
        }
      );

      newState.rowHeights = rowHeights;
    }

    return newState;
  }

  openPlus = () => this.props.navigation.navigate("NewPostStack");

  handlePressSend = post => {
    const thread = this.state.postThreads[this.state.threadOffset];

    this.props.navigation.push("ReplyStack", {
      threadId: thread.id,
      thread: thread,
      post
    });
  };
  handlePressDownload = () => {};

  getItemLayout = (_data, index) => {
    const rowNumber = Math.floor(index / CELLS_PER_ROW);
    const rowHeight = this.state.rowHeights[rowNumber];

    return {
      length: rowHeight.height + CELL_SPACING,
      offset: rowHeight.offset + Math.max(CELL_SPACING * rowNumber - 1, 0),
      index
    };
  };

  keyExtractor = (item: ViewThreads_postThreads, _index: number) => item.id;

  handleOpenThread = (thread: ViewThreads_postThreads) => {
    this.props.navigation.navigate("ViewThread", {
      thread,
      threadId: thread.id
    });
  };

  handleRenderItem = ({ item, index, ...other }) => {
    const rowNumber = Math.floor(index / CELLS_PER_ROW);
    const isLonelyCell =
      index === this.state.postThreads.length - 1 && index % 2 === 0;
    return (
      <ThreadCell
        maxHeight={MAX_CELL_HEIGHT}
        height={this.state.rowHeights[rowNumber].height}
        width={CELL_WIDTH}
        isLeftSide={index % 2 === 0}
        onPress={this.handleOpenThread}
        isLonelyCell={isLonelyCell}
        thread={item}
      />
    );
  };

  render() {
    const { postThreads = [] } = this.state;

    return (
      <Animated.View style={[styles.page]}>
        <FlatList
          data={postThreads}
          renderItem={this.handleRenderItem}
          numColumns={CELLS_PER_ROW}
          keyExtractor={this.keyExtractor}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="always"
          ItemSeparatorComponent={SeparatorComponent}
          contentInset={{
            top: TOP_Y
          }}
          contentOffset={{
            y: TOP_Y * -1,
            x: 0
          }}
          contentInsetAdjustmentBehavior="never"
          removeClippedSubviews
          getItemLayout={this.getItemLayout}
          columnWrapperStyle={{
            justifyContent: "space-evenly",
            alignItems: "flex-start",
            overflow: "hidden",
            // flex: 1,
            width: "100%"
          }}
        />
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  postList: {},
  postListItem: {
    borderRadius: 12,
    backgroundColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.25,
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 0
    }
  },
  wrapper: {
    backgroundColor: "#000",
    flex: 1
  },
  page: {
    flex: 1,
    flexDirection: LAYOUT_DIRECTION
  }
});

const ThreadListScreen = withNavigation(ThreadList);

export default hoistNonReactStatics(
  props => (
    <Query notifyOnNetworkStatusChange query={VIEW_THREADS_QUERY}>
      {({ data: { postThreads = [] } = {}, ...otherProps }) => {
        return <ThreadListScreen postThreads={postThreads} {...otherProps} />;
      }}
    </Query>
  ),
  ThreadList
);
