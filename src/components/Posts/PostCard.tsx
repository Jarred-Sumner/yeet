import * as React from "react";
import { StyleSheet, View, StyleSheetProperties } from "react-native";
import {
  TouchableHighlight,
  TouchableWithoutFeedback,
  State as GestureState,
  LongPressGestureHandler
} from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { scaleToWidth } from "../../lib/Rect";
import { SPACING } from "../../lib/styles";
import { Avatar } from "../Avatar";
import { IconButtonEllipsis } from "../Button";
import MediaPlayer, { TrackableMediaPlayer } from "../MediaPlayer";
import { SemiBoldText } from "../Text";
import { LikeCountButton } from "../ThreadList/LikeCountButton";
import VIEW_COMMENTS_QUERY from "../../lib/ViewComments.graphql";
import { useLazyQuery } from "react-apollo";
import {
  ViewComments,
  ViewCommentsVariables
} from "../../lib/graphql/ViewComments";
import { CommentFragment } from "../../lib/graphql/CommentFragment";
import { CommentsViewer } from "./CommentsViewer";
import { isVideo } from "../../lib/imageSearch";
import { CommentComposer } from "./CommentComposer";
import CountButton from "../ThreadList/CountButton";
import { IconComment } from "../Icon";
import { PostFormat } from "../NewPost/NewPostFormat";
import { runTiming } from "../../lib/animations";
import { runSpring, runDecay, decay } from "react-native-redash";
import { memoize } from "lodash";

const BORDER_RADIUS = 24;
const AVATAR_SIZE = 24;

enum LayerZ {
  player = 0,
  gradient = 1,
  metadata = 4,
  comments = 3,
  paused = 4
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    position: "relative"
  },
  commentsLayer: {
    position: "relative",
    zIndex: LayerZ.comments
  },
  layerWrapper: {
    position: "absolute",
    zIndex: LayerZ.comments,
    top: 0,
    left: 0
  },
  composerLayer: {
    position: "relative",
    zIndex: LayerZ.comments
  },
  countButtonSeparator: {
    height: SPACING.double,
    width: 1
  },
  player: {
    borderRadius: BORDER_RADIUS,
    zIndex: 0
  },
  gradient: {
    position: "absolute",
    zIndex: LayerZ.gradient
  },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    zIndex: LayerZ.metadata
  },
  profile: {
    flexDirection: "row",
    padding: SPACING.normal
  },
  topGradient: {
    top: 0,
    left: 0,
    right: 0
  },
  captionMedia: {
    // paddingTop: SPACING.normal
  },
  bottomGradient: {
    bottom: 0,
    left: 0,
    right: 0
  },
  topRight: {
    justifyContent: "flex-end",

    flexDirection: "row"
  },
  username: {
    marginLeft: SPACING.half,
    alignSelf: "center",
    color: "white",
    // opacity: 0.7,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowRadius: 3,
    textShadowOffset: {
      width: 0,
      height: 2
    }
  },

  avatarContainer: {
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowRadius: 18,
    shadowColor: "black",
    shadowOpacity: 0.25,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE
  },
  count: {
    position: "absolute",
    bottom: 24,
    zIndex: LayerZ.metadata,
    justifyContent: "center",
    alignItems: "center",
    right: 0
  },
  ellipsis: {
    width: AVATAR_SIZE + SPACING.normal * 2,
    height: AVATAR_SIZE + SPACING.normal * 2,
    alignItems: "center",
    justifyContent: "center"
  },
  pausedOverlay: {
    position: "absolute",
    zIndex: LayerZ.paused,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1F1F1F"
  }
});

const OverlayGradient = ({ width, height = 84, style, flipped }) => {
  const COLORS = ["rgba(31, 31, 31, 0.45)", "rgba(35, 35, 35, 0)"];
  const colors = flipped ? COLORS.reverse() : COLORS;
  return (
    <LinearGradient
      style={style}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0, 1.0]}
      pointerEvents="none"
      width={width}
      height={height}
      colors={colors}
    />
  );
};

const FADE_OVERLAY = 0.65;

const scrollOpacityAnimation = Animated.proc(
  (
    prevOffset,
    snapOffset,
    height,
    scrollY,
    isScrolling,
    visiblePostIDValue,
    visibleID
  ) =>
    Animated.interpolate(scrollY, {
      inputRange: [prevOffset, snapOffset, Animated.add(snapOffset, height)],
      outputRange: [
        Animated.cond(Animated.greaterThan(snapOffset, 0), FADE_OVERLAY, 0),
        0,
        FADE_OVERLAY
      ],
      extrapolate: Animated.Extrapolate.CLAMP
    })
);

