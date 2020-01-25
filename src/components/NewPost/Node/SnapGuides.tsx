import * as React from "react";
import { View, StyleSheet, LayoutAnimation } from "react-native";
import Animated, {
  Easing,
  Transitioning,
  Transition
} from "react-native-reanimated";
import { COLORS } from "../../../lib/styles";
import { snapButtonValue, runTiming, runDelay } from "../../../lib/animations";
import { getAllSnapPoints } from "../../../lib/buildPost";
import { SnapDirection } from "../../../lib/enums";
import {
  IconCircleArrowLeft,
  IconCircleArrowUp,
  IconCircleArrowDown,
  IconCircleArrowRight
} from "../../Icon";
import { runSpring } from "react-native-redash";

const backgroundColor = COLORS.primaryDark;

const appendStyles = StyleSheet.create({
  bottom: {
    position: "absolute",
    width: "100%",
    left: 0,
    right: 0,
    zIndex: 10
  },
  top: {
    position: "absolute",
    width: "100%",
    left: 0,
    right: 0,
    zIndex: 10
  },
  right: {
    position: "absolute",
    width: 16,
    right: 0,
    top: 0,
    zIndex: 10,
    bottom: 0
  },
  left: {
    position: "absolute",
    width: 16,
    left: 0,
    top: 0,
    zIndex: 10,
    bottom: 0
  },
  color: {
    backgroundColor,
    position: "absolute",
    width: "100%",
    left: 0,
    right: 0,
    zIndex: -1
  },
  horizontalColor: {
    backgroundColor,
    position: "absolute",
    width: "100%",
    bottom: 0,
    top: 0
  },
  largeIcon: {
    color: "white",
    fontSize: 48,
    textShadowRadius: 3,
    textShadowColor: "black"
  },
  icon: {
    color: "white",
    textShadowRadius: 3,
    textShadowOffset: {
      width: 1,
      height: 1
    },
    textShadowColor: "black"
  }
});

enum SnapPositionStatus {
  disabled = -1,
  pending = 0,
  active = 1
}

