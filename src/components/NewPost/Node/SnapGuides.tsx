import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { IS_SIMULATOR } from "../../../../config";
import { runDelay, runTiming, snapButtonValue } from "../../../lib/animations";
import { getAllSnapPoints } from "../../../lib/buildPost";
import { SnapDirection } from "../../../lib/enums";
import { COLORS } from "../../../lib/styles";
import {
  BitmapIconCircleChevronDown,
  BitmapIconCircleChevronLeft,
  BitmapIconCircleChevronRight,
  BitmapIconCircleChevronUp
} from "../../BitmapIcon";

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

    const currentStatusValue = React.useRef(new Animated.Value(0));

    const animationClock = React.useRef(new Animated.Clock());
    const status =
      currentId === id
        ? SnapPositionStatus.active
        : !currentId
        ? SnapPositionStatus.pending
        : SnapPositionStatus.disabled;

    const animationValue = React.useRef(new Animated.Value(status));
    const distance = React.useRef(new Animated.Value(999));
    const shouldActivate = React.useRef(new Animated.Value(0));
    const buttonOpacityValue = React.useRef(new Animated.Value(0));
    const backgroundOpacityValue = React.useRef(new Animated.Value(0));

    return (
      <>
        <Animated.Code
          exec={snapPositionProc(
            distance.current,
            buttonOpacityValue.current,
            isMovingValue,
            midX,
            midY,
            x,
            y,
            size * size,
            animationValue.current,
            animationClock.current,
            currentStatusValue.current,
            currentIdValue,
            id.hashCode(),
            shouldActivate.current,
            backgroundOpacityValue.current
          )}
        />

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: backgroundTop,
            left: backgroundLeft,
            width: backgroundWidth,
            overflow: "visible",
            height: backgroundHeight
          }}
        >
          <Animated.View
            style={{
              backgroundColor: COLORS.primary,
              height: backgroundHeight,
              width: backgroundWidth,
              opacity: backgroundOpacityValue.current
            }}
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: top + translateY,
            left: left + translateX,
            width: size,
            overflow: "visible",
            height: size
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              opacity: buttonOpacityValue.current
            }}
          >
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                overflow: "visible",
                width: size,
                height: size
              }}
            >
              <Icon style={appendStyles.icon} />
            </View>
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
  isMovingValue: _isMovingValue,
  x,
  y,
  onChange
}) => {
  const SNAP_SIZE = 24;
  const points = React.useMemo(
    () => (block ? getAllSnapPoints(block, blocks, positions, SNAP_SIZE) : []),
    [getAllSnapPoints, block, blocks, positions]
  );

  const currentId = snapPoint ? snapPoint.key : null;
  const isMovingValue = React.useRef(new Animated.Value(0));
  const activationClock = React.useRef(new Animated.Clock());

  const currentIdValue = React.useRef(new Animated.Value(-1));

  React.useEffect(() => {
    currentIdValue.current.setValue(-1);
  }, []);

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
    [onChange, points]
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
        isMovingValue={isMovingValue.current}
        // animationValue={animationValue}
        left={point.indicator.x}
        top={point.indicator.y}
        id={point.key}
        // onChange={handleChangeSnapDirection}
        Icon={
          {
            [SnapDirection.bottom]: BitmapIconCircleChevronDown,
            [SnapDirection.top]: BitmapIconCircleChevronUp,
            [SnapDirection.left]: BitmapIconCircleChevronLeft,
            [SnapDirection.right]: BitmapIconCircleChevronRight
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
          ),
          Animated.cond(
            // Animated.and(
            Animated.eq(isMovingValue.current, 1),
            // Animated.not(Animated.clockRunning(activationClock.current))
            // ),
            runDelay(
              Animated.block([Animated.set(isMovingValue.current, 0)]),
              activationClock.current,
              100
            )
          ),
          Animated.cond(
            Animated.and(
              Animated.clockRunning(activationClock.current),
              Animated.eq(isMovingValue.current, 0)
            ),
            Animated.onChange(
              Animated.greaterThan(Animated.abs(Animated.diff(x)), 2),
              [
                Animated.stopClock(activationClock.current),
                Animated.set(isMovingValue.current, 1)
              ]
            ),
            Animated.onChange(
              Animated.greaterThan(Animated.abs(Animated.diff(y)), 2),
              [
                Animated.stopClock(activationClock.current),
                Animated.set(isMovingValue.current, 1)
              ]
            )
          )
        ])}
      />

      {points.map(renderPoint)}

      {IS_SIMULATOR && (
        <Animated.View
          style={{
            backgroundColor: "red",
            width: 32,
            height: 32,
            borderRadius: 16,
            position: "absolute",
            top: y,
            left: x,
            transform: [{ translateX: -16 }, { translateY: -16 }]
          }}
        />
      )}
    </>
  );
};