export const calculatePostHeight = (post: PostFragment) => {
  return scaleToWidth(SCREEN_DIMENSIONS.width, post.media).height;
};

enum PostCardState {
  shown = "shown",
  newComment = "newComment"
}

const PostCardComponent = ({
  post,
  paused,
  snapOffset,
  snapOffsetValue,
  height,
  topInset,
  prevOffset,
  index,
  onPress,
  scrollY,
  contentHeight,
  width,
  onPressLike,
  keyboardVisibleValue,
  visiblePostIDValue,
  onPressProfile,
  onPressComment,
  autoPlay = false,
  isComposing,
  isScrolling,
  onPressEllipsis,
  openComposer,
  scrollFadeValue,
  scrollGestureState,
  comments = []
}: {
  post: PostFragment;
  paused: boolean;
  width: number;
  height: number;
  comments: Array<CommentFragment>;
}) => {
  const [manuallyPaused, setManuallyPaused] = React.useState(false);
  const [showAllComments, setShowAllComments] = React.useState(false);
  const [playbackTime, setPlaybackTime] = React.useState(0.0);

  const isNotPlaying = isComposing || paused || manuallyPaused;

  const opacityValue = React.useRef(
    new Animated.Value(!paused || autoPlay ? 0 : FADE_OVERLAY)
  );
  const handleProgress = React.useCallback(
    ({ elapsed: playbackTime }) => {
      setPlaybackTime(playbackTime);
    },
    [setPlaybackTime]
  );

  const mediaPlayerRef = React.useRef();
  const handlePress = React.useCallback(() => {
    onPress(post, index);
  }, [onPress, post, index, isNotPlaying]);

  const handlePressProfile = React.useCallback(() => {
    onPressProfile(post.profile);
  }, [post.profile]);

  const handlePressLike = React.useCallback(() => {
    onPressLike(post.id);
  }, [post.id]);

  const handlePressEllipsis = React.useCallback(() => {
    onPressEllipsis(post, mediaPlayerRef.current, comments);
  }, [post.id, onPressEllipsis, mediaPlayerRef, comments]);

  const mediaPlayerStyles = React.useMemo(() => {
    if (post.format === PostFormat.caption) {
      return [
        StyleSheet.absoluteFill,
        styles.player,
        { width, height },
        styles.captionMedia
      ];
    } else {
      return [StyleSheet.absoluteFill, styles.player, { width, height }];
    }
  }, [width, height, post.format, styles]);

  const sheetStyles = React.useMemo(() => {
    return [
      styles.pausedOverlay,
      { width, height },
      {
        opacity: opacityValue.current
      }
    ];
  }, [
    prevOffset,
    snapOffset,
    height,
    scrollY,
    isScrolling,
    visiblePostIDValue,
    post.id
  ]);

  const onOpenComposer = React.useCallback(
    composerProps => {
      openComposer({
        ...composerProps,
        timeOffset: Math.round(playbackTime),
        autoplaySeconds: post.autoplaySeconds
      });
    },
    [openComposer, width, height, post.id, playbackTime]
  );

  const toggleShowComments = React.useCallback(
    () => setShowAllComments(!showAllComments),
    []
  );

  const onLongPressCommentButton = React.useCallback(() => {
    toggleShowComments();
  }, [toggleShowComments]);

  const handlePlay = React.useCallback(() => {
    opacityValue.current.setValue(0);
  }, []);

  const sources = React.useMemo(() => [post.media], [post.media]);

  const handleCompose = React.useCallback(
    ({ nativeEvent: { x, y } }) => {
      if (isNotPlaying) {
        return;
      }

      onOpenComposer({
        x,
        y,
        width,
        height,
        mimeType: post.media.mimeType,
        keyboardVisibleValue,
        postId: post.id
      });
    },
    [onOpenComposer, width, height, keyboardVisibleValue, post.id, isNotPlaying]
  );

  const onPressCommentButton = React.useCallback(() => {
    const y = Math.max(height - 48, 10);
    const x = 16;

    handleCompose({ nativeEvent: { x, y } });
  }, [handleCompose]);

  const commentCountButtonRef = React.useRef();
  const likeButtonRef = React.useRef();

  const buttonRefs = React.useMemo(
    () => [commentCountButtonRef, likeButtonRef],
    [commentCountButtonRef, likeButtonRef, isNotPlaying]
  );

  return (
    <LongPressGestureHandler
      disabled={isNotPlaying}
      onGestureEvent={handleCompose}
      waitFor={buttonRefs}
    >
      <Animated.View>
        <TouchableWithoutFeedback
          disabled={!isNotPlaying}
          onPress={handlePress}
        >
          <Animated.View style={[styles.container, { width, height }]}>
            <Animated.Code
              exec={Animated.block([
                Animated.set(
                  opacityValue.current,
                  scrollOpacityAnimation(
                    prevOffset,
                    snapOffset,
                    height,
                    scrollY,
                    isScrolling,
                    visiblePostIDValue,
                    post.id.hashCode()
                  )
                )
              ])}
            />

            <TrackableMediaPlayer
              sources={sources}
              paused={isNotPlaying}
              muted={false}
              id={`${post.id}-player`}
              autoPlay={autoPlay}
              ref={mediaPlayerRef}
              onPlay={isVideo(post.media.mimeType) ? handlePlay : undefined}
              onLoad={!isVideo(post.media.mimeType) ? handlePlay : undefined}
              duration={
                (isVideo(post.media.mimeType) ? post.media.duration : 24) * 1000
              }
              onProgress={handleProgress}
              // sharedId={postElementId(post)}
              borderRadius={BORDER_RADIUS}
              style={mediaPlayerStyles}
            />

            <OverlayGradient
              width={width}
              height={84}
              style={[
                styles.gradient,
                styles.topGradient,
                {
                  width,
                  height: 84
                }
              ]}
            />

            {/* <OverlayGradient
          width={width}
          height={84}
          flipped
          style={[
            styles.gradient,
            styles.bottomGradient,
            {
              width,
              height: 84
            }
          ]}
        /> */}

            <Animated.View style={styles.top}>
              <TouchableHighlight
                underlayColor="rgba(0, 0, 0, 0.05)"
                onPress={handlePressProfile}
              >
                <View style={styles.profile}>
                  <View style={styles.avatarContainer}>
                    <Avatar
                      url={post.profile.photoURL}
                      label={post.profile.username}
                      size={AVATAR_SIZE}
                    />
                  </View>

                  <SemiBoldText style={styles.username}>
                    {post.profile.username}
                  </SemiBoldText>
                </View>
              </TouchableHighlight>

              <View
                pointerEvents={paused ? "none" : "auto"}
                style={styles.topRight}
              >
                <IconButtonEllipsis
                  onPress={handlePressEllipsis}
                  style={styles.ellipsis}
                  vertical
                  size={18}
                />
              </View>
            </Animated.View>

            {!isNotPlaying && (
              <>
                <View pointerEvents="box-none" style={styles.layerWrapper}>
                  <View pointerEvents="box-none" style={styles.commentsLayer}>
                    <CommentsViewer
                      width={width}
                      height={height}
                      comments={comments}
                      showAll={showAllComments}
                      timeOffset={playbackTime}
                      keyboardVisibleValue={keyboardVisibleValue}
                      onTap={onPressComment}
                    />
                  </View>
                </View>
              </>
            )}

            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.count
                // {
                //   transform: [
                //     {
                //       translateY: scrollY.interpolate({
                //         inputRange: [offset - topInset, offset + height - topInset],
                //         outputRange: [, -10],
                //         extrapolate: Animated.Extrapolate.CLAMP
                //       })
                //     }
                //   ]
                // }
              ]}
            >
              <CountButton
                iconSize={28}
                Icon={IconComment}
                color="white"
                buttonRef={commentCountButtonRef.current}
                disabled={paused}
                count={post.commentsCount || 0}
                onPress={onPressCommentButton}
                onLongPress={onLongPressCommentButton}
              />

              <View style={styles.countButtonSeparator} />

              <LikeCountButton
                size={28}
                id={post.id}
                buttonRef={likeButtonRef.current}
                onPress={handlePressLike}
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={sheetStyles}
            ></Animated.View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </LongPressGestureHandler>
  );
};

export const PostCard = ({ post, paused, isComposing, ...props }) => {
  const [loadComments, commentsQuery] = useLazyQuery<
    ViewComments,
    ViewCommentsVariables
  >(VIEW_COMMENTS_QUERY, {
    variables: {
      postId: post.id,
      limit: 100,
      offset: 0
    },
    fetchPolicy: "cache-and-network"
  });

  React.useEffect(() => {
    if (!paused) {
      loadComments({
        variables: {
          postId: post.id,
          limit: 100,
          offset: 0
        }
      });
    }
  }, [paused, post.id, loadComments, isComposing]);

  const comments = commentsQuery?.data?.comments?.data ?? [];
  return (
    <PostCardComponent
      {...props}
      post={post}
      isComposing={isComposing}
      paused={paused}
      comments={comments}
    />
  );
};
