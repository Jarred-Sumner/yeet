import * as React from "react";
import { StyleSheet, findNodeHandle } from "react-native";
import { requireNativeComponent } from "react-native";
import Animated from "react-native-reanimated";

export const VIEW_NAME = "MovableView";

const NativeTransformableView = requireNativeComponent(VIEW_NAME);

const TransformableView = React.forwardRef(({ inputRef, ...props }, ref) => {
  let handleRef = inputRef?.current ?? inputRef;
  let handle = null;
  if (handleRef?.isTextPostBlock) {
    handle = findNodeHandle(handleRef.textInput.current);
  } else if (handleRef?.isImagePostBlock) {
    handle = handleRef.imageHandle;

    console.log(handleRef.imageRef.current, handle);
  }

  return <NativeTransformableView inputTag={handle} {...props} ref={ref} />;
});

export const TransformableViewComponent = Animated.createAnimatedComponent(
  TransformableView
);
