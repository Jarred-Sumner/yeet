import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  TouchableHighlight,
  TouchableWithoutFeedback,
  BaseButton
} from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Transition,
  Transitioning,
  TransitioningView
} from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { scaleToWidth } from "../../lib/Rect";
import { SPACING, COLORS } from "../../lib/styles";
import { Avatar, CurrentUserAvatar } from "../Avatar";
import { IconButtonEllipsis } from "../Button";
import MediaPlayer from "../MediaPlayer";
import { SemiBoldText, MediumText, Text } from "../Text";
import { LikeCountButton } from "../ThreadList/LikeCountButton";
import VIEW_COMMENTS_QUERY from "../../lib/ViewComments.graphql";
import { useLazyQuery } from "react-apollo";
import { CommentFragment } from "../../lib/graphql/CommentFragment";
import tinycolor from "tinycolor2";
import { memoize } from "lodash";
import { MovableNode, TransformableView } from "../NewPost/Node/MovableNode";
import { CommentComposer } from "./CommentComposer";
import TextInput from "../NewPost/Text/TextInput";
import { buildTextBlock, PostFormat } from "../NewPost/NewPostFormat";
import { UserContext } from "../UserContext";
import { useNavigation } from "react-navigation-hooks";

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
    .setAlpha(0.15)
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
  avatar: {},
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
  },
  touchable: {
    overflow: "visible"
  },
  avatarContainer: {
    position: "absolute",
    top: AVATAR_SIZE / -2,
    left: AVATAR_SIZE / -2,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    height: AVATAR_SIZE
  },
  username: {
    marginLeft: 4,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    fontSize: 12,
    alignSelf: "center",
    opacity: 0.65,
    textAlignVertical: "center",
    height: AVATAR_SIZE,
    color: "#fff",
    textShadowOffset: {
      width: 1,
      height: 1
    },
    textShadowRadius: 1
  }
});

export const TextCommentAvatar = React.memo(({ username, photoURL, onTap }) => {
  return (
    <View style={textCommentStyles.avatarContainer}>
      <BaseButton
        disallowInterruption
        style={textCommentStyles.touchable}
        onPress={onTap}
      >
        <Animated.View>
          <Avatar
            label={username}
            url={photoURL}
            size={AVATAR_SIZE}
            style={textCommentStyles.avatar}
          />
        </Animated.View>
      </BaseButton>

      <BaseButton
        disallowInterruption
        style={textCommentStyles.touchable}
        onPress={onTap}
      >
        <Animated.View>
          <Text style={textCommentStyles.username}>{username}</Text>
        </Animated.View>
      </BaseButton>
    </View>
  );
});

export const CurrentUserCommentAvatar = () => {
  const { currentUser: { username } = {} } = React.useContext(UserContext);

  return (
    <View style={textCommentStyles.avatarContainer}>
      <CurrentUserAvatar size={AVATAR_SIZE} style={textCommentStyles.avatar} />
      <Text style={textCommentStyles.username}>{username}</Text>
    </View>
  );
};

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
  onTap,
  keyboardVisibleValue,
  textColor
}) => {
  const block = React.useMemo(() => {
    return buildTextBlock({
      value: body,
      format: PostFormat.comment,
      overrides: { backgroundColor, textColor },
      placeholder: "",
      autoInserted: false,
      required: false
    });
  }, [body, backgroundColor, textColor]);

  return (
    <TransformableView
      scale={scale}
      rotate={rotate}
      translateX={x}
      translateY={y}
      rasterize
    >
      <TextInput
        block={block}
        editable={false}
        isFocused={false}
        text={body}
        photoURL={profile.photoURL}
        onTapAvatar={onTap}
        username={profile.username}
      />
    </TransformableView>
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
    console.log("TAP TAP");
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
  onTap,
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
          onTap={onTap}
        />
      );
    },
    [keyboardVisibleValue, height, onTap]
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
              type="fade"
              interpolation="easeIn"
              delayMs={0}
              durationMs={200}
            />

            <Transition.Change interpolation="linear" />

            <Transition.Out
              type="fade"
              delayMs={0}
              interpolation="easeOut"
              durationMs={200}
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
