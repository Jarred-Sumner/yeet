import * as React from "react";
import { View, StyleSheet } from "react-native";
import { SnapPoint, PostLayout, SnapDirection } from "../../lib/enums";
import Animated, {
  Transition,
  Transitioning,
  Easing
} from "react-native-reanimated";
import { BlockList } from "./PostPreview";
import { POST_WIDTH, MAX_POST_HEIGHT } from "../../lib/buildPost";
import { SCREEN_DIMENSIONS } from "../../../config";
import BlurView from "../BlurView";
import { CAROUSEL_HEIGHT } from "./NewPostFormat";
import { runTiming, snapPoint } from "../../lib/animations";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const styles = StyleSheet.create({
  fade: {
    width: POST_WIDTH,
    height: SCREEN_DIMENSIONS.height,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "black",
    position: "absolute"
  },
  wrapper: {
    position: "absolute",
    shadowRadius: 10,
    shadowOffset: {
      width: 2,
      height: 2
    },
    shadowColor: "white",
    shadowOpacity: 0.1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 8,

    overflow: "visible"
  },
  container: {
    width: POST_WIDTH,
    maxHeight: MAX_POST_HEIGHT,
    transform: [{ scale: 0.75 }]
  },
  post: {
    backgroundColor: "black",
    width: POST_WIDTH,
    overflow: "hidden",
    borderRadius: 8
  }
});

type Props = {
  snapPoint: SnapPoint;
  positionKey: string;
};

const InnerPost = React.memo(
  ({ blocks, positions, placeholderFunc, paused }) => (
    <View style={styles.post}>
      <BlockList
        setBlockInputRef={null}
        blocks={blocks}
        positions={positions}
        layout={PostLayout.media}
        onFocus={null}
        onAction={null}
        focusTypeValue={null}
        paused={paused}
        muted
        onOpenImagePicker={null}
        onChangePhoto={null}
        focusType={null}
        onTap={null}
        disabled
        scrollRef={null}
        onLayout={placeholderFunc}
        focusedBlockId={null}
        focusedBlockValue={null}
        onBlur={placeholderFunc}
        setBlockAtIndex={placeholderFunc}
      />
    </View>
  )
);

export const SnapPreview = (props: Props) => {
  const [snapPoint, setSnapPoint] = React.useState(props.snapPoint);

  const placeholderFunc = React.useMemo(() => {
    return () => {};
  }, []);

  const animationProgress = React.useRef(
    new Animated.Value(!!props.snapPoint ? 1 : 0)
  );
  const hasSnapPoint = React.useRef(!!props.snapPoint);
  const animation = React.useRef(null);
  const lastSnapKey = React.useRef(props.snapPoint?.key);

  React.useEffect(() => {
    if (props.snapPoint) {
      setSnapPoint(props.snapPoint);
      hasSnapPoint.current = true;
      lastSnapKey.current = props.snapPoint.key;

      let cancelTimer = setTimeout(() => {
        animation.current = Animated.timing(animationProgress.current, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.quad)
        }).start(didFinish => {
          animation.current = null;
        });

        cancelTimer = null;
      }, 400);

      return () => {
        cancelTimer && window.clearTimeout(cancelTimer);
        if (animation.current) {
          animation.current.cancel();
        }
      };
    } else if (!props.snapPoint && hasSnapPoint.current) {
      const key = lastSnapKey.current;

      animation.current = Animated.timing(animationProgress.current, {
        toValue: 0,
        duration: 300,
        easing: Easing.linear
      }).start(() => {
        if (lastSnapKey.current === key) {
          setSnapPoint(null);
          hasSnapPoint.current = false;
          animation.current = null;
        }
      });

      return () => {
        animation.current?.cancel();
      };
    }
  }, [props.snapPoint, setSnapPoint]);

  if (!snapPoint) {
    return null;
  }

  const {
    value: { blocks, positions },
    indicator: { x, y },
    direction
  } = snapPoint;

  const animationStyles = {
    top: animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [y - CAROUSEL_HEIGHT, CAROUSEL_HEIGHT],
      extrapolate: Animated.Extrapolate.CLAMP
    })
  };

  if (direction === SnapDirection.left) {
    animationStyles.right = animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [x * -1, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    });
  } else if (direction === SnapDirection.right) {
    animationStyles.left = animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    });
  }

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fade,
          {
            opacity: Animated.multiply(animationProgress.current, 0.7)
          }
        ]}
      />

      <Animated.View
        style={[
          styles.wrapper,
          animationStyles,
          {
            opacity: animationProgress.current.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
              extrapolate: Animated.Extrapolate.CLAMP
            }),
            transform: [
              {
                scale: animationProgress.current.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.01, 0.85],
                  extrapolate: Animated.Extrapolate.CLAMP
                })
              }
            ]
          }
        ]}
      >
        <InnerPost
          blocks={blocks}
          positions={positions}
          paused={!!props.snapPoint}
          placeholderFunc={placeholderFunc}
        />
      </Animated.View>
    </>
  );
};
