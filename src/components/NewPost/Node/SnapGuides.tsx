import * as React from "react";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { COLORS } from "../../../lib/styles";
import { snapButtonValue } from "../../../lib/animations";
import { getAllSnapPoints } from "../../../lib/buildPost";
import { SnapDirection } from "../../../lib/enums";
import {
  IconCircleArrowLeft,
  IconCircleArrowUp,
  IconCircleArrowDown,
  IconCircleArrowRight
} from "../../Icon";

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

const SnapPosition = ({
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
    translateX = size * 1;
  } else if (snapDirection === SnapDirection.right) {
    translateY = size * -0.5;
    translateX = size * -1;
  }

  const midX = left + translateX;
  const midY = top + translateY;

  const distance = React.useRef(snapButtonValue(midX, midY, x, y, size));
  const progress = React.useRef(
    Animated.interpolate(distance.current, {
      inputRange: [size, size * 1.3, size * 1.75, size * 2, size * 4],
      outputRange: [1.0, 0.75, 0.25, 0.01, 0],
      extrapolate: Animated.Extrapolate.CLAMP
    })
  );
  const isSnapDirectionActiveValue = React.useRef(
    Animated.greaterOrEq(progress.current, 0.75)
  );

  const handleChange = React.useCallback(
    ([progress]) => {
      onChange(progress, id);
    },
    [id, onChange]
  );

  return (
    <Animated.View style={{ opacity: currentId !== id && !!currentId ? 0 : 1 }}>
      <Animated.Code
        exec={Animated.block([
          Animated.onChange(
            isSnapDirectionActiveValue.current,
            Animated.call([progress.current], handleChange)
          )
        ])}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: backgroundTop,
          left: backgroundLeft,
          width: backgroundWidth,
          height: backgroundHeight,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          opacity: Animated.multiply(progress.current, 0.8)
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
            }
          ],
          opacity: Animated.min(Animated.multiply(progress.current, 10.0), 1.0)
        }}
      >
        <Icon style={appendStyles.icon} size={size} />
      </Animated.View>
    </Animated.View>
  );
};

export const SnapGuides = ({
  blocks,
  positions,
  block,
  frame,
  snapPoint,
  x,
  y,
  onChange
}) => {
  const points = React.useMemo(
    () => (block ? getAllSnapPoints(block, blocks, positions) : []),
    [getAllSnapPoints, block, blocks, positions]
  );

  React.useEffect(() => {
    onChange(null);
  }, [onChange]);

  const handleChangeSnapDirection = React.useCallback(
    (progress, _id) => {
      const _snapPoint = points.find(point => point.key === _id);
      if (!_snapPoint) {
        return;
      }

      if (_snapPoint !== snapPoint && progress > 0.75) {
        onChange(_snapPoint);
      } else if (progress < 0.75) {
        onChange(null);
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
        backgroundWidth={point.background.width}
        backgroundHeight={point.background.height}
        size={32}
        snapDirection={point.direction}
        currentId={snapPoint?.key ?? null}
        x={x}
        y={y}
        left={point.indicator.x}
        top={point.indicator.y}
        id={point.key}
        onChange={handleChangeSnapDirection}
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
    [snapPoint, handleChangeSnapDirection]
  );

  if (snapPoint) {
    return renderPoint(snapPoint);
  } else {
    return points.map(renderPoint);
  }
};
