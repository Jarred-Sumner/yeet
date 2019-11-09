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
import MediaPlayer from "../MediaPlayer";
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

const BORDER_RADIUS = 24;
const AVATAR_SIZE = 24;

enum LayerZ {
  player = 0,
  gradient = 1,
  metadata = 2,
  paused = 3
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    position: "relative"
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
    right: 0,
    paddingHorizontal: 20,
    justifyContent: "flex-end",
    alignItems: "flex-end"
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
  visiblePostIDValue,
  onPressProfile,
  isScrolling,
  onPressEllipsis,
  comments = []
}: {
  post: PostFragment;
  paused: boolean;
  width: number;
  height: number;
  comments: Array<CommentFragment>;
}) => {
  const [manuallyPaused, setManuallyPased] = React.useState(false);
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

  const [playbackTime, setPlaybackTime] = React.useState(0);

  const imageTimer = React.createRef(-1);
  const lastProgressTimer = React.useRef<Date | null>(null);
  const lastElapsedTime = React.useRef<number | null>(0);

  React.useEffect(() => {
    const shouldStartTimer = !(
      paused ||
      manuallyPaused ||
      isVideo(post.media.mimeType)
    );

    if (shouldStartTimer) {
      if (imageTimer.current > -1) {
        window.clearInterval(imageTimer.current);
        imageTimer.current = -1;
      }

      lastProgressTimer.current = new Date();
      imageTimer.current = window.setInterval(() => {
        const now = new Date();
        const offsetDate = lastProgressTimer.current ?? now;
        let elapsed =
          (now.getTime() - offsetDate.getTime()) / 1000 +
          lastElapsedTime.current;

        lastProgressTimer.current = now;
        setPlaybackTime(elapsed);
        lastElapsedTime.current = elapsed;
      }, 100);
    } else if (!shouldStartTimer && imageTimer.current > -1) {
      window.clearInterval(imageTimer.current);
      imageTimer.current = -1;
    }

    return () => {
      if (imageTimer.current > -1) {
        window.clearInterval(imageTimer.current);
      }
    };
  }, [post.id, post.media.mimeType, paused, manuallyPaused]);

  const handleProgress = React.useCallback(
    ({ nativeEvent: { id, index, status, url, elapsed, interval } }) => {
      if (elapsed) {
        setPlaybackTime(elapsed);
      }
    },
    [setPlaybackTime]
  );

  const sources = React.useMemo(() => [post.media], [post.media]);

  return (
    <TouchableHighlight disabled={!paused} onPress={handlePress}>
      <Animated.View style={[styles.container, { width, height }]}>
        <MediaPlayer
          sources={sources}
          paused={manuallyPaused || paused}
          id={`${post.id}-player`}
          autoPlay={false}
          ref={mediaPlayerRef}
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

        <View style={styles.top}>
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
        </View>

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
          <LikeCountButton size={28} id={post.id} onPress={handlePressLike} />
        </Animated.View>

        {!paused && (
          <CommentsViewer
            width={width}
            height={height}
            comments={comments}
            timeOffset={playbackTime}
          />
        )}

        <Animated.View pointerEvents="none" style={sheetStyles}></Animated.View>
      </Animated.View>
    </TouchableHighlight>
  );
};

export const PostCard = ({ post, paused, ...props }) => {
  const [loadComments, commentsQuery] = useLazyQuery<
    ViewComments,
    ViewCommentsVariables
  >(VIEW_COMMENTS_QUERY, {
    variables: {
      postId: post.id,
      limit: 20,
      offset: 0
    }
  });

  React.useEffect(() => {
    if (!paused) {
      loadComments({
        variables: {
          postId: post.id,
          limit: 20,
          offset: 0
        }
      });
    }
  }, [paused, post.id, loadComments]);

  const comments = commentsQuery?.data?.comments?.data ?? [];
  return (
    <PostCardComponent
      {...props}
      post={post}
      paused={paused}
      comments={comments}
    />
  );
};