const SnapPosition = React.memo(
  ({
    top,
    left,
    x,
    y,
    size,
    backgroundWidth,
    currentId,
    backgroundHeight,
    backgroundTop,
    backgroundLeft,
    velocityY,
    isMovingValue,
    previousIdValue,
    velocityX,
    animationProgress,
    currentIdValue,
    snapDirection,
    id,
    onChange,
    Icon
  }) => {
    const horizontal =
      snapDirection === SnapDirection.left ||
      snapDirection === SnapDirection.right;
    const vertical =
      snapDirection === SnapDirection.top ||
      snapDirection === SnapDirection.bottom;
    let translateX = 0;
    let translateY = 0;

    if (snapDirection === SnapDirection.bottom) {
      translateY = size / -2;
      translateX = size / -2;
    } else if (snapDirection === SnapDirection.top) {
      translateY = size / -2;
      translateX = size / -2;
    } else if (snapDirection === SnapDirection.left) {
      translateY = size * -0.5;
      translateX = size * 2;
    } else if (snapDirection === SnapDirection.right) {
      translateY = size * -0.5;
      translateX = size * -1;
    }

    const midX = left + (snapDirection === SnapDirection.left ? translateX : 0);
    const midY = top;

    const currentStatusValue = React.useRef(
      Animated.cond(
        Animated.eq(currentIdValue, -1),
        SnapPositionStatus.pending,
        Animated.cond(
          Animated.eq(currentIdValue, id.hashCode()),
          SnapPositionStatus.active,
          SnapPositionStatus.disabled
        )
      )
    );

    const activationClock = React.useRef(new Animated.Clock());
    const animationClock = React.useRef(new Animated.Clock());
    const status =
      currentId === id
        ? SnapPositionStatus.active
        : !currentId
        ? SnapPositionStatus.pending
        : SnapPositionStatus.disabled;

    const animationValue = React.useRef(new Animated.Value(status));

    const animatedStatusValue = React.useRef(animationValue.current);

    const distance = React.useRef(new Animated.Value(999));

    const shouldActivate = React.useRef(
      Animated.lessOrEq(distance.current, size)
    );

    const buttonOpacityValue = React.useRef(
      Animated.interpolate(animatedStatusValue.current, {
        inputRange: [-1, 0, 1],
        outputRange: [
          0,
          Animated.min(Animated.divide(size * 3, distance.current), 1.0),
          1.0
        ],
        extrapolate: Animated.Extrapolate.CLAMP
      })
    );

    return (
      <>
        <Animated.Code
          exec={Animated.block([
            Animated.set(
              distance.current,
              snapButtonValue(midX, midY, x, y, size)
            ),

            Animated.set(
              animationValue.current,
              runTiming(
                animationClock.current,
                animationValue.current,
                currentStatusValue.current,
                200
              )
            ),

            // Animated.debug("shouldActivate?", shouldActivate.current),

            // Animated.onChange(
            //   shouldActivate.current,
            Animated.block([
              Animated.cond(
                Animated.and(
                  shouldActivate.current,
                  Animated.eq(currentIdValue, -1)
                ),
                runDelay(
                  Animated.block([
                    Animated.cond(
                      Animated.and(
                        shouldActivate.current,
                        Animated.eq(currentIdValue, -1)
                      ),
                      [Animated.set(currentIdValue, id.hashCode())],
                      Animated.cond(
                        Animated.and(
                          Animated.not(shouldActivate.current),
                          Animated.eq(currentIdValue, id.hashCode())
                        ),
                        Animated.set(currentIdValue, -1)
                      )
                    )
                  ]),
                  activationClock.current,
                  200
                ),
                Animated.block([
                  Animated.cond(
                    Animated.and(
                      Animated.not(shouldActivate.current),
                      Animated.eq(currentIdValue, id.hashCode())
                    ),
                    Animated.set(currentIdValue, -1)
                  )
                ])
              )
            ])
            // )
            // Animated.cond(
            //   Animated.eq(currentIdValue, id.hashCode()),
            //   Animated.block([Animated.set(currentIdValue, -1)])
            // )
          ])}
        />

        <View
          style={{
            position: "absolute",
            top: top + translateY,
            left: left + translateX,
            width: size,
            height: size
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              opacity: buttonOpacityValue.current,
              width: size,
              height: size,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Icon style={appendStyles.icon} size={size} />
          </Animated.View>
        </View>
      </>
    );
  }
);

export const SnapGuides = ({
  blocks,
  positions,
  block,
  frame,
  snapPoint,
  velocityX,
  velocityY,
  currentScale,
  isMovingValue,
  x,
  y,
  onChange
}) => {
  const SNAP_SIZE = 20;
  const points = React.useMemo(
    () => (block ? getAllSnapPoints(block, blocks, positions, SNAP_SIZE) : []),
    [getAllSnapPoints, block, blocks, positions]
  );

  const currentId = snapPoint ? snapPoint.key : null;

  const currentIdValue = React.useRef(
    new Animated.Value(currentId ? currentId.hashCode() : -1)
  );

  const handleChangeSnapDirection = React.useCallback(
    ([_id]) => {
      if (_id === -1) {
        // Animated.timing(currentScale, {
        //   toValue: 1.0,
        //   duration: 200,
        //   easing: Easing.ease
        // }).start();
        onChange(null);
      } else {
        const _snapPoint = points.find(point => point.key.hashCode() === _id);
        if (!_snapPoint) {
          return;
        }

        // Animated.timing(currentScale, {
        //   toValue: 0.85,
        //   duration: 300,
        //   easing: Easing.ease
        // }).start();

        onChange(_snapPoint);
      }
    },
    [onChange, snapPoint, points]
  );

  const renderPoint = React.useCallback(
    point => (
      <SnapPosition
        key={point.key}
        backgroundTop={point.background.y}
        backgroundLeft={point.background.x}
        currentIdValue={currentIdValue.current}
        backgroundWidth={point.background.width}
        backgroundHeight={point.background.height}
        size={SNAP_SIZE}
        snapDirection={point.direction}
        currentId={snapPoint?.key ?? null}
        x={x}
        velocityX={velocityX}
        velocityY={velocityY}
        y={y}
        isMovingValue={isMovingValue}
        // animationValue={animationValue}
        left={point.indicator.x}
        top={point.indicator.y}
        id={point.key}
        // onChange={handleChangeSnapDirection}
        Icon={
          {
            [SnapDirection.bottom]: IconCircleArrowDown,
            [SnapDirection.top]: IconCircleArrowUp,
            [SnapDirection.left]: IconCircleArrowLeft,
            [SnapDirection.right]: IconCircleArrowRight
          }[point.direction]
        }
      />
    ),
    [
      // handleChangeSnapDirection,
      isMovingValue,
      velocityX,
      // animationValue,
      velocityY,
      currentIdValue
    ]
  );

  return (
    <>
      <Animated.Code
        exec={Animated.block([
          Animated.onChange(
            currentIdValue.current,
            Animated.block([
              Animated.call([currentIdValue.current], handleChangeSnapDirection)
            ])
          )
        ])}
      />

      {points.map(renderPoint)}
    </>
  );
};
