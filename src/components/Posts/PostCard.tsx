import * as React from "react";
import { StyleSheet, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
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
    top: 0,
    left: 0
  },
  composerLayer: {
    position: "relative",
    zIndex: LayerZ.comments
  },
  countButtonSeparator: {
    height: SPACING.normal,
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
    right: 0,
    paddingHorizontal: 20
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
  const COLORS = ["rgba(31, 31, 31, 0.65)", "rgba(35, 35, 35, 0)"];
  const colors = flipped ? COLORS.reverse() : COLORS;
  return (
    <LinearGradient
      style={style}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.2, 1.0]}
      pointerEvents="none"
      width={width}
      height={height}
      colors={colors}
    />
  );
};

const FADE_OVERLAY = 0.6;

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
    Animated.cond(
      Animated.eq(isScrolling, 1),
      Animated.interpolate(scrollY, {
        inputRange: [prevOffset, snapOffset, Animated.add(snapOffset, height)],
        outputRange: [
          Animated.cond(Animated.greaterThan(prevOffset, 0), FADE_OVERLAY, 0),
          0,
          FADE_OVERLAY
        ],
        extrapolate: Animated.Extrapolate.CLAMP
      }),
      Animated.cond(Animated.eq(visiblePostIDValue, visibleID), 0, FADE_OVERLAY)
    )
);

export const calculatePostHeight = (post: PostFragment) =>
  scaleToWidth(SCREEN_DIMENSIONS.width, post.media).height;

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
  isComposing,
  isScrolling,
  onPressEllipsis,
  openComposer,
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

  const handleProgress = React.useCallback(
    ({ elapsed: playbackTime }) => {
      setPlaybackTime(playbackTime);
    },
    [setPlaybackTime]
  );

  const mediaPlayerRef = React.useRef();
  const handlePress = React.useCallback(() => {
    onPress(post, index);
  }, [onPress, post, index]);

  const handlePressProfile = React.useCallback(() => {
    onPressProfile(post.profile);
  }, [post.profile]);

  const handlePressLike = React.useCallback(() => {
    onPressLike(post.id);
  }, [post.id]);

  const handlePressEllipsis = React.useCallback(() => {
    onPressEllipsis(post, mediaPlayerRef);
  }, [post.id, mediaPlayerRef]);

  const mediaPlayerStyles = React.useMemo(
    () => [StyleSheet.absoluteFill, styles.player, { width, height }],
    [width, height, styles]
  );

  const sheetStyles = React.useMemo(() => {
    return [
      styles.pausedOverlay,
      { width, height },
      {
        opacity: scrollOpacityAnimation(
          prevOffset,
          snapOffset,
          height,
          scrollY,
          isScrolling,
          visiblePostIDValue,
          post.id.hashCode()
        )
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
      openComposer({ ...composerProps, timeOffset: playbackTime });
    },
    [openComposer, width, height, post.id, playbackTime]
  );

  const onPressCommentButton = React.useCallback(() => {
    const y = Math.max(height - 48, 10);
    const x = 16;

    onOpenComposer({
      postId: post.id,
      width,
      height,
      x,
      y
    });
  }, [onOpenComposer, width, height, post.id]);

  const toggleShowComments = React.useCallback(
    () => setShowAllComments(!showAllComments),
    []
  );

  const onLongPressCommentButton = React.useCallback(() => {
    toggleShowComments();
  }, [toggleShowComments]);

  const sources = React.useMemo(() => [post.media], [post.media]);

  const isNotPlaying = isComposing || paused || manuallyPaused;

  return (
    <TouchableHighlight disabled={!paused} onPress={handlePress}>
      <Animated.View style={[styles.container, { width, height }]}>
        <TrackableMediaPlayer
          sources={sources}
          paused={isNotPlaying}
          id={`${post.id}-player`}
          autoPlay={false}
          ref={mediaPlayerRef}
          duration={post.autoplaySeconds * 1000.0}
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

        <OverlayGradient
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
        />

        <Animated.View style={styles.top}>
          <TouchableHighlight disabled={paused} onPress={handlePressProfile}>
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

          <View style={styles.topRight}>
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
            <View style={styles.layerWrapper}>
              <View style={styles.commentsLayer}>
                <CommentsViewer
                  width={width}
                  height={height}
                  comments={comments}
                  showAll={showAllComments}
                  timeOffset={playbackTime}
                  keyboardVisibleValue={keyboardVisibleValue}
                />
              </View>
            </View>

            <View style={[styles.composerLayer]}>
              <CommentComposer
                postId={post.id}
                timeOffset={playbackTime}
                keyboardVisibleValue={keyboardVisibleValue}
                width={width}
                height={height}
                onOpen={onOpenComposer}
              />
            </View>
          </>
        )}

        <Animated.View
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
            count={post.commentsCount || 0}
            onPress={onPressCommentButton}
            onLongPress={onLongPressCommentButton}
          />

          <View style={styles.countButtonSeparator} />

          <LikeCountButton size={28} id={post.id} onPress={handlePressLike} />
        </Animated.View>

        <Animated.View pointerEvents="none" style={sheetStyles}></Animated.View>
      </Animated.View>
    </TouchableHighlight>
  );
};

export const PostCard = ({ post, paused, isComposing, ...props }) => {
  const [loadComments, commentsQuery] = useLazyQuery<
    ViewComments,
    ViewCommentsVariables
  >(VIEW_COMMENTS_QUERY, {
    variables: {
      postId: post.id,
      limit: 20,
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