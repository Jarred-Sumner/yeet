import * as React from "react";
import { StyleSheet } from "react-native";
import {
  Transition,
  Transitioning,
  TransitioningView
} from "react-native-reanimated";
import { PostFormat, TextBorderType, TextTemplate } from "../../lib/enums";
import { CommentFragment } from "../../lib/graphql/CommentFragment";
import { buildTextBlock } from "../NewPost/NewPostFormat";
import { TransformableView } from "../NewPost/Node/MovableNode";
import TextInput from "../NewPost/Text/TextInput";

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
      template: TextTemplate.comment,
      overrides: { backgroundColor, textColor },
      border: TextBorderType.highlight,
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
