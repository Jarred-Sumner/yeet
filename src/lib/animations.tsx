import Animated, { Easing } from "react-native-reanimated";
import { State } from "react-native-gesture-handler";

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
  add,
  eq,
  sub,
  block,
  not,
  multiply,
  divide
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

const _preserveOffset = Animated.proc(
  (
    value: Animated.Adaptable<number>,
    state: Animated.Adaptable<State>,
    offset: Animated.Value<number>,
    previous: Animated.Value<number>
  ) => {
    return block([
      cond(
        eq(state, State.ACTIVE),
        [set(offset, add(offset, sub(value, previous))), set(previous, value)],
        [set(previous, 0)]
      ),
      offset
    ]);
  }
);

const _preserveMinMaxOffset = Animated.proc(
  (
    value: Animated.Adaptable<number>,
    state: Animated.Adaptable<State>,
    offset: Animated.Value<number>,
    previous: Animated.Value<number>,
    _min: Animated.Value<number>,
    _max: Animated.Value<number>
  ) => {
    return Animated.block([
      Animated.min(
        Animated.max(_preserveOffset(value, state, offset, previous), _min),
        _max
      )
    ]);
  }
);

export const preserveOffset = (
  value: Animated.Adaptable<number>,
  state: Animated.Adaptable<State>,
  offset: Animated.Value<number> = new Value(0),
  previous: Animated.Value<number> = new Value(0),
  min?: Animated.Value<number>,
  max?: Animated.Value<number>
) => {
  // if (min && max) {
  //   return _preserveMinMaxOffset(value, state, offset, previous, min, max);
  // } else {
  return _preserveOffset(value, state, offset, previous);
  // }
};

const _preserveMultiplicativeOffset = Animated.proc(
  (
    value: Animated.Adaptable<number>,
    state: Animated.Adaptable<number>,
    previous: Animated.Value<number>,
    offset: Animated.Value<number>
  ) => {
    return block([
      cond(
        eq(state, State.BEGAN),
        [set(previous, 1)],
        [
          set(offset, multiply(offset, divide(value, previous))),
          set(previous, value)
        ]
      ),
      offset
    ]);
  }
);

export const preserveMultiplicativeOffset = (
  value: Animated.Adaptable<number>,
  state: Animated.Adaptable<number>
) => {
  const previous = new Animated.Value(1);
  const offset = new Animated.Value(1);

  return _preserveMultiplicativeOffset(value, state, previous, offset);
};

export function runLoopAnimation({
  toValue = 1,
  easing = Easing.inOut(Easing.linear),
  duration = 1000
}) {
  const clock = new Clock();

  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration: new Value(duration),
    toValue: new Value(toValue),
    easing
  };

  return block([
    // start right away
    startClock(clock),

    // process your state
    timing(clock, state, config),

    // when over (processed by timing at the end)
    cond(state.finished, [
      // we stop
      stopClock(clock),

      // set flag ready to be restarted
      set(state.finished, 0),
      // same value as the initial defined in the state creation
      set(state.position, 0),

      // very important to reset this ones !!! as mentioned in the doc about timing is saying
      set(state.time, 0),
      set(state.frameTime, 0),

      // and we restart
      startClock(clock)
    ]),

    state.position
  ]);
}
