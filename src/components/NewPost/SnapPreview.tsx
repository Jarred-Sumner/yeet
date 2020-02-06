import * as React from "react";
import { View, StyleSheet } from "react-native";
import { SnapPoint, PostLayout, SnapDirection } from "../../lib/enums";
import Animated, {
  Transition,
  Transitioning,
  Easing
} from "react-native-reanimated";
import { BlockList } from "./PostPreview";
import { isEmpty } from "lodash";
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
  shadowSnapView: {
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
    left: 0,
    right: 0,
    position: "absolute"
  },
  verticalSnapView: {
    // alignSelf: "center",
    justifyContent: "center",
    alignItems: "center"
  },
  horizontalSnapView: {
    alignItems: "center"
  },
  wrapper: {
    position: "absolute",
    justifyContent: "center",
    // alignItems: "center",
    overflow: "visible"
  },
  leftWrapper: {
    position: "absolute",
    // alignItems: "flex-end",
    justifyContent: "center",
    overflow: "visible"
  },
  rightWrapper: {
    position: "absolute",
    // alignItems: "flex-end",
    justifyContent: "center",
    overflow: "visible"
  },
  bottomWrapper: {
    position: "absolute",
    // alignItems: "flex-end",
    justifyContent: "center",
    overflow: "visible"
  },
  topWrapper: {
    position: "absolute",
    // alignItems: "flex-start",
    justifyContent: "center",
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
  ({ blocks, positions, placeholderFunc, paused }) => {
    if (isEmpty(blocks) || isEmpty(positions)) {
      return null;
    }

    return (
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
    );
  }
);

export const SnapPreview = (props: Props) => {
  const [snapPoint, setSnapPoint] = React.useState(props.snapPoint);

  const placeholderFunc = React.useMemo(() => {
    return () => {};
  }, []);

  const animationProgress = React.useRef(new Animated.Value(0));
  const hasSnapPoint = React.useRef(!!props.snapPoint);
  const animation = React.useRef(null);
  const lastSnapKey = React.useRef(props.snapPoint?.key);
  const animationClock = React.useRef(new Animated.Clock());
  const _animationValue = React.useRef(new Animated.Value<number>(0));

  const hideView = React.useRef(function() {
    props.onDismiss();
  });

  React.useEffect(() => {
    if (props.snapPoint) {
      setSnapPoint(props.snapPoint);
      hasSnapPoint.current = true;
      lastSnapKey.current = props.snapPoint.key;
      _animationValue.current.setValue(1);
    } else if (!props.snapPoint && hasSnapPoint.current) {
      hasSnapPoint.current = false;
      _animationValue.current.setValue(0);
    }
  }, [props.snapPoint, setSnapPoint]);

  const {
    value: { blocks, positions } = { blocks: {}, positions: [] },
    indicator: { x, y } = { x, y },
    background: { height } = { height: 0 },
    direction = SnapDirection.none
  } = snapPoint || {};

  const animationStyles = {};

  if (direction === SnapDirection.bottom) {
    animationStyles.bottom = animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [-y, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    });
    animationStyles.top = animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [-y, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    });
    animationStyles.left = 0;
    animationStyles.right = 0;
  } else if (direction === SnapDirection.top) {
    animationStyles.top = animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [y, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    });
    animationStyles.bottom = animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [-y, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    });
    animationStyles.left = 0;
    animationStyles.right = 0;
  }

  if (direction === SnapDirection.left) {
    animationStyles.right = animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [x * -1, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    });
    animationStyles.left = 0;
    animationStyles.top = Animated.multiply(y, -1);
    animationStyles.bottom = Animated.multiply(y, -1);
  } else if (direction === SnapDirection.right) {
    animationStyles.left = animationProgress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    });
    animationStyles.right = 0;
    animationStyles.top = Animated.multiply(y, -1);
    animationStyles.bottom = Animated.multiply(y, -1);
  }

  return (
    <>
      <Animated.Code
        exec={Animated.block([
          Animated.set(
            animationProgress.current,
            Animated.cond(
              Animated.eq(_animationValue.current, 1),
              runTiming(
                animationClock.current,
                animationProgress.current,
                _animationValue.current,
                300,
                Easing.inOut(Easing.quad)
              ),
              runTiming(
                animationClock.current,
                animationProgress.current,
                _animationValue.current,
                200,
                Easing.linear,
                Animated.block([Animated.call([], hideView.current)])
              )
            )
          )
        ])}
      />
      <Animated.View
        key={snapPoint?.key + "fade" ?? "" + "fade"}
        pointerEvents="none"
        style={[
          styles.fade,
          {
            opacity: Animated.multiply(animationProgress.current, 0.7)
          }
        ]}
      />

      <Animated.View
        key={snapPoint?.key}
        style={[
          {
            [SnapDirection.bottom]: styles.bottomWrapper,
            [SnapDirection.left]: styles.leftWrapper,
            [SnapDirection.right]: styles.rightWrapper,
            [SnapDirection.top]: styles.topWrapper
          }[direction],
          animationStyles,
          {
            opacity: animationProgress.current.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
              extrapolate: Animated.Extrapolate.CLAMP
            }),
            transform: [
              // {
              //   translateY: animationProgress.current.interpolate({
              //     inputRange: [0, 1],
              //     outputRange: [0, Animated.multiply(props.offsetY, -1)],
              //     extrapolate: Animated.Extrapolate.CLAMP
              //   })
              // },
              {
                scale: animationProgress.current.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    0.01,

                    Animated.cond(
                      Animated.greaterOrEq(
                        Animated.divide(SCREEN_DIMENSIONS.height, height),
                        1.0
                      ),
                      Animated.min(
                        0.85,
                        Animated.divide(SCREEN_DIMENSIONS.height, height)
                      ),
                      Animated.min(
                        0.55,
                        Animated.divide(SCREEN_DIMENSIONS.height, height)
                      )
                    )
                  ],
                  extrapolate: Animated.Extrapolate.CLAMP
                })
              }
            ]
          }
        ]}
      >
        <View style={styles.shadowSnapView}>
          <InnerPost
            blocks={blocks}
            positions={positions}
            paused={false}
            placeholderFunc={placeholderFunc}
          />
        </View>
      </Animated.View>
    </>
  );
};