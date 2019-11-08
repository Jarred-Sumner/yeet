import Animated, { Easing } from "react-native-reanimated";

const {
  Clock,
  Value,
  set,
  cond,
  startClock,
  clockRunning,
  timing,
  debug,
  proc,
  stopClock,
  block
} = Animated;

export function runTiming(clock, value, dest, duration = 300) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration,
    toValue: new Value(0),
    easing: Easing.inOut(Easing.ease)
  };

  return block([
    cond(
      Animated.neq(value, dest),
      Animated.block([
        cond(
          clockRunning(clock),
          [
            // if the clock is already running we update the toValue, in case a new dest has been passed in
            set(config.toValue, dest)
          ],
          [
            // if the clock isn't running we reset all the animation params and start the clock
            set(state.finished, 0),
            set(state.time, 0),
            set(state.position, value),
            set(state.frameTime, 0),
            set(config.toValue, dest),
            startClock(clock)
          ]
        ),
        // we run the step here that is going to update position
        timing(clock, state, config),
        // if the animation is over we stop the clock
        cond(state.finished, stopClock(clock)),
        // we made the block return the updated position
        state.position
      ]),
      value
    )
  ]);
}
