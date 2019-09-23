import * as React from "react";
import { View, StyleSheet } from "react-native";
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
  stopClock,
  block
} = Animated;

function runTiming(clock, value, dest, duration, playValue, onFinish) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration,
    toValue: new Animated.Value(0),
    easing: Easing.inOut(Easing.ease)
  };

  return block([
    cond(
      Animated.eq(playValue, 1),
      block([
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
        cond(
          state.finished,
          block([
            debug("stop clock", stopClock(clock)),
            Animated.call([], onFinish)
          ])
        ),
        // we made the block return the updated position
        state.position
      ]),
      cond(clockRunning(clock), [stopClock(clock), value])
    )
  ]);
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    overflow: "hidden",
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: "rgba(255, 255, 255, 0.25)"
  },
  bar: {
    flexGrow: 0,
    flexShrink: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.85)"
  }
});

const PROGRESS_FINISHED_VALUE = 1;
const PROGRESS_BEGIN_VALUE = 0;

const PLAYING_VAUE = 1;
const PAUSED_VALUE = 0;

export class PostProgressBar extends React.Component {
  static defaultProps = {
    loop: false,
    duration: 5000,
    width: 20,
    play: false,
    finished: false,
    height: 6,
    size: "full",
    onFinish: () => {}
  };

  constructor(props) {
    super(props);

    if (props.finished) {
      this.playValue.setValue(0);
      this.progressValue.setValue(0);
    } else {
      this.playValue.setValue(props.play ? PLAYING_VAUE : PAUSED_VALUE);
    }

    this.setupAnimation();
  }
  progressValue = new Animated.Value<number>(1);
  progressClock = new Animated.Clock();
  playValue = new Animated.Value<number>(PLAYING_VAUE);

  translateX: Animated.Node<number>;

  setupAnimation = () => {
    console.count("Setup animation");
    this.translateX = runTiming(
      this.progressClock,
      0,
      this.props.width,
      this.props.duration,
      this.playValue,
      this.handleFinish
    );
  };

  handleFinish = () => {
    console.log("FINISH");
    if (this.props.loop) {
      this.progressValue.setValue(0);
      this.setupAnimation();
    }

    this.props.onFinish && this.props.onFinish();
  };

  componentDidUpdate(prevProps) {
    if (this.props.play !== prevProps.play) {
      this.playValue.setValue(this.props.play ? PLAYING_VAUE : PAUSED_VALUE);
    }

    if (this.props.finished && !prevProps.finished) {
      this.playValue.setValue(PAUSED_VALUE);
      this.progressValue.setValue(0);
    }

    if (
      prevProps.width !== this.props.width ||
      prevProps.duration !== prevProps.duration
    ) {
      // this.translateX = Animated.interpolate(this.progressValue, {
      //   inputRange: [0, 1],
      //   outputRange: [this.props.width, 0]
      // });

      this.setupAnimation();
    }
  }

  render() {
    const { width, height, size } = this.props;

    return (
      <Animated.View
        key={`${this.props.finished}-${width}-${size}`}
        style={[styles.container, { width, height }]}
      >
        <Animated.View
          style={[
            styles.bar,
            { width, height },
            {
              transform: this.props.finished
                ? []
                : [
                    {
                      translateX: width * -1
                    },
                    {
                      translateX: this.translateX
                    }
                  ]
            }
          ]}
        />
      </Animated.View>
    );
  }
}
