import Animated, { Easing } from "react-native-reanimated";
import { State } from "react-native-gesture-handler";
import * as React from "react";
import { findNodeHandle, LayoutAnimation } from "react-native";
import euclideanDistance from "euclidean-distance";

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
  diff,
  lessThan,
  greaterThan,
  abs,
  min,
  eq,
  sub,
  block,
  not,
  multiply,
  divide
} = Animated;

export function runTiming(
  clock,
  value,
  dest,
  duration = 300,
  easing = Easing.inOut(Easing.ease),
  completion = Animated.block([])
) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration,
    toValue: new Value(0),
    easing: easing
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
        cond(state.finished, [stopClock(clock), completion]),
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

const _preserveMultiplicativeOffset = (
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
};

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

export const sheetOpacity = Animated.proc(
  (dismissY, scrollY, height, offset, maxOpacity = 0.65) =>
    Animated.cond(
      Animated.lessOrEq(
        dismissY,
        Animated.add(Animated.multiply(height, -1), 10)
      ),
      Animated.interpolate(scrollY, {
        inputRange: [Animated.multiply(offset, -1), 0],
        outputRange: [0, maxOpacity],
        extrapolate: Animated.Extrapolate.CLAMP
      }),
      Animated.interpolate(dismissY, {
        inputRange: [Animated.multiply(height, -1), 0],
        outputRange: [
          Animated.interpolate(scrollY, {
            inputRange: [Animated.multiply(offset, -1), 0],
            outputRange: [0, maxOpacity],
            extrapolate: Animated.Extrapolate.CLAMP
          }),
          0
        ],
        extrapolate: Animated.Extrapolate.CLAMP
      })
    )
);

export const runDelay = (
  node: Animated.Node<number>,
  clock: Animated.Clock,
  duration: number
) => {
  return block([
    runTiming(clock, 0, 1, duration),
    cond(not(clockRunning(clock)), node)
  ]);
};

export const moving = (
  position: Animated.Node<number>,
  minPositionDelta = 1,
  emptyFrameThreshold = 10
) => {
  const delta = diff(position);
  const noMovementFrames = new Value(0);
  return cond(
    lessThan(abs(delta), minPositionDelta),
    [
      set(noMovementFrames, add(noMovementFrames, 1)),
      not(greaterThan(noMovementFrames, emptyFrameThreshold))
    ],
    [set(noMovementFrames, 0), 1]
  );
};

// const movingProc = Animated.proc(
//   (minPositionDelta, emptyFrameThreshold, noMovementFrames, position) =>
//     cond(
//       lessThan(abs(position), minPositionDelta),
//       [
//         set(noMovementFrames, add(noMovementFrames, 1)),
//         not(greaterThan(noMovementFrames, emptyFrameThreshold))
//       ],
//       [set(noMovementFrames, 0), 1]
//     )
// );

// export const moving = (
//   position: Animated.Node<number>,
//   minPositionDelta = 1e-3,
//   emptyFrameThreshold = 5
// ) => {
//   return movingProc(
//     minPositionDelta,
//     emptyFrameThreshold,
//     Animated.diff(position)
//   );
// };

export const snapPoint = (
  value: Animated.Adaptable<number>,
  velocity: Animated.Adaptable<number>,
  points: Animated.Adaptable<number>[]
) => {
  const point = add(value, multiply(0.2, velocity));
  const diffPoint = (p: Animated.Adaptable<number>) => abs(sub(point, p));
  const deltas = points.map(p => diffPoint(p));
  const minDelta = min(...deltas);
  return points.reduce(
    (acc, p) => cond(eq(diffPoint(p), minDelta), p, acc),
    new Value()
  );
};

export const useAnimatedEvent = (handler, name, ref) => {
  React.useLayoutEffect(() => {
    let _ref = ref?.current ?? ref;

    if (!handler || typeof handler?.attachEvent !== "function") {
      return;
    }

    handler.attachEvent(findNodeHandle(_ref), name);
    _ref.setNativeProps({ [handler]: true });

    return () => {
      let _ref = ref?.current ?? ref;

      handler.detachEvent(findNodeHandle(_ref), name);
      _ref.setNativeProps({ [handler]: false });
    };
  }, [handler, ref, name]);
};

export const getSnapPoints = () => {
  return [-200, -100, -40, -11, -10, 0, 10, 11, 40, 100, 200];
};

export const snapButtonValue = (midX, midY, x, y, size) =>
  // Animated.abs(
  // Animated.sqrt(
  Animated.add(
    Animated.multiply(Animated.sub(midX, x), Animated.sub(midX, x)),
    Animated.multiply(Animated.sub(midY, y), Animated.sub(midY, y))
  );
// )
// );

export const isCurrentlyGesturingProc = Animated.proc(
  (panGestureState, scaleGestureState, rotationGestureState) =>
    Animated.cond(
      Animated.or(
        Animated.eq(panGestureState, State.ACTIVE),
        Animated.eq(panGestureState, State.BEGAN),
        Animated.eq(scaleGestureState, State.ACTIVE),
        Animated.eq(scaleGestureState, State.BEGAN),
        Animated.eq(rotationGestureState, State.ACTIVE),
        Animated.eq(rotationGestureState, State.BEGAN)
      ),
      1,
      0
    )
);

export const doKeyboardAnimation = () => {
  LayoutAnimation.configureNext({
    ...LayoutAnimation.Presets.linear,
    create: {
      ...LayoutAnimation.Presets.linear.create,
      type: LayoutAnimation.Types.keyboard
    },
    update: {
      ...LayoutAnimation.Presets.linear.update,
      type: LayoutAnimation.Types.keyboard
    },
    delete: {
      ...LayoutAnimation.Presets.linear.delete,
      type: LayoutAnimation.Types.keyboard
    }
  });
};
