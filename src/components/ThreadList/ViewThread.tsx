// @flow
import { memoize, uniq, uniqBy } from "lodash";
import * as React from "react";
import { Mutation, Query } from "react-apollo";
import { findNodeHandle, StyleSheet, UIManager, View } from "react-native";
import { BaseButton } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated, { Easing } from "react-native-reanimated";
import { useFocusState } from "react-navigation-hooks";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { ViewPosts } from "../../lib/graphql/ViewPosts";
import { ViewThreads_postThreads } from "../../lib/graphql/ViewThreads";
import LIKE_POST_MUTATION from "../../lib/LikePost.graphql";
import { SPACING } from "../../lib/styles";
import { sendLightFeedback } from "../../lib/Vibration";
import VIEW_POSTS_QUERY from "../../lib/ViewPosts.graphql";
import { Avatar } from "../Avatar";
import { BitmapIconNewPost } from "../BitmapIcon";
import { IconPlay } from "../Icon";
import MediaFrame from "../MediaFrame";
import MediaPlayer from "../MediaPlayer";
import { SemiBoldText } from "../Text";
import { AuthState, UserContext } from "../UserContext";
import { CountButton } from "./CountButton";
import { LikeCountButton } from "./LikeCountButton";
import { BAR_HEIGHT, Seekbar } from "./Seekbar";

