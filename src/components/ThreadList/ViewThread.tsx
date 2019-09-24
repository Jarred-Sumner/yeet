// @flow
import { memoize, uniqBy } from "lodash";
import * as React from "react";
import { Query } from "react-apollo";
import { StyleSheet, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated, { Easing } from "react-native-reanimated";
import { SharedElement } from "react-navigation-shared-element";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { ViewPosts } from "../../lib/graphql/ViewPosts";
import { pxBoundsToPoint, scaleToWidth } from "../../lib/Rect";
import { SPACING } from "../../lib/styles";
import VIEW_POSTS_QUERY from "../../lib/ViewPosts.graphql";
import { Avatar } from "../Avatar";
import { BitmapIconNewPost } from "../BitmapIcon";
import { IconChevronRight, IconHeart } from "../Icon";
import Media from "../PostList/ViewMedia";
import { SemiBoldText } from "../Text";
import {
  VerticalIconButton,
  VerticalIconButtonSize
} from "../VerticalIconButton";
import { Seekbar } from "./Seekbar";
const {
  Clock,
  Value,
  set,
  cond,
  startClock,
  clockRunning,
  timing,
  debug,
  stopClock,
  block
} = Animated;

function runTiming({
  clock,
  value,
  dest,
  duration,
  onComplete,
  isPlaying,
  key
}: {
  clock: Animated.Clock;
  value: Animated.Value<number>;
  dest: number;
  duration: number;
  onComplete: () => {};
  isPlaying: Animated.Value<number>;
  key: Animated.Value<number>;
}) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration,
    toValue: new Value(0),
    easing: Easing.linear
  };

  const animationBlock = block([
    cond(
      clockRunning(clock),
      [
        // if the clock is already running we update the toValue, in case a new dest has been passed in
        set(config.toValue, dest)
      ],
      [
        // if the clock isn't running we reset all the animation params and start the clock
        set(state.finished, 0),
        set(state.time, 0),
        set(state.position, value),
        set(state.frameTime, 0),
        set(config.toValue, dest),
        startClock(clock)
      ]
    ),
    // we run the step here that is going to update position
    timing(clock, state, config),
    // if the animation is over we stop the clock
    cond(
      state.finished,
      block([stopClock(clock), Animated.call([], onComplete)])
    ),
    // we made the block return the updated position
    state.position
  ]);

  // return animationBlock;
  return block([
    Animated.onChange(
      key,
      cond(clockRunning(clock), [
        stopClock(clock),
        set(value, 0),
        set(state.position, value)
      ])
    ),
    Animated.cond(
      Animated.eq(key, -1),
      [value],
      cond(
        Animated.eq(isPlaying, 0),
        [stopClock(clock), state.position],
        animationBlock
      )
    )
  ]);
}

export const OverlayGradient = ({
  width,
  height,
  layoutDirection,
  topEndLocation = 0.1,
  bottomStartLocation = 0.7879
}) => {
  return (
    <LinearGradient
      width={width}
      height={height}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[bottomStartLocation, 1.0]}
      colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.15)"]}
    />
  );
};

const threadStyles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "visible"
  },
  counts: {
    alignItems: "center",
    overflow: "visible"
  },
  layer: {
    ...StyleSheet.absoluteFillObject
  },
  overlayLayer: {
    zIndex: 2,
    justifyContent: "flex-end"
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.half
  },
  footer: {
    flexDirection: "row",
    padding: SPACING.normal,
    justifyContent: "space-between",
    marginBottom: BOTTOM_Y
  },
  sidebar: {
    position: "absolute",
    bottom: BOTTOM_Y + 24,
    overflow: "visible",
    right: 0
  },
  header: {
    opacity: 1.0
  },
  progressBars: {
    opacity: 1.0,
    position: "absolute",
    justifyContent: "flex-end",
    height: 4,
    left: 0,
    right: 0
  },
  username: {
    fontSize: 20,
    marginLeft: SPACING.normal
  },
  likesCount: {
    color: "white",
    flexDirection: "row",
    alignItems: "center"
  },
  mediaLayer: {
    zIndex: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  gradientLayer: {
    zIndex: 1
  },
  remixCount: {
    color: "white",
    flexDirection: "row",
    justifyContent: "center",

    alignItems: "center",
    marginLeft: SPACING.normal
  },
  remixCountText: {
    marginLeft: SPACING.normal,

    fontSize: 20
  },
  likesCountText: {
    marginLeft: SPACING.normal,
    fontSize: 20
  }
});

