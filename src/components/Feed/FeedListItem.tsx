// @flow
import { sum } from "lodash";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { BaseButton } from "react-native-gesture-handler";
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
import { PostPreviewList, POST_LIST_HEIGHT } from "./PostPreviewList";
import { ProfileFeedComponent, PROFILE_FEED_HEIGHT } from "./ProfileFeed";
import { SCREEN_DIMENSIONS } from "../../../config";

const MAX_CONTENT_HEIGHT = SCREEN_DIMENSIONS.height * 0.6;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000"
  },
  mediaPlayerWrapper: {
    maxHeight: MAX_CONTENT_HEIGHT,
    overflow: "hidden"
  },
  previewBar: {
    backgroundColor: "rgb(42, 42, 42)",
    width: 4,
    borderRadius: 8,
    marginRight: SPACING.normal
  },
  viewAllText: {
    color: COLORS.muted,
    fontSize: 16
  },
  viewAllTextContainer: {
    marginTop: SPACING.normal,
    marginLeft: SPACING.double + 4
  }
});

type Props = {
  thread: ViewThreads_postThreads_data;
  height: number;
  width: number;
  paused: Boolean;
  onPressPost: PressPostFunction;
};

const getContentSize = (
  post: PostListItemFragment,
  width: number,
  maxHeight = MAX_CONTENT_HEIGHT
) => {
  const size = scaleToWidth(width, post.media);

  return {
    ...size,
    height: maxHeight > 0 ? Math.min(size.height, maxHeight) : size.height
  };
};

const POST_SECTION_SPACING = SPACING.normal;
const VIEW_ALL_TEXT_HEIGHT = 20;

export const getItemHeight = (
  thread: ViewThreads_postThreads_data,
  width: number
) => {
  const post = thread.posts.data[0];

  return sum([PROFILE_FEED_HEIGHT, POST_LIST_HEIGHT, SPACING.normal]);
};

enum PlayState {
  pausedInvisible = "pausedInvisible",
  userPaused = "userPaused",
  playing = "playing"
}

type State = {
  autoPlay: boolean;
  play: PlayState;
};

class FeedListItemComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      autoPlay: props.isVisible,
      play: props.isVisible ? PlayState.playing : PlayState.pausedInvisible
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

  handlePressElipsis = () => {};
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

  render() {
    const { height, width, paused, thread, isVisible } = this.props;
    const {
      posts: { data: posts },
      postsCount
    } = thread;

    const post = posts[0];
    const op = post.profile;

    return (
      <View style={[{ height, width }, styles.container]}>
        <ProfileFeedComponent
          profile={op}
          createdAt={post.createdAt}
          body="u can't post something better"
          onPressEllipsis={this.handlePressElipsis}
        />
        <View style={styles.postPreviewContainer}>
          <PostPreviewList
            posts={posts}
            onPressPost={this.handlePressPost}
            style={styles.postPreviewList}
            directionalLockEnabled
            contentOffset={{
              y: 0,
              x: SPACING.normal * -1
            }}
            contentInset={{
              left: SPACING.normal,
              top: 0,
              bottom: 0,
              right: SPACING.normal
            }}
          ></PostPreviewList>
        </View>
      </View>
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
