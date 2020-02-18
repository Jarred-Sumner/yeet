import * as React from "react";
import { StyleSheet, findNodeHandle } from "react-native";
import { requireNativeComponent } from "react-native";
import Animated from "react-native-reanimated";
import ReanimatedModule from "react-native-reanimated/src/ReanimatedModule";
import { useAnimatedEvent } from "../../../lib/animations";
import { ContentContainerContext } from "../ContentContainerContext";

// import { createAnimatedTransformableViewComponent } from "./createAnimatedTransformableViewComponent";
export const VIEW_NAME = "MovableView";

const NativeTransformableView = requireNativeComponent(VIEW_NAME);

const TransformableView = React.forwardRef(({ inputRef, ...props }, ref) => {
  const _ref = React.useRef();
  // const { contentContainerTag } = React.useContext(ContentContainerContext);

  React.useImperativeHandle(ref, () => _ref.current);

  let handleRef = inputRef?.current ?? inputRef;
  let handle = null;
  if (handleRef?.isTextPostBlock) {
    handle = findNodeHandle(handleRef.textInput.current);
  } else if (handleRef?.isImagePostBlock) {
    handle = handleRef.imageHandle;
  }

  return (
    <NativeTransformableView
      inputTag={handle}
      {...props}
      // contentContainerTag={contentContainerTag}
      ref={_ref}
    />
  );
});

export const TransformableViewComponent = TransformableView;
