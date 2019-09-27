// @flow
import { memoize, uniqBy } from "lodash";
import * as React from "react";
import { Query } from "react-apollo";
import {
  StyleSheet,
  View,
  findNodeHandle,
  UIManager,
  InteractionManager
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated, { Easing } from "react-native-reanimated";
import { transformOrigin } from "react-native-redash";
import { SharedElement } from "react-navigation-shared-element";
import { BOTTOM_Y, SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { ViewPosts } from "../../lib/graphql/ViewPosts";
import { pxBoundsToPoint, scaleToWidth } from "../../lib/Rect";
import { SPACING } from "../../lib/styles";
import VIEW_POSTS_QUERY from "../../lib/ViewPosts.graphql";
import { Avatar } from "../Avatar";
import { BitmapIconNewPost } from "../BitmapIcon";
import { IconHeart } from "../Icon";
import Media from "../PostList/ViewMedia";
import { SemiBoldText } from "../Text";
import { CountButton } from "./CountButton";
import { Seekbar, BAR_HEIGHT } from "./Seekbar";
import { TAB_BAR_OFFSET } from "../BottomTabBar";
import { useLayout } from "react-native-hooks";

const AVATAR_SIZE = 36;

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
        debug("Restart progress bar", state.position),
        startClock(clock)
      ]
    ),
    // we run the step here that is going to update position
    timing(clock, state, config),
    debug("Tick progress bar", state.position),
    // if the animation is over we stop the clock
    cond(
      state.finished,
      block([
        stopClock(clock),
        set(state.finished, 0),
        set(state.position, 0),
        set(state.time, 0),
        set(state.frameTime, 0),
        startClock(clock),
        Animated.call([], onComplete)
      ])
    ),
    // we made the block return the updated position
    state.position
  ]);

  return animationBlock;
  // return block([
  //   Animated.eq(isPlaying, 0),
  //   [
  //     cond(
  //       clockRunning(clock),
  //       [
  //         stopClock(clock),

  //         set(state.finished, 0),
  //         set(state.time, 0),
  //         set(state.position, value),
  //         set(state.frameTime, 0),
  //         set(config.toValue, dest),
  //         startClock(clock),
  //         state.position
  //       ],
  //       1
  //     )
  //   ],
  //   animationBlock
  // ]);
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
      locations={[0, topEndLocation, bottomStartLocation, 1.0]}
      colors={[
        "rgba(0,0,0,0.15)",
        "rgba(0,0,0,0)",
        "rgba(0,0,0,0.0)",
        "rgba(0,0,0,0.25)"
      ]}
    />
  );
};

const threadStyles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "visible"
  },
  sidebar: {
    alignItems: "flex-end",
    flex: 0,
    width: SCREEN_DIMENSIONS.width,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: SPACING.normal
  },
  counts: {
    alignItems: "center",
    overflow: "visible",
    flexDirection: "row"
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
    paddingHorizontal: SPACING.normal
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between"
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
  },
  header: {
    // marginTop: TOP_Y,
    alignItems: "flex-start",
    justifyContent: "center"
  }
});

const Profile = React.forwardRef(({ profile, onLayout, hideText }, ref) => (
  <View style={threadStyles.footer}>
    <View style={threadStyles.profile}>
      <View ref={ref} onLayout={onLayout}>
        <Avatar
          label={profile.username}
          size={AVATAR_SIZE}
          url={profile.photoURL}
        />
      </View>
      <SemiBoldText
        style={[threadStyles.username, hideText && { display: "none" }]}
      >
        {profile.username}
      </SemiBoldText>
    </View>
  </View>
));

