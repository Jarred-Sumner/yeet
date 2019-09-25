// @flow
import { memoize, uniqBy } from "lodash";
import * as React from "react";
import { Query } from "react-apollo";
import { StyleSheet, View, InteractionManager } from "react-native";
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
import { transformOrigin } from "react-native-redash";
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
        set(state.finished, 0),
        set(state.time, 0),
        set(state.position, value),
        set(state.frameTime, 0),
        set(config.toValue, dest)
      ])
    ),
    // animationBlock
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

const FooterProfile = ({ profile }) => (
  <View style={threadStyles.footer}>
    <View style={threadStyles.profile}>
      <Avatar label={profile.username} size={36} url={profile.photoURL} />
      <SemiBoldText style={threadStyles.username}>
        {profile.username}
      </SemiBoldText>
    </View>
  </View>
);

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
  changingPostValue = new Animated.Value(1);

  constructor(props) {
    super(props);

    const isPlaying = props.isVisible;
    this.playValue = new Animated.Value<number>(isPlaying ? 1 : 0);

    this.state = { postIndex: 0, isPlaying, autoAdvance: isPlaying };

    this.progressClock = new Animated.Clock();
    this.durationValue = new Animated.Value<number>(this.autoplayDuration);
    this.playId = new Animated.Value(-1);

    this._progressValue = runTiming({
      clock: this.progressClock,
      value: 0,
      dest: 1,
      duration: this.autoplayDuration,
      onComplete: this.handlePostEnded,
      isPlaying: this.playValue,
      key: this.playId
    });
    this.progressValue = this.changingPostValue.interpolate({
      inputRange: [0, 1],
      outputRange: [
        Animated.multiply(this._progressValue, this.changingPostValue),
        this._progressValue
      ],
      extrapolate: Animated.Extrapolate.CLAMP
    });

    this.segmentRefs = {};
    props.posts.forEach(
      post => (this.segmentRefs[post.id] = React.createRef())
    );
  }

  segmentRefs: { [key: string]: React.Ref<View> } = {};

  componentDidUpdate(prevProps) {
    const visibilityChange =
      this.props.isVisible !== prevProps.isVisible ||
      this.props.isNextVisible !== prevProps.isNextVisible ||
      this.props.isPreviousVisible !== prevProps.isPreviousVisible;

    if (
      this.props.posts !== prevProps.posts ||
      this.props.posts.length !== prevProps.posts.length
    ) {
      this.props.posts.forEach(post => {
        if (!this.segmentRefs[post.id]) {
          this.segmentRefs[post.id] = React.createRef();
        }
      });
    }

    if (visibilityChange && this.props.isVisible) {
      this.play();
    } else if (visibilityChange && !this.props.isVisible) {
      this.pause();
    }
  }

  handlePostEnded = async () => {
    this.goNext();
  };

  skip = () => {
    this.goNext();
  };

  goNext = async () => {
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

      await this.loadNextPost(postIndex);

      if (this.loadedPostIds[nextPost.id]) {
        this.startProgressAnimation();
      }
    }
  };

  postIndexValue = new Animated.Value(0);

  loadNextPost = (postIndex: number) => {
    return new Promise((resolve, reject) => {
      this.playValue.setValue(0);
      this.changingPostValue.setValue(1);
      let _hasResolved = false;
      Animated.timing(this.changingPostValue, {
        toValue: 0,
        duration: 300,
        easing: Easing.cubic
      }).start(({ finished }) => {
        if (finished && this.state.postIndex !== postIndex) {
          this.setState({ postIndex }, () => {
            !_hasResolved && resolve();
            _hasResolved = true;
          });
        }
      });

      Animated.timing(this.postIndexValue, {
        toValue: postIndex,
        duration: 300,
        easing: Easing.cubic
      }).start(({ finished }) => {
        if (finished && this.state.postIndex !== postIndex) {
          this.setState({ postIndex }, () => {
            !_hasResolved && resolve();
            _hasResolved = true;
          });
        }
      });
    });
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
    this.playId.setValue(this.post.id.hashCode());
    this.playValue.setValue(1);

    console.log("START PROGRESS", this.state.postIndex, this.post.id);
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

  renderPost = (post, index) => {
    const {
      offset,
      isVisible,
      isNextVisible,
      isPreviousVisible,
      width,
      height
    } = this.props;
    const { isPlaying } = this.state;

    const SCALE_BEFORE = 0.75;
    const SCALE_AFTER = 0.75;

    return (
      <Animated.View
        key={post.id}
        style={{
          width,
          height,
          overflow: "hidden",
          position: "absolute",

          transform: transformOrigin(
            new Animated.Value(0),
            new Animated.Value(0),
            {
              scale: this.postIndexValue.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [SCALE_BEFORE, 1, SCALE_AFTER],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            },
            {
              translateX: this.postIndexValue.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [
                  (1.0 + 1.0 - SCALE_BEFORE) * width * index,
                  1 * width * index,
                  (1.0 + 1.0 - SCALE_AFTER) * width * index
                ],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            },
            {
              translateY: this.postIndexValue.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [height * -0.05, 0, height * -0.05],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            }
          )
        }}
      >
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
            hideContent={
              (!isVisible && this.state.postIndex !== index) ||
              isNextVisible ||
              isPreviousVisible
            }
            paused={!isPlaying || this.state.postIndex !== index}
            width={width}
            height={height}
            onPressLike={this.handlePressLike}
            onPressReply={this.handlePressReply}
          />

          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "black",
                zIndex: 10,
                opacity: this.postIndexValue.interpolate({
                  inputRange: [
                    index - 1,
                    index,
                    index + 0.05,
                    index + 0.2,
                    index + 1
                  ],
                  outputRange: [0, 0, 0.15, 0.65, 1],
                  extrapolate: Animated.Extrapolate.CLAMP
                })
              }
            ]}
          />
        </View>
      </Animated.View>
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
            backgroundColor: "black"
          }
        ]}
      >
        <Animated.View
          style={{
            width,

            height
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              width,

              height,
              transform: [
                {
                  translateX: Animated.multiply(this.postIndexValue, width * -1)
                }
              ]
            }}
          >
            {posts.map(this.renderPost)}
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
            <FooterProfile profile={post.profile} />

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
                  count={thread.postsCount}
                  onPress={this.handlePressReply}
                />

                <View style={{ height: 35, width: 1 }} />

                <VerticalIconButton
                  Icon={IconHeart}
                  size={VerticalIconButtonSize.default}
                  onPress={this.handlePressLike}
                  count={post.likesCount}
                />

                <View style={{ height: 35, width: 1 }} />

                <View
                  style={{
                    opacity:
                      this.state.postIndex < this.props.posts.length - 1 ? 1 : 0
                  }}
                >
                  <VerticalIconButton
                    Icon={IconChevronRight}
                    count={null}
                    onPress={this.skip}
                    size={VerticalIconButtonSize.default}
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
        {posts.length > 1 && (
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
              segmentRefs={this.segmentRefs}
              postId={this.post.id}
              indexValue={this.postIndexValue}
              percentage={this.progressValue}
              changingPostValue={this.changingPostValue}
            />
          </View>
        )}
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
