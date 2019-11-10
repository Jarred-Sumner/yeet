import React, { Component } from "react";
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  State,
  TapGestureHandler,
  LongPressGestureHandler
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import {
  preserveMultiplicativeOffset,
  preserveOffset
} from "react-native-redash";
import { StyleSheet } from "react-native";

import { CommentEditor } from "./CommentEditor";

type CommentComposerContextType = {
  children: React.ReactChildren | null;
  isVisible: boolean;
};

const styles = StyleSheet.create({});

export const CommentComposer = ({
  postId,
  width,
  height,
  keyboardVisibleValue,
  onOpen,
  onClose
}) => {
  const onLongPress = React.useCallback(
    ({ nativeEvent: { x, y } }) => {
      onOpen({ x, y, width, height, keyboardVisibleValue, postId });
    },
    [onOpen]
  );

  return (
    <LongPressGestureHandler maxDist={10} onGestureEvent={onLongPress}>
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height
        }}
      />
    </LongPressGestureHandler>
  );
};
