import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Mask,
  Image,
  Use,
  G,
  ClipPath
} from "react-native-svg";
import Animated from "react-native-reanimated";
import { COLORS } from "../../lib/styles";

const { interpolate, multiply } = Animated;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularPogressProps {
  progress: Animated.Value<number>;
}

export const CircularProgressBar = React.memo(
  ({ progress, width, strokeWidth = 3.5 }: CircularPogressProps) => {
    const size = width;
    const { PI } = Math;
    const r = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;

    const circumference = r * 2 * PI;
    const α = interpolate(progress, {
      inputRange: [0, 1],
      outputRange: [PI * 2, 0]
    });
    const strokeDashoffset = multiply(α, r);
    return (
      <Svg width={size} height={size} style={styles.container}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="100%" y2="0">
            <Stop offset="0" stopColor={COLORS.primaryDark} />
            <Stop offset="1" stopColor={COLORS.primary} />
          </LinearGradient>
        </Defs>
        <G id="group">
          <Circle
            stroke="rgba(255, 255, 255, 0.2)"
            fill="none"
            {...{
              strokeWidth,
              cx,
              cy,
              r
            }}
          />
          <AnimatedCircle
            stroke="url(#grad)"
            fill="none"
            strokeDasharray={`${circumference}, ${circumference}`}
            {...{
              strokeDashoffset,
              strokeWidth,
              cx,
              cy,
              r
            }}
          />
        </G>
      </Svg>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    transform: [{ rotateZ: "270deg" }]
  }
});

export default CircularProgressBar;