const AnimatedProfile = React.forwardRef(
  (
    {
      profile,
      progressValue,
      x,
      y,
      width,
      height,
      endX,
      endY,
      animated = false,
      isAnimatingNextPost,
      parentHeight
    },
    ref
  ) => {
    if (animated) {
      const animationProgress = Animated.cond(
        Animated.eq(isAnimatingNextPost, 0),
        0,
        progressValue
      );

      const top = Animated.interpolate(animationProgress, {
        inputRange: [0, 1],
        outputRange: [endY, Animated.sub(y, BAR_HEIGHT + 1)],
        extrapolate: Animated.Extrapolate.CLAMP
      });

      const left = Animated.interpolate(animationProgress, {
        inputRange: [0, 1],
        outputRange: [endX, Animated.sub(x, BAR_HEIGHT)],
        extrapolate: Animated.Extrapolate.CLAMP
      });

      return (
        <Animated.View
          style={{
            position: "absolute",
            opacity: isAnimatingNextPost,
            overflow: "visible",
            top: top,
            left: left,
            width,
            height,
            transform: [
              {
                scale: Animated.interpolate(animationProgress, {
                  inputRange: [0, 1],
                  outputRange: [1, Animated.divide(width, AVATAR_SIZE)]
                })
              }
            ]
          }}
        >
          <Avatar
            label={profile.username}
            size={AVATAR_SIZE}
            url={profile.photoURL}
          />
        </Animated.View>
      );
    } else {
      const animationProgress = Animated.cond(
        Animated.eq(isAnimatingNextPost, 0),
        1,
        progressValue
      );

      return (
        <Animated.View
          style={{
            opacity: 1,
            transform: [
              {
                translateX: Animated.interpolate(animationProgress, {
                  inputRange: [0, 1],
                  outputRange: [SCREEN_DIMENSIONS.width * -1, 0],
                  extrapolate: Animated.Extrapolate.CLAMP
                })
              }
            ]
          }}
        >
          <Profile ref={ref} profile={profile} />
        </Animated.View>
      );
    }
  }
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
  loadedPostIds = {};
  progressValue = new Animated.Value(0);
  isAnimatingNextPost = new Animated.Value(0);

  constructor(props) {
    super(props);

    const isPlaying = props.isVisible;

    this.state = { postIndex: 0, isPlaying, autoAdvance: isPlaying };

    this.progressClock = new Animated.Clock();
    this.durationValue = new Animated.Value<number>(this.autoplayDuration);

    this.segmentRefs = {};
    props.posts.forEach(
      post => (this.segmentRefs[post.id] = React.createRef())
    );
  }

  segmentRefs: { [key: string]: React.MutableRefObject<View> } = {};

  componentDidUpdate(prevProps) {
    const visibilityChange =
      this.props.isVisible !== prevProps.isVisible ||
      this.props.isNextVisible !== prevProps.isNextVisible ||
      this.props.isPreviousVisible !== prevProps.isPreviousVisible ||
      prevProps.thread.id !== this.props.thread.id;

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
        this.startProgressAnimation(nextPost.id);
      }
    } else if (!hasNextPost && this.state.autoAdvance) {
      // this.progressValue.setValue(0);
      this.startProgressAnimation();
    }
  };

  postIndexValue = new Animated.Value(0);
  isRunningProgressAnimation = false;
  nextPostAnimation: Animated.BackwardCompatibleWrapper = null;

  loadNextPost = (_postIndex: number) => {
    return new Promise(async (resolve, reject) => {
      let _hasResolved = false;
      const postIndex = _postIndex || this.state.postIndex;

      if (this.isRunningProgressAnimation) {
        this.progressAnimation.stop();
      }

      const post = this.props.posts[postIndex];
      const segmentRef = this.segmentRefs[post.id];

      const { width, height, y, x } = await new Promise((resolve, reject) => {
        UIManager.measureLayout(
          findNodeHandle(segmentRef.current),
          findNodeHandle(this.overlayRef.current),
          reject,
          (x, y, width, height) => {
            resolve({ x, y, width, height });
          }
        );
      });

      // const x = this.seekbarRef.current.segmentByPostID(this.post.id);

      const { x: endX, y: endY } = await new Promise((resolve, reject) => {
        this.profileRef.current.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      });

      console.log("HERE", { x, y, width, height, endX, endY });
      this.profileAnimationStartHeight.setValue(height);
      this.profileAnimationStartWidth.setValue(width);
      this.profileAnimationStartX.setValue(x);
      this.profileAnimationStartY.setValue(y);
      this.profileAnimationEndX.setValue(endX);
      this.profileAnimationEndY.setValue(endY);
      console.log("HEREITH");

      this.progressAnimation = Animated.timing(this.progressValue, {
        toValue: 0.0,
        duration: 500,
        easing: Easing.ease
      });

      this.progressAnimation.start(({ finished }) => {
        this.isRunningProgressAnimation = false;
      });

      this.isRunningProgressAnimation = true;

      this.nextPostAnimation = Animated.timing(this.postIndexValue, {
        toValue: postIndex,
        duration: 500,
        easing: Easing.ease
      });

      this.isAnimatingNextPost.setValue(1);
      this.nextPostAnimation.start(({ finished }) => {
        if (finished && this.state.postIndex !== postIndex) {
          this.setState({ postIndex }, () => {
            !_hasResolved && resolve();
            _hasResolved = true;
            this.isAnimatingNextPost.setValue(0);
            // InteractionManager.runAfterInteractions(() =>

            // );
            this.nextPostAnimation = null;
          });
        } else if (finished && this.state.postIndex === postIndex) {
          this.isAnimatingNextPost.setValue(0);
        }
      });
    });
  };

  componentWillUnmount() {
    if (this.isRunningProgressAnimation) {
      this.progressAnimation.stop();
    }

    if (this.nextPostAnimation) {
      this.nextPostAnimation.stop();
    }
  }

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

  progressAnimation: Animated.BackwardCompatibleWrapper | null = null;
  profileAnimationStartX = new Animated.Value(0);
  profileAnimationStartY = new Animated.Value(0);
  profileAnimationStartWidth = new Animated.Value(0);
  profileAnimationStartHeight = new Animated.Value(0);
  profileAnimationEndX = new Animated.Value(0);
  profileAnimationEndY = new Animated.Value(0);

  startProgressAnimation = () => {
    if (this.isRunningProgressAnimation) {
      this.progressAnimation.stop();
    }

    this.progressAnimation = Animated.timing(this.progressValue, {
      toValue: 1.0,
      duration: this.autoplayDuration,
      easing: Easing.linear
    });

    this.progressAnimation.start(({ finished }) => {
      if (finished) {
        this.handlePostEnded();
      }

      this.isRunningProgressAnimation = false;
    });

    this.isRunningProgressAnimation = true;
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

    if (this.isRunningProgressAnimation) {
      this.progressAnimation.stop();
    }
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

          opacity: Animated.cond(
            this.isAnimatingNextPost,
            this.postIndexValue.interpolate({
              inputRange: [
                index - 1,
                index - 0.99,
                index,
                index + 0.01,
                index + 1
              ],
              outputRange: [0, 1, 1, 1, 0],
              extrapolate: Animated.Extrapolate.CLAMP
            }),
            Animated.cond(Animated.eq(this.postIndexValue, index), 1, 0)
          ),
          transform: transformOrigin(
            new Animated.Value(0),
            new Animated.Value(0),
            {
              translateX: this.postIndexValue.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [width, 0, width * -1],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            },

            {
              scale: this.postIndexValue.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [0.9, 1, 0.9],
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
            hideContent={!(isVisible || isNextVisible || isPreviousVisible)}
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
                    index - 0.5,
                    index,
                    index + 0.1,
                    index + 1
                  ],
                  outputRange: [0, 0, 0, 0.05, 1],
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

  seekbarRef = React.createRef<Seekbar>();

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
  overlayRef = React.createRef<View>();
  profileRef = React.createRef<View>();

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
    const nextPost = posts[this.state.postIndex + 1];

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

              height
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

          <View
            ref={this.overlayRef}
            style={[threadStyles.layer, threadStyles.overlayLayer]}
          >
            <View style={threadStyles.sidebar}>
              <AnimatedProfile
                profile={post.profile}
                progressValue={this.progressValue}
                ref={this.profileRef}
                postIndexValue={this.postIndexValue}
                isAnimatingNextPost={this.isAnimatingNextPost}
              />

              <View style={threadStyles.counts}>
                <CountButton
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
                          top: 0,
                          overflow: "visible"
                        }}
                      />
                    </View>
                  }
                  size={42}
                  count={thread.postsCount}
                  type="shadow"
                  onPress={this.handlePressReply}
                />

                <CountButton
                  Icon={IconHeart}
                  color="white"
                  type="shadow"
                  onPress={this.handlePressLike}
                  size={32}
                  count={post.likesCount}
                />
              </View>
            </View>

            <View style={{ height: BAR_HEIGHT }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  display: isVisible ? "flex" : "none"
                }}
              >
                {posts.length > 1 && (
                  <Seekbar
                    posts={posts}
                    segmentRefs={this.segmentRefs}
                    postId={this.post.id}
                    ref={this.seekbarRef}
                    indexValue={this.postIndexValue}
                    percentage={this.progressValue}
                  />
                )}
              </View>
            </View>

            {nextPost && (
              <AnimatedProfile
                profile={nextPost.profile}
                progressValue={this.progressValue}
                x={this.profileAnimationStartX}
                y={this.profileAnimationStartY}
                endX={this.profileAnimationEndX}
                endY={this.profileAnimationEndY}
                width={this.profileAnimationStartWidth}
                height={this.profileAnimationStartHeight}
                isAnimatingNextPost={this.isAnimatingNextPost}
                animated
                parentHeight={height}
              />
            )}
          </View>
        </Animated.View>
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
