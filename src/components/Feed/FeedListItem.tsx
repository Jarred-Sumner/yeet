// @flow
import { sum } from "lodash";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  BaseButton,
  ScrollView,
  LongPressGestureHandler,
  TouchableWithoutFeedback
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { PostListItemFragment } from "../../lib/graphql/PostListItemFragment";
import {
  ViewThreads_postThreads,
  ViewThreads_postThreads_data
} from "../../lib/graphql/ViewThreads";
import { scaleToWidth } from "../../lib/Rect";
import { SPACING, COLORS } from "../../lib/styles";
import MediaPlayer, { MediaPlayerComponent } from "../MediaPlayer";
import { MediumText } from "../Text";
import { ACTION_BAR_HEIGHT, ContentActionBar } from "./ContentActionBar";
import {
  PostPreviewList,
  POST_LIST_HEIGHT,
  POST_LIST_WIDTH,
  postPreviewListHeight
} from "./PostPreviewList";
import { ProfileFeedComponent, PROFILE_FEED_HEIGHT } from "./ProfileFeed";
import { SCREEN_DIMENSIONS } from "../../../config";
import { IconChevronRight } from "../Icon";
import { getContentSize, MAX_CONTENT_HEIGHT } from "./FeedList";

const POST_COUNT_BAR = 20 + SPACING.normal * 2;
// const POST_COUNT_BAR = SPACING.normal;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000"
  },
  mediaPlayerWrapper: {
    maxHeight: MAX_CONTENT_HEIGHT,
    overflow: "hidden"
  },
  viewAllText: {
    color: COLORS.muted,
    fontSize: 16
  },
  viewAllTextContainer: {
    marginTop: SPACING.normal,
    marginLeft: SPACING.double + 4
  },
  postCountBar: {
    flexDirection: "row",
    paddingVertical: SPACING.normal,
    paddingHorizontal: SPACING.normal,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  postCountText: {
    fontSize: 16,
    color: "#ccc",
    alignItems: "center"
  },
  rightChevron: {
    marginLeft: SPACING.half,
    alignItems: "center",
    alignSelf: "center",
    lineHeight: 14
  }
});

type Props = {
  thread: ViewThreads_postThreads_data;
  height: number;
  width: number;
  paused: Boolean;
  onPressPost: PressPostFunction;
};

const POST_SECTION_SPACING = SPACING.normal;
const VIEW_ALL_TEXT_HEIGHT = 20;

export const getItemHeight = (
  thread: ViewThreads_postThreads_data,
  width: number
) => {
  return sum([
    PROFILE_FEED_HEIGHT,
    postPreviewListHeight(thread.posts.data.slice(0, 4)),
    POST_COUNT_BAR
  ]);
};

enum PlayState {
  pausedInvisible = "pausedInvisible",
  userPaused = "userPaused",
  playing = "playing"
}

type State = {
  autoPlay: boolean;
  play: PlayState;
  height: number;
};

class FeedListItemComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      autoPlay: props.isVisible,
      play: props.isVisible ? PlayState.playing : PlayState.pausedInvisible,
      height: postPreviewListHeight(props.thread.posts.data.slice(0, 4))
    };
  }

  componentDidUpdate(prevProps) {
    const { isVisible } = this.props;

    if (
      prevProps.isVisible !== isVisible &&
      this.state.play === PlayState.playing
    ) {
      this.setState({
        play: isVisible ? PlayState.playing : PlayState.pausedInvisible
      });
    }
  }

  handlePressElipsis = () => {
    this.handleLongPress();
  };
  handlePressViewAll = () => {};

  mediaPlayerRef = React.createRef<MediaPlayerComponent>();

  get paused() {
    if (this.state.play === PlayState.playing) {
      return false;
    }

    if (this.state.play === PlayState.userPaused) {
      return true;
    }

    return (
      this.state.play === PlayState.pausedInvisible && !this.props.isVisible
    );
  }

  scrollRef = React.createRef<ScrollView>();
  handleLongPress = () => this.props.onLongPressThread(this.props.thread);
  handlePress = () => this.props.onPressThread(this.props.thread);
  handlePressPost = (post: ViewThreads_postThreads_data) =>
    this.props.onPressPost(this.props.thread, post);
  handlePressNewPost = () => this.props.onPressNewPost(this.props.thread);

  contentInset = {
    left: SPACING.normal,
    top: 0,
    bottom: 0,
    right: SPACING.normal
  };

  contentOffset = {
    y: 0,
    x: SPACING.normal * -1
  };

  render() {
    const {
      height,
      width,
      paused,
      thread,
      isVisible,
      onPressProfile
    } = this.props;
    const {
      posts: { data: posts },
      postsCount,
      body,
      createdAt,
      profile: op
    } = thread;

    const waitFor = [...this.props.waitFor, this.scrollRef];

    return (
      <TouchableWithoutFeedback onLongPress={this.handleLongPress}>
        <Animated.View style={[{ height, width }, styles.container]}>
          <ProfileFeedComponent
            profile={op}
            createdAt={thread.createdAt}
            onPressProfile={onPressProfile}
            body={body}
            onPressEllipsis={this.handlePressElipsis}
          />
          <View style={styles.postPreviewContainer}>
            <PostPreviewList
              posts={posts}
              onPressPost={this.handlePressPost}
              style={styles.postPreviewList}
              ref={this.scrollRef}
              isVisible={isVisible}
              paused={!isVisible}
              height={this.state.height}
              onPressNewPost={this.handlePressNewPost}
              directionalLockEnabled
              waitFor={this.props.waitFor}
              contentOffset={this.contentOffset}
              contentInset={this.contentInset}
            ></PostPreviewList>
          </View>

          <View style={styles.bar}>
            <TouchableWithoutFeedback onPress={this.handlePress}>
              <Animated.View style={styles.postCountBar}>
                <MediumText style={styles.postCountText}>
                  {postsCount > 1
                    ? `View ${postsCount} posts`
                    : "View all posts"}
                </MediumText>
                <IconChevronRight
                  style={styles.rightChevron}
                  size={14}
                  onPress={this.handleLongPress}
                  color="#666"
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}

export const FeedListItem = ({
  thread,
  height,
  firstVisibleItem,
  secondVisibleItem,
  width,
  hashId,
  isVisible,
  ...otherProps
}) => {
  // const isVisibleNode = React.useRef(new Animated.Value(0));
  // const [isVisible, setVisible] = React.useState(false);

  // const updateIsVisible = React.useCallback(
  //   ([isVisibleValue]) => {
  //     setVisible(isVisibleValue === 0 ? false : true);
  //   },
  //   [setVisible]
  // );

  // Animated.useCode(
  //   () =>
  //     Animated.block([
  //       Animated.set(
  //         isVisibleNode.current,
  //         Animated.or(
  //           Animated.eq(firstVisibleItem, hashId),
  //           Animated.eq(secondVisibleItem, hashId)
  //         )
  //       ),
  //       Animated.onChange(
  //         isVisibleNode.current,
  //         Animated.call([isVisibleNode.current], updateIsVisible)
  //       )
  //     ]),
  //   [
  //     firstVisibleItem,
  //     secondVisibleItem,
  //     hashId,
  //     isVisibleNode,
  //     updateIsVisible
  //   ]
  // );

  return (
    <FeedListItemComponent
      {...otherProps}
      thread={thread}
      height={height}
      width={width}
      isVisible={isVisible}
    />
  );
};
