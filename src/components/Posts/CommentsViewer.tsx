import * as React from "react";
import { StyleSheet, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Transition,
  Transitioning,
  TransitioningView
} from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { scaleToWidth } from "../../lib/Rect";
import { SPACING } from "../../lib/styles";
import { Avatar, CurrentUserAvatar } from "../Avatar";
import { IconButtonEllipsis } from "../Button";
import MediaPlayer from "../MediaPlayer";
import { SemiBoldText, MediumText } from "../Text";
import { LikeCountButton } from "../ThreadList/LikeCountButton";
import VIEW_COMMENTS_QUERY from "../../lib/ViewComments.graphql";
import { useLazyQuery } from "react-apollo";
import { CommentFragment } from "../../lib/graphql/CommentFragment";
import tinycolor from "tinycolor2";
import { memoize } from "lodash";
import { MovableNode, TransformableView } from "../NewPost/Node/MovableNode";
import { CommentComposer } from "./CommentComposer";

const AVATAR_SIZE = 22;

const styles = StyleSheet.create({
  comments: {
    position: "absolute",
    top: 0,
    left: 0
  },
  newCommentWrapper: {
    ...StyleSheet.absoluteFillObject
  }
});

const _normalizedBackgroundColor = (color: string) =>
  tinycolor(color)
    .setAlpha(0.35)
    .toString();

export const normalizeBackgroundColor = memoize(_normalizedBackgroundColor);

export const textCommentStyles = StyleSheet.create({
  textContainer: {
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    overflow: "hidden"
  },
  container: {
    position: "relative",
    overflow: "visible"
  },
  avatar: {
    position: "absolute",
    top: AVATAR_SIZE / -2,
    left: AVATAR_SIZE / -2
  },
  text: {
    fontSize: 14,
    maxWidth: 200,
    maxHeight: 66
  },
  shadowContainer: {
    shadowRadius: 1,
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowOpacity: 0.25,
    shadowColor: "black"
  }
});

export const TextCommentAvatar = ({ username, photoURL }) => (
  <Avatar
    label={username}
    url={photoURL}
    size={AVATAR_SIZE}
    style={textCommentStyles.avatar}
  />
);

export const CurrentUserCommentAvatar = () => (
  <CurrentUserAvatar size={AVATAR_SIZE} style={textCommentStyles.avatar} />
);

const TextComment = ({
  body,
  x,
  y,
  profile,
  id,
  maxY,
  scale,
  rotate,
  backgroundColor,
  keyboardVisibleValue,
  textColor: color
}) => {
  return (
    <Animated.View>
      <TransformableView
        scale={scale}
        rotate={rotate}
        translateX={x}
        translateY={y}
      >
        <View style={textCommentStyles.container}>
          <View style={textCommentStyles.shadowContainer}>
            <View
              style={[
                textCommentStyles.textContainer,
                { backgroundColor: normalizeBackgroundColor(backgroundColor) }
              ]}
            >
              <MediumText style={[textCommentStyles.text, { color }]}>
                {body}
              </MediumText>
            </View>
          </View>
        </View>

        <TextCommentAvatar
          username={profile.username}
          photoURL={profile.photoURL}
        />
      </TransformableView>
    </Animated.View>
  );
};

const Comment = ({
  comment,
  keyboardVisibleValue,
  onTap,
  maxY
}: {
  comment: CommentFragment;
}) => {
  const handleTapComment = React.useCallback(() => {
    onTap(comment);
  }, [onTap, comment]);

  if (comment.body) {
    const {
      body,
      x,
      y,
      profile,
      backgroundColor,
      textColor,
      scale,
      rotate
    } = comment;
    return (
      <TextComment
        body={body}
        x={x}
        onTap={handleTapComment}
        y={y}
        scale={scale}
        rotate={rotate}
        id={comment.id}
        maxY={maxY}
        keyboardVisibleValue={keyboardVisibleValue}
        profile={profile}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />
    );
  } else {
    return null;
  }
};

export const CommentsViewer = ({
  comments,
  width,
  height,
  postId,
  timeOffset,
  showAll = false,
  keyboardVisibleValue
}) => {
  const renderComment = React.useCallback(
    comment => {
      return (
        <Comment
          key={comment.id}
          keyboardVisibleValue={keyboardVisibleValue}
          comment={comment}
          maxY={height}
        />
      );
    },
    [keyboardVisibleValue, height]
  );

  const filteredComents = React.useMemo(() => {
    if (showAll) {
      return comments;
    }

    return comments.filter(comment => {
      const { timeOffset: startTime, autoplaySeconds: duration } = comment;
      return timeOffset >= startTime && startTime + duration > timeOffset;
    });
  }, [timeOffset, comments, comments.length, showAll]);

  const commentsRef = React.useRef<TransitioningView>();

  React.useLayoutEffect(() => {
    commentsRef.current.animateNextTransition();
  }, [filteredComents, commentsRef]);

  return (
    <>
      <Transitioning.View
        ref={commentsRef}
        transition={
          <Transition.Together>
            <Transition.In
              type="scale"
              interpolation="easeIn"
              durationMs={300}
            />
            <Transition.In
              type="fade"
              interpolation="easeIn"
              durationMs={300}
            />
            <Transition.Out
              type="scale"
              interpolation="easeOut"
              durationMs={300}
            />
            <Transition.Out
              type="fade"
              interpolation="easeOut"
              durationMs={30}
            />
          </Transition.Together>
        }
        style={[styles.comments, { width, height }]}
      >
        {filteredComents.map(renderComment)}
      </Transitioning.View>
    </>
  );
};
