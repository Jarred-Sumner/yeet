import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { IS_SIMULATOR } from "../../../../config";
import { runDelay, runTiming, snapButtonValue } from "../../../lib/animations";
import { getAllSnapPoints, FocusType } from "../../../lib/buildPost";
import { SnapDirection } from "../../../lib/enums";
import { COLORS } from "../../../lib/styles";
import {
  BitmapIconCircleChevronDown,
  BitmapIconCircleChevronLeft,
  BitmapIconCircleChevronRight,
  BitmapIconCircleChevronUp
} from "../../BitmapIcon";
import { IconPlus } from "../../Icon";

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
  icon: {
    width: 30,
    height: 30
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
  }
});

enum SnapPositionStatus {
  disabled = -1,
  pending = 0,
  active = 1
}

const snapPositionProc = Animated.proc(
  (
    distance,
    buttonOpacityValue,
    isMovingValue,
    midX,
    midY,
    x,
    y,
    size,
    animationValue,
    animationClock,
    currentStatusValue,
    currentIdValue,
    id,
    shouldActivate,
    backgroundOpacityValue
  ) =>
    Animated.block([
      Animated.set(distance, snapButtonValue(midX, midY, x, y, size)),
      Animated.set(
        shouldActivate,
        Animated.lessOrEq(distance, size)
        // Animated.and(
        //   ,
        //   Animated.neq(currentStatusValue, SnapPositionStatus.disabled)
        // )
      ),

      Animated.set(
        animationValue,
        runTiming(
          animationClock,
          animationValue,
          Animated.cond(
            Animated.eq(currentIdValue, -1),
            SnapPositionStatus.pending,
            Animated.cond(
              Animated.eq(currentIdValue, id),
              SnapPositionStatus.active,
              SnapPositionStatus.disabled
            )
          ),
          200
        )
      ),

      Animated.set(
        buttonOpacityValue,
        Animated.cond(
          shouldActivate,
          1,

          Animated.cond(
            Animated.lessThan(
              Animated.divide(Animated.multiply(size, 5), distance),
              0.2
            ),
            0,

            Animated.max(
              Animated.min(
                Animated.multiply(
                  Animated.add(animationValue, 1.0),
                  Animated.min(
                    Animated.divide(Animated.multiply(size, 5), distance),
                    1.0
                  )
                ),
                1.0
              ),
              0
            )
          )
        )
        // Animated.interpolate(animationValue, {
        //   inputRange: [
        //     SnapPositionStatus.disabled,
        //     SnapPositionStatus.pending,
        //     SnapPositionStatus.active
        //   ],
        //   outputRange: [
        //     0,
        //     Animated.min(
        //       Animated.divide(Animated.multiply(size, 5), distance),
        //       1.0
        //     ),
        //     1.0
        //   ],
        //   extrapolate: Animated.Extrapolate.CLAMP
        // })
      ),
      Animated.set(
        backgroundOpacityValue,
        Animated.cond(
          Animated.eq(currentIdValue, id),
          Animated.min(Animated.multiply(0.4, animationValue), 0.4),
          Animated.multiply(0.05, buttonOpacityValue)
        )
      ),
      Animated.block([
        Animated.cond(
          Animated.and(
            shouldActivate,
            Animated.and(
              Animated.eq(currentIdValue, -1),
              Animated.not(isMovingValue)
            )
          ),
          [Animated.set(currentIdValue, id)],
          Animated.cond(
            Animated.and(
              Animated.or(Animated.not(shouldActivate), isMovingValue),
              Animated.eq(currentIdValue, id)
            ),
            Animated.set(currentIdValue, -1)
          )
        )
      ])
    ])

  // Animated.onChange(
  //   shouldActivate,
  //   Animated.block([
  //     Animated.cond(
  //       Animated.and(
  //         shouldActivate,
  //         Animated.and(
  //           Animated.eq(currentIdValue, -1),
  //           Animated.not(isMovingValue)
  //         )
  //       ),
  //       runDelay(

  //         activationClock,
  //         200
  //       ),
  //       Animated.block([
  //         Animated.cond(
  //           Animated.and(
  //             Animated.not(shouldActivate),
  //             Animated.eq(currentIdValue, id)
  //           ),
  //           Animated.set(currentIdValue, -1)
  //         )
  //       ])
  //     )
  //   ])
  // ])

  // )
);

enum SnapPositionActivationStatus {
  pending = "pending",
  highlight = "highlight",
  activated = "activated"
}

const SnapPosition = React.memo(
  ({
    top,
    left,
    x,
    y,
    size,
    snapDirection,
    backgroundWidth,
    backgroundHeight,
    backgroundTop,
    backgroundLeft,
    id,
    status = SnapPositionActivationStatus.highlight,
    onChange,
    Icon
  }) => {
    const translateDirection = {
      [SnapDirection.bottom]: "translateY",
      [SnapDirection.top]: "translateY",
      [SnapDirection.left]: "translateX",
      [SnapDirection.right]: "translateX"
    }[snapDirection];

    const translateSign = [SnapDirection.bottom, SnapDirection.right].includes(
      snapDirection
    )
      ? 1
      : -1;
    const translateAmount = {
      [SnapPositionActivationStatus.pending]: 12,
      [SnapPositionActivationStatus.highlight]: 24,
      [SnapPositionActivationStatus.activated]: 48
    }[status];

    return (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: backgroundTop,
          left: backgroundLeft,
          width: backgroundWidth,
          overflow: "visible",
          height: backgroundHeight,
          transform: [{ [translateDirection]: translateAmount * translateSign }]
        }}
      >
        <View
          pointerEvents="none"
          style={{
            backgroundColor,
            height: backgroundHeight,
            width: backgroundWidth,
            borderRadius: 12,
            justifyContent: "center",

            alignItems: "center"
          }}
        >
          <Icon size={18} color="#4318BC" />
        </View>
      </View>
    );
  }
);

export const SnapGuides = ({ snapPoint, snapPoints }) => {
  const SNAP_SIZE = 24;

  const currentId = snapPoint ? snapPoint.key : null;

  const renderPoint = React.useCallback(
    point => (
      <SnapPosition
        key={point.key}
        backgroundTop={point.background.y}
        backgroundLeft={point.background.x}
        backgroundWidth={point.background.width}
        backgroundHeight={point.background.height}
        size={SNAP_SIZE}
        snapDirection={point.direction}
        currentId={currentId}
        // animationValue={animationValue}
        left={point.indicator.x}
        top={point.indicator.y}
        id={point.key}
        // onChange={handleChangeSnapDirection}
        Icon={IconPlus}
      />
    ),
    [currentId]
  );

  return <View>{snapPoints.map(renderPoint)}</View>;
};