const AVATAR_SIZE = 36;

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
  touchableLayer: {
    zIndex: 2,
    position: "relative",
    justifyContent: "flex-end"
  },
  overlayLayer: {
    zIndex: 2,
    alignSelf: "flex-end",
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

type State = {
  postIndex: number;
  nextPostIndex: number;
  isPlaying: boolean;
  autoAdvance: boolean;
  autoPlay: boolean;
};

type Props = {
  posts: Array<PostFragment>;
  isVisible: boolean;
  isNextVisible: boolean;
  isPreviousVisible: boolean;
  thread: ViewThreads_postThreads;
  threadId: string;
  fetchMore: Function;
  width: number;
  height: number;
};

class ThreadContainer extends React.Component<Props, State> {
  isAnimatingNextPost: Animated.Value<number>;
  forwardProgressValue: Animated.Value<number>;
  backwardProgressValue: Animated.Value<number>;
  progressValue: Animated.Node<number>;

  constructor(props) {
    super(props);

    const isPlaying = props.isVisible;

    this.isAnimatingNextPost = new Animated.Value<number>(0);
    this.forwardProgressValue = new Animated.Value<number>(0.0);
    this.backwardProgressValue = new Animated.Value<number>(1.0);

    this.progressValue = Animated.cond(
      Animated.eq(this.isAnimatingNextPost, 1),
      this.backwardProgressValue,
      this.forwardProgressValue
    );

    this.state = {
      postIndex: 0,
      nextPostIndex: -1,
      autoPlay: isPlaying,
      isPlaying,
      autoAdvance: isPlaying
    };

    this.segmentRefs = {};
    props.posts.forEach(
      post => (this.segmentRefs[post.id] = React.createRef())
    );
  }

  segmentRefs: { [key: string]: React.MutableRefObject<View> } = {};

  componentDidUpdate(prevProps, prevState) {
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
      this.stop();
    }

    if (
      (this.state.postIndex !== prevState.postIndex &&
        this.state.postIndex === this.props.posts.length - 1) ||
      (this.props.isFocusing && !prevProps.isFocusing)
    ) {
      this.props.fetchMore({
        variables: {
          offset: this.state.postIndex,
          threadId: this.props.thread.id,
          limit: 10
        },
        updateQuery: (
          previousResult: ViewPosts,
          { fetchMoreResult, queryVariables }: { fetchMoreResult: ViewPosts }
        ) => {
          return {
            posts: [
              ...previousResult.posts,
              // Add the new matches data to the end of the old matches data.
              ...fetchMoreResult.posts
            ]
          };
        }
      });
    }
  }

  handlePostEnded = async () => {
    console.log("END");
    this.goNext();
  };

  skip = () => {
    this.goNext();
  };

  goNext = async (fast: boolean = false) => {
    const postIndex = this.state.postIndex + 1;
    const hasNextPost = postIndex < this.props.posts.length;

    if (hasNextPost) {
      await this.loadNextPost(postIndex, fast);
    }
  };

  goBack = async (fast: boolean = false) => {
    const postIndex = Math.max(this.state.postIndex - 1, 0);
    const prevPost = this.props.posts[postIndex];

    if (!!prevPost && this.state.autoAdvance) {
      await this.loadNextPost(postIndex, fast);
    }
  };

  postIndexValue = new Animated.Value<number>(0);
  isRunningProgressAnimation = false;

  forwardProgressAnimation: Animated.BackwardCompatibleWrapper = null;
  postIndexAnimation: Animated.BackwardCompatibleWrapper = null;
  backwardsProgressAnimation: Animated.BackwardCompatibleWrapper = null;

  loadNextPost = (_postIndex: number, animateFaster: boolean = false) => {
    this.isAnimatingToNextPost = true;

    const postIndex =
      typeof _postIndex === "number" ? _postIndex : this.state.postIndex;

    if (this.state.postIndex === 0 && _postIndex === 0) {
      this.mediaPlayerRef.current.advance(0);
      this.isAnimatingToNextPost = false;
      this.cancelAnimations();
      return Promise.resolve();
    }

    if (animateFaster) {
      this.postIndexValue.setValue(postIndex);
      this.setState({ postIndex, nextPostIndex: postIndex + 1 }, () => {
        this.mediaPlayerRef.current.advance(postIndex);
      });

      this.isAnimatingToNextPost = false;
      this.cancelAnimations();
      return Promise.resolve();
    }

    return new Promise(async (resolve, reject) => {
      await new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          this.cancelAnimations();

          this.backwardProgressValue.setValue(1.0);
          this.forwardProgressValue.setValue(1.0);
          resolve();
        });
      });

      this.isRunningProgressAnimation = true;
      this.isAnimatingToNextPost = true;

      if (postIndex !== this.state.nextPostIndex) {
        this.setState({ nextPostIndex: postIndex });
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

      await new Promise((resolve, reject) =>
        window.requestAnimationFrame(() => {
          this.profileAnimationStartHeight.setValue(height);
          this.profileAnimationStartWidth.setValue(width);
          this.profileAnimationStartX.setValue(x);
          this.profileAnimationStartY.setValue(y);
          this.profileAnimationEndX.setValue(endX);
          this.profileAnimationEndY.setValue(endY);

          resolve();
        })
      );

      await new Promise((resolve, reject) =>
        window.requestAnimationFrame(() => {
          this.cancelAnimations();
          this.isAnimatingNextPost.setValue(1);
          resolve();
        })
      );

      const backwardsProgressAnimation = Animated.timing(
        this.backwardProgressValue,
        {
          toValue: 0.0,
          duration: 500,
          easing: Easing.ease
        }
      );

      backwardsProgressAnimation.start(() => {
        if (backwardsProgressAnimation === this.backwardsProgressAnimation) {
          this.backwardsProgressAnimation = null;
        }
      });

      this.backwardsProgressAnimation = backwardsProgressAnimation;

      const postIndexAnimation = Animated.timing(this.postIndexValue, {
        toValue: postIndex,
        duration: 500,
        easing: Easing.ease
      });

      this.postIndexAnimation = postIndexAnimation;

      postIndexAnimation.start(({ finished }) => {
        if (postIndexAnimation === this.postIndexAnimation) {
          this.postIndexAnimation = null;
        }

        if (finished) {
          this.forwardProgressValue.setValue(0.0);

          this.setState({ postIndex, nextPostIndex: postIndex + 1 }, () => {
            window.requestAnimationFrame(() => {
              this.backwardProgressValue.setValue(1.0);
            });
            resolve();
          });
        } else {
          reject();
        }
      });

      this.mediaPlayerRef.current.advance(postIndex);
      this.mediaPlayerRef.current.pause();
    }).then(
      () => {
        this.isAnimatingNextPost.setValue(0);
        this.isAnimatingToNextPost = false;
        this.mediaPlayerRef.current.play();
      },
      () => {
        this.isAnimatingToNextPost = false;
        this.isAnimatingNextPost.setValue(0);
        this.mediaPlayerRef.current.play();
      }
    );
  };

  cancelAnimations = () =>
    [
      this.postIndexAnimation,
      this.backwardsProgressAnimation,
      this.forwardProgressAnimation
    ]
      .filter(Boolean)
      .forEach(animation => animation.stop());

  componentWillUnmount() {
    this.cancelAnimations();
  }

  get post() {
    return this.props.posts[this.state.postIndex];
  }

  play = () => {
    this.setState({
      isPlaying: true,
      autoAdvance: true
    });
  };

  progressAnimation: Animated.BackwardCompatibleWrapper | null = null;
  profileAnimationStartX = new Animated.Value(0);
  profileAnimationStartY = new Animated.Value(0);
  profileAnimationStartWidth = new Animated.Value(0);
  profileAnimationStartHeight = new Animated.Value(0);
  profileAnimationEndX = new Animated.Value(0);
  profileAnimationEndY = new Animated.Value(0);
  progressAnimationCallbackKey = Math.random();

  onMediaPlay = () => {};

  onMediaPause = () => {};

  pause = () => {
    this.setState({
      isPlaying: false,
      autoPlay: false,
      autoAdvance: false
    });

    this.cancelAnimations();
  };

  stop = () => {
    this.setState({
      isPlaying: false,
      autoAdvance: false,
      autoPlay: false
    });

    this.cancelAnimations();
    this.mediaPlayerRef.current.advance(this.state.postIndex);
  };

  get hasLikedPost() {
    if (
      this.props.authState !== AuthState.loggedIn ||
      !this.props.currentUser
    ) {
      return false;
    }

    return this.post.likes.profileIDs.includes(this.props.currentUser.id);
  }

  handlePressLike = () => {
    const { authState, currentUser, requireAuthentication } = this.props;
    if (authState !== AuthState.loggedIn) {
      requireAuthentication();
      return;
    }

    const {
      id: postId,
      likes: { profileIDs = [] }
    } = this.post;
    const { id: userId } = currentUser;

    let _profileIDs = [...profileIDs];

    if (_profileIDs.includes(userId)) {
      _profileIDs.splice(_profileIDs.indexOf(userId), 1);
    } else {
      _profileIDs.push(userId);
    }

    _profileIDs = uniq(_profileIDs);

    this.props.likePost({
      variables: { postId },
      optimisticResponse: {
        __typename: "Mutation",
        likePost: {
          ...this.post,
          likesCount: _profileIDs.length,
          likes: {
            ...this.post.likes,
            profileIDs: _profileIDs
          }
        }
      }
    });

    sendLightFeedback();
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

  togglePlayPause = () => {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  };

  handleTapBack = () => {
    this.goBack(true);
  };

  handleTapNext = () => {
    this.goNext(true);
  };

  overlayRef = React.createRef<View>();
  profileRef = React.createRef<View>();
  mediaPlayerRef = React.createRef<MediaPlayer>();
  isAnimatingToNextPost = false;
  lastProgress: number | null = null;

  handleProgress = ({
    nativeEvent: { index, id, url, elapsed, interval: animationDuration }
  }) => {
    const post = this.props.posts.find(({ media }) => media.id === id);

    if (!post || this.isAnimatingToNextPost) {
      return;
    }

    let progress = (elapsed + animationDuration) / post.autoplaySeconds;
    if (progress > 1) {
      progress = progress - Math.floor(progress);
    }

    const isRestarting =
      this.lastProgress !== null && this.lastProgress > progress;

    const isAboutToAdvance =
      this.state.postIndex < this.props.posts.length - 1 &&
      (elapsed + animationDuration) / post.autoplaySeconds >= 1.0;

    if (isAboutToAdvance) {
      const forwardProgressAnimation = Animated.timing(
        this.forwardProgressValue,
        {
          toValue: 1.0,
          duration: animationDuration * 1000,
          easing: Easing.linear
        }
      );

      this.forwardProgressAnimation = forwardProgressAnimation;

      this.forwardProgressAnimation.start(() => {
        if (forwardProgressAnimation === this.forwardProgressAnimation) {
          this.forwardProgressAnimation = null;
        }
      });
      return;
    }

    // if (isRestarting) {
    //   this.forwardProgressValue.setValue(0.0);
    // }

    const forwardProgressAnimation = Animated.timing(
      this.forwardProgressValue,
      {
        toValue: progress,
        duration: animationDuration * 1000,
        easing: Easing.linear
      }
    );
    this.forwardProgressAnimation = forwardProgressAnimation;

    this.forwardProgressAnimation.start(() => {
      if (this.forwardProgressAnimation === forwardProgressAnimation) {
        this.forwardProgressAnimation = null;
      }
    });

    this.lastProgress = progress;
  };

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
    const nextPost = posts[this.state.nextPostIndex];

    const sources = this.props.posts.map(
      ({
        media: { id, url, mimeType, width, height, duration, pixelRatio },
        bounds,
        autoplaySeconds
      }) => ({
        url,
        id,
        mimeType,
        width,
        pixelRatio,
        height,
        duration,
        bounds,
        playDuration: autoplaySeconds
      })
    );

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
            <Animated.View
              style={{
                position: "relative",
                width,
                height
              }}
            >
              <Animated.View
                style={{
                  position: "absolute",
                  zIndex: 1,
                  width,
                  height,
                  opacity: Animated.eq(this.isAnimatingNextPost, 1),
                  transform: [
                    {
                      scale: Animated.interpolate(this.progressValue, {
                        inputRange: [0, 1],
                        outputRange: [0.75, 1],
                        extrapolate: Animated.Extrapolate.CLAMP
                      })
                    },
                    {
                      translateX: Animated.interpolate(this.progressValue, {
                        inputRange: [0, 1],
                        outputRange: [-1.25 * width, 0],
                        extrapolate: Animated.Extrapolate.CLAMP
                      })
                    },
                    {
                      translateY: Animated.interpolate(this.progressValue, {
                        inputRange: [0, 1],
                        outputRange: [height * -0.05, 0],
                        extrapolate: Animated.Extrapolate.CLAMP
                      })
                    }
                  ]
                }}
              >
                <MediaFrame
                  source={sources[this.state.postIndex]}
                  style={{
                    width,
                    height
                  }}
                />

                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: "black",
                      zIndex: 10,
                      opacity: Animated.interpolate(this.progressValue, {
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 0.05, 0],
                        extrapolate: Animated.Extrapolate.CLAMP
                      })
                    }
                  ]}
                />
              </Animated.View>

              <Animated.View
                style={{
                  position: "absolute",
                  zIndex: 2,
                  width,
                  height,
                  transform: [
                    {
                      scale: Animated.block([
                        Animated.cond(
                          Animated.eq(this.isAnimatingNextPost, 1),
                          Animated.interpolate(this.progressValue, {
                            inputRange: [0, 1],
                            outputRange: [1, 0.75],
                            extrapolate: Animated.Extrapolate.CLAMP
                          }),
                          1
                        )
                      ])
                    },
                    {
                      translateX: Animated.block([
                        Animated.cond(
                          Animated.eq(this.isAnimatingNextPost, 1),
                          Animated.interpolate(this.progressValue, {
                            inputRange: [0, 1],
                            outputRange: [0, 1.25 * width],
                            extrapolate: Animated.Extrapolate.CLAMP
                          }),
                          0
                        )
                      ])
                    },
                    {
                      translateY: Animated.block([
                        Animated.cond(
                          Animated.eq(this.isAnimatingNextPost, 1),
                          Animated.interpolate(this.progressValue, {
                            inputRange: [0, 1],
                            outputRange: [0, height * -0.05],
                            extrapolate: Animated.Extrapolate.CLAMP
                          }),
                          0
                        )
                      ])
                    }
                  ]
                }}
              >
                <MediaPlayer
                  sources={sources}
                  autoPlay={this.state.autoPlay && this.props.isVisible}
                  paused={!this.state.isPlaying}
                  ref={this.mediaPlayerRef}
                  onProgress={this.handleProgress}
                  onEnd={this.handlePostEnded}
                  onError={this.handleError}
                  style={{
                    width,
                    height
                  }}
                />
              </Animated.View>
            </Animated.View>
          </Animated.View>

          <View
            pointerEvents="none"
            style={[
              threadStyles.layer,
              threadStyles.gradientLayer,
              {
                backgroundColor:
                  !this.state.isPlaying && isVisible
                    ? "rgba(0, 0, 0, 0.65)"
                    : undefined
              }
            ]}
          >
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
            pointerEvents="box-none"
            style={[
              threadStyles.layer,
              threadStyles.touchableLayer,
              {
                width,
                height: height - 120,
                zIndex: 3
              }
            ]}
          >
            <BaseButton
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                height: height - 120,
                width: width * 0.33
              }}
              onPress={this.handleTapBack}
            >
              <Animated.View
                collapsable={false}
                style={{
                  flex: 1
                }}
              />
            </BaseButton>

            <BaseButton
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                left: width * 0.33,
                bottom: 0,
                height: height - 120,
                width: width * 0.33,
                alignSelf: "center"
              }}
              onPress={this.togglePlayPause}
            >
              <Animated.View
                collapsable={false}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <View
                  style={{
                    display:
                      this.state.isPlaying || !isVisible ? "none" : "flex"
                  }}
                >
                  <IconPlay
                    color="white"
                    size={64}
                    style={{
                      textShadowColor: "black",
                      textShadowRadius: 5,
                      overflow: "visible",
                      textShadowOffset: {
                        width: 1,
                        height: 1
                      }
                    }}
                  />
                </View>
              </Animated.View>
            </BaseButton>

            <BaseButton
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                height: height - 100,
                width: width * 0.33
              }}
              onPress={this.handleTapNext}
            >
              <View
                collapsable={false}
                style={{
                  flex: 1
                }}
              />
            </BaseButton>
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

                <View style={{ width: SPACING.half, height: 1 }} />

                <LikeCountButton
                  id={this.post.id}
                  onPress={this.handlePressLike}
                />
              </View>
            </View>

            <View style={{ height: BAR_HEIGHT }}>
              {posts.length > 1 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <Seekbar
                    posts={posts}
                    segmentRefs={this.segmentRefs}
                    postId={this.post.id}
                    ref={this.seekbarRef}
                    indexValue={this.postIndexValue}
                    percentage={this.progressValue}
                  />
                </View>
              )}
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
  const { isFocused, isFocusing, isBlurred, isBlurring } = useFocusState();
  const { currentUser, requireAuthentication, authState } = React.useContext(
    UserContext
  );

  return (
    <Mutation mutation={LIKE_POST_MUTATION}>
      {likePost => (
        <Query
          query={VIEW_POSTS_QUERY}
          delay={!isVisible || isBlurred}
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
              likePost={likePost}
              isScreenFocused={isFocused}
              isScreenFocusing={isFocusing}
              isScreenBlurred={isBlurred}
              fetchMore={fetchMore}
              currentUser={currentUser}
              requireAuthentication={requireAuthentication}
              authState={authState}
              posts={uniqBy([thread.firstPost, ...posts], "id")}
              {...otherProps}
            />
          )}
        </Query>
      )}
    </Mutation>
  );
};
