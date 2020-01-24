import * as React from "react";
import { View, StyleSheet, LayoutAnimation } from "react-native";
import Animated, {
  Easing,
  Transitioning,
  Transition
} from "react-native-reanimated";
import { COLORS } from "../../../lib/styles";
import { snapButtonValue, runTiming } from "../../../lib/animations";
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
    fontSize: 24,
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
    scaleValue = 1.0,
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
      translateX = size * 1;
    } else if (snapDirection === SnapDirection.right) {
      translateY = size * -0.5;
      translateX = size * -1;
    }

    const midX = left + translateX;
    const midY = top + translateY;

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

    const animationClock = React.useRef(new Animated.Clock());
    const animationValue = React.useRef(
      new Animated.Value(
        currentId === id
          ? SnapPositionStatus.active
          : !currentId
          ? SnapPositionStatus.pending
          : SnapPositionStatus.disabled
      )
    );

    const animatedStatusValue = React.useRef(animationValue.current);

    const distance = React.useRef(snapButtonValue(midX, midY, x, y, size));

    const progress = React.useRef(
      Animated.interpolate(distance.current, {
        inputRange: [size, size * 1.2, size * 1.75, size * 2, size * 4],
        outputRange: [1.0, 0.75, 0.25, 0.1, 0],
        extrapolate: Animated.Extrapolate.CLAMP
      })
    );

    return (
      <View>
        <Animated.Code
          exec={Animated.block([
            Animated.set(
              animationValue.current,
              runTiming(
                animationClock.current,
                animationValue.current,
                currentStatusValue.current,
                200
              )
            ),
            Animated.onChange(
              Animated.greaterThan(progress.current, 0.99),
              Animated.cond(
                Animated.and(
                  Animated.greaterThan(progress.current, 0.99),
                  Animated.eq(currentIdValue, -1)
                ),
                Animated.block([Animated.set(currentIdValue, id.hashCode())]),

                Animated.cond(
                  Animated.and(
                    Animated.lessOrEq(progress.current, 0.99),
                    Animated.eq(currentIdValue, id.hashCode())
                  ),
                  Animated.block([Animated.set(currentIdValue, -1)])
                )
              )
            )
          ])}
        />
        <Animated.View
          pointerEvents="none"
          key="background"
          style={{
            position: "absolute",
            top: backgroundTop,
            left: backgroundLeft,
            width: backgroundWidth,
            height: backgroundHeight,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor,
            opacity: Animated.interpolate(animatedStatusValue.current, {
              inputRange: [-1, 0, 1],
              outputRange: [
                0,
                Animated.multiply(progress.current, 0.1),
                Animated.multiply(progress.current, 0.5)
              ],
              extrapolate: Animated.Extrapolate.CLAMP
            }),
            zIndex: -1
          }}
        ></Animated.View>

        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top,
            left,
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
            transform: [
              {
                translateX
              },
              {
                translateY
              },
              {
                scale: Animated.interpolate(animatedStatusValue.current, {
                  inputRange: [-1, 0, 1],
                  outputRange: [1, 1, 1.15],
                  extrapolate: Animated.Extrapolate.CLAMP
                })
              }
            ],
            opacity: Animated.interpolate(animatedStatusValue.current, {
              inputRange: [-1, 0, 1],
              outputRange: [0, Animated.multiply(progress.current, 20), 1.0],
              extrapolate: Animated.Extrapolate.CLAMP
            })
          }}
        >
          <Icon style={appendStyles.icon} size={size} />
        </Animated.View>
      </View>
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
  const points = React.useMemo(
    () => (block ? getAllSnapPoints(block, blocks, positions) : []),
    [getAllSnapPoints, block, blocks, positions]
  );

  const currentId = snapPoint ? snapPoint.key : null;

  const currentIdValue = React.useRef(
    new Animated.Value(currentId ? currentId.hashCode() : -1)
  );

  const handleChangeSnapDirection = React.useCallback(
    ([_id]) => {
      if (_id === -1) {
        Animated.timing(currentScale, {
          toValue: 1.0,
          duration: 200,
          easing: Easing.ease
        }).start();
        onChange(null);
      } else {
        const _snapPoint = points.find(point => point.key.hashCode() === _id);
        if (!_snapPoint) {
          return;
        }

        Animated.timing(currentScale, {
          toValue: 0.9,
          duration: 200,
          easing: Easing.ease
        }).start();

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
        size={32}
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
