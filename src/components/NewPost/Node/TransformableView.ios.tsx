import * as React from "react";
import { StyleSheet, findNodeHandle } from "react-native";
import { requireNativeComponent } from "react-native";
import Animated from "react-native-reanimated";
import ReanimatedModule from "react-native-reanimated/src/ReanimatedModule";

// import { createAnimatedTransformableViewComponent } from "./createAnimatedTransformableViewComponent";
export const VIEW_NAME = "MovableView";

const NativeTransformableView = Animated.createAnimatedComponent(
  requireNativeComponent(VIEW_NAME)
);

const TransformableView = React.forwardRef(
  ({ inputRef, onTransform, onTransformLayout, ...props }, ref) => {
    const _ref = React.useRef();

    React.useImperativeHandle(ref, () => _ref.current);

    let handleRef = inputRef?.current ?? inputRef;
    let handle = null;
    if (handleRef?.isTextPostBlock) {
      handle = findNodeHandle(handleRef.textInput.current);
    } else if (handleRef?.isImagePostBlock) {
      handle = handleRef.imageHandle;
    }

    React.useLayoutEffect(() => {
      if (!onTransform) {
        return;
      }

      onTransform.attachEvent(findNodeHandle(_ref.current), "onTransform");
      _ref.current.setNativeProps({ onTransform: true });

      return () => {
        onTransform.detachEvent(findNodeHandle(_ref.current), "onTransform");
        _ref.current.setNativeProps({ onTransform: false });
      };
    }, [onTransform, _ref]);

    return <NativeTransformableView inputTag={handle} {...props} ref={_ref} />;
  }
);

export const TransformableViewComponent = TransformableView;