const ViewPost = ({
  post,
  threadId,
  width,
  progressValue,
  hideContent = false,
  height,
  isVisible,
  isNextVisible,
  isPreviousVisible,
  postsCount,
  onPressReply,
  onPressLike,

  onLoad,
  offset,
  paused
}) => {
  const profile = post.profile;

  const { height: trueHeight } = scaleToWidth(
    width,
    pxBoundsToPoint(post.media, post.media.pixelRatio)
  );

  const handleLoad = React.useCallback(
    data => {
      onLoad(post.id, data);
    },
    [onLoad, post.id]
  );

  return (
    <>
      <Animated.View style={[threadStyles.layer, threadStyles.mediaLayer]}>
        <SharedElement
          style={{ width, height: trueHeight }}
          id={`post.${post.id}.media`}
        >
          <Media
            containerWidth={width}
            containerHeight={trueHeight}
            // translateY={translateYValue.current}
            width={width}
            height={trueHeight}
            onLoad={handleLoad}
            size="full"
            hideContent={hideContent}
            paused={paused}
            media={post.media}
          />
        </SharedElement>
      </Animated.View>

      <View style={[threadStyles.layer, threadStyles.gradientLayer]}>
        <OverlayGradient
          width={width}
          bottomStartLocation={
            (SCREEN_DIMENSIONS.height - BOTTOM_Y - 60 - SPACING.double) /
            SCREEN_DIMENSIONS.height
          }
          height={height}
          layoutDirection="column-reverse"
        />
      </View>

      <View style={[threadStyles.layer, threadStyles.overlayLayer]}>
        <View style={threadStyles.progressBar}></View>

        <View style={threadStyles.footer}>
          <View style={threadStyles.profile}>
            <Avatar label={profile.username} size={36} url={profile.photoURL} />
            <SemiBoldText style={threadStyles.username}>
              {profile.username}
            </SemiBoldText>
          </View>
        </View>

        <View style={threadStyles.sidebar}>
          <View style={threadStyles.counts}>
            <VerticalIconButton
              iconNode={
                <View
                  style={{
                    width: 39,
                    height: 29,
                    overflow: "visible"
                  }}
                >
                  <BitmapIconNewPost
                    style={{
                      height: 39,
                      width: 39,
                      position: "absolute",
                      right: -4,
                      top: 0,
                      overflow: "visible"
                    }}
                  />
                </View>
              }
              size={VerticalIconButtonSize.default}
              count={postsCount}
              onPress={onPressReply}
            />

            <View style={{ height: 35, width: 1 }} />

            <VerticalIconButton
              Icon={IconHeart}
              size={VerticalIconButtonSize.default}
              onPress={onPressLike}
              count={post.likesCount}
            />

            <View style={{ height: 35, width: 1 }} />

            <VerticalIconButton
              Icon={IconChevronRight}
              count={null}
              size={VerticalIconButtonSize.default}
            />
          </View>
        </View>
      </View>
    </>
  );
};

class ThreadContainer extends React.Component {
  progressValue: Animated.Value<number>;
  progressClock: Animated.Clock;
  durationValue: Animated.Value<number>;
  playId: Animated.Value<number>;
  playValue: Animated.Value<number>;
  loadedPostIds = {};

  constructor(props) {
    super(props);

    const isPlaying = props.isVisible;
    this.playValue = new Animated.Value<number>(isPlaying ? 1 : 0);

    this.state = { postIndex: 0, isPlaying, autoAdvance: isPlaying };

    this.progressClock = new Animated.Clock();
    this.durationValue = new Animated.Value<number>(this.autoplayDuration);
    this.playId = new Animated.Value(-1);

    this.progressValue = runTiming({
      clock: this.progressClock,
      value: 0,
      dest: 1,
      duration: this.autoplayDuration,
      onComplete: this.handlePostEnded,
      isPlaying: this.playValue,
      key: this.playId
    });
  }

  componentDidUpdate(prevProps) {
    const visibilityChange =
      this.props.isVisible !== prevProps.isVisible ||
      this.props.isNextVisible !== prevProps.isNextVisible ||
      this.props.isPreviousVisible !== prevProps.isPreviousVisible;

    if (visibilityChange && this.props.isVisible) {
      this.play();
    } else if (visibilityChange && !this.props.isVisible) {
      this.pause();
    }
  }

  handlePostEnded = () => {
    const postIndex = this.state.postIndex + 1;
    const hasNextPost = postIndex < this.props.posts.length;

    console.log(
      "POST ENDED!",
      this.props.posts,
      this.props.thread.id,
      this.state.postIndex
    );

    if (hasNextPost && this.state.autoAdvance) {
      const nextPost = this.props.posts[postIndex];

      this.setState({
        postIndex
      });

      if (this.loadedPostIds[nextPost.id]) {
        this.startProgressAnimation();
      }

      this.flatListRef.current.scrollToIndex({
        index: postIndex,
        animated: false
      });
    }
  };

  get post() {
    return this.props.posts[this.state.postIndex] || this.props.posts[0];
  }

  get nextPost() {
    return this.props.posts[this.state.postIndex + 1];
  }

  get autoplayDuration() {
    return Math.floor(this.post.autoplaySeconds * 1000);
  }

  play = () => {
    this.setState({
      isPlaying: true,
      autoAdvance: true
    });

    if (this.isPostLoaded) {
      this.startProgressAnimation();
    }
  };

  get isPostLoaded() {
    return this.loadedPostIds[this.post.id] === true;
  }

  startProgressAnimation = () => {
    this.playValue.setValue(1);
    this.playId.setValue(this.post.id.hashCode());
  };

  onMediaPlay = () => {};

  onLoad = (postId, { currentTime, duration }) => {
    this.loadedPostIds[postId] = true;

    if (this.state.isPlaying && postId === this.post.id) {
      this.startProgressAnimation();
    }
  };

  onMediaPause = () => {};

  pause = () => {
    this.setState({
      isPlaying: false,
      autoAdvance: false
    });
    this.playValue.setValue(0);
  };

  renderPost = ({ item: post, index }) => {
    const {
      offset,
      isVisible,
      isNextVisible,
      isPreviousVisible,
      width,
      height
    } = this.props;
    const { isPlaying } = this.state;

    return (
      <View style={{ width, height, position: "relative" }}>
        <ViewPost
          post={post}
          offset={offset}
          isVisible={isVisible}
          isNextVisible={isNextVisible}
          onLoad={this.onLoad}
          isPreviousVisible={isPreviousVisible}
          postsCount={this.props.thread.postsCount}
          progressValue={this.progressValue}
          hideContent={!(isVisible || isNextVisible || isPreviousVisible)}
          paused={!isPlaying || this.state.postIndex !== index}
          width={width}
          height={height}
          onPressLike={this.handlePressLike}
          onPressReply={this.handlePressReply}
        />
      </View>
    );
  };

  handlePressReply = () => {
    this.props.onPressReply({
      threadId: this.props.thread.id,
      thread: this.props.thread.id,
      post: this.post
    });
  };

  getItemLayout = (data: Array<PostFragment>, index: number) => {
    return {
      // length: data[index].height + SPACING.normal,
      length: this.props.width,
      offset: this.props.width * index,
      index
    };
  };

  static _extraData = memoize(
    (postIndex: number, isPlaying: boolean, isVisible: boolean) => {
      return {
        postIndex: postIndex,
        isPlaying: isPlaying,
        isVisible: isVisible
      };
    }
  );

  getExtraData = () => {
    return ThreadContainer._extraData(
      this.state.postIndex,
      this.state.isPlaying,
      this.props.isVisible
    );
  };

  flatListRef = React.createRef<FlatList>();
  keyExtractor = item => item.id;

  render() {
    const {
      thread,
      posts,
      scrollVelocity,
      scrollYOffset,
      offset,
      height,
      isVisible,
      isNextVisible,
      isPreviousVisible,
      width,
      paused
    } = this.props;

    const post = this.post;

    return (
      <Animated.View
        style={[
          threadStyles.container,
          {
            width: width,
            height,
            overflow: "hidden",
            backgroundColor: post.colors.background
          }
        ]}
      >
        <FlatList
          horizontal
          data={this.props.posts}
          renderItem={this.renderPost}
          windowSize={2}
          ref={this.flatListRef}
          keyExtractor={this.keyExtractor}
          contentInsetAdjustmentBehavior="never"
          directionalLockEnabled
          extraData={this.getExtraData()}
          contentOffset={{
            x: 0,
            y: 0
          }}
          getItemLayout={this.getItemLayout}
          scrollEnabled={false}
          style={{
            width,
            height
          }}
        />

        <View
          style={{
            position: "absolute",
            bottom: BOTTOM_Y,
            flexDirection: "row",
            alignItems: "center",
            left: SPACING.normal,
            display: isVisible ? "flex" : "none"
          }}
        >
          <Seekbar
            posts={posts}
            postId={this.post.id}
            percentage={this.progressValue}
          />
        </View>
      </Animated.View>
    );
  }
}

export const ViewThread = ({ isVisible, thread, ...otherProps }) => {
  return (
    <Query
      query={VIEW_POSTS_QUERY}
      skip={!isVisible}
      notifyOnNetworkStatusChange
      variables={{
        threadId: thread.id,
        limit: 10,
        offset: 0
      }}
    >
      {({ data: { posts = [] } = {}, fetchMore, ...apollo }: ViewPosts) => (
        <ThreadContainer
          isVisible={isVisible}
          thread={thread}
          posts={uniqBy([thread.firstPost, ...posts], "id")}
          {...otherProps}
        />
      )}
    </Query>
  );
};
