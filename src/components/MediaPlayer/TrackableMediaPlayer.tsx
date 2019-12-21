import hoistNonReactStatics from "hoist-non-react-statics";
import React from "react";
import { isVideo } from "../../lib/imageSearch";
import { MediaPlayerComponent, MediaPlayerProps } from "./MediaPlayerComponent";
import { MediaPlayer } from "./MediaPlayer";

type TrackableMediaPlayerState = {
  hasLoaded: boolean;
};

class _TrackableMediaPlayer extends React.Component<
  MediaPlayerProps,
  TrackableMediaPlayerState
> {
  constructor(props) {
    super(props);

    this.duration = props.duration || 0.0;

    this.state = {
      hasLoaded: false
    };
  }

  static defaultProps = {
    ...MediaPlayerComponent.defaultProps,
    isFocused: true
  };

  duration = 0.0;
  elapsed = 0.0;
  updateInterval = 500;
  progressTimer: number = -1;
  useNativeTimer = false;

  get isTimerRunning() {
    return this.progressTimer > -1;
  }

  clearProgressTimer = () => {
    window.clearInterval(this.progressTimer);
    this.progressTimer = -1;
  };

  componentWillUnmount() {
    this.clearProgressTimer();
  }

  get shouldTrackProgressNatively() {
    return isVideo(
      this.props.sources[0]?.mimeType || this.props.sources[0]?.type
    );
  }

  get shouldTrackProgress() {
    return !this.shouldTrackProgressNatively && this.props.isFocused;
  }

  componentDidUpdate(prevProps) {
    if (this.shouldTrackProgressNatively) {
      return;
    }

    if (prevProps.paused !== this.props.paused) {
      if (this.isTimerRunning && this.props.paused) {
        this.clearProgressTimer();
      } else if (
        !this.props.paused &&
        !this.isTimerRunning &&
        this.state.hasLoaded &&
        this.props.isFocused
      ) {
        this.startProgressTimer();
      }
    }

    if (prevProps.isFocused !== this.props.isFocused) {
      if (this.isTimerRunning && !this.props.isFocused) {
        this.clearProgressTimer();
      } else if (
        !this.isTimerRunning &&
        this.props.isFocused &&
        this.state.hasLoaded &&
        !this.props.paused
      ) {
        this.startProgressTimer();
      }
    }
  }

  incrementProgress = () => {
    const elapsed = this.elapsed + this.updateInterval;

    if (elapsed > this.duration) {
      this.elapsed = 0.0;
    } else {
      this.elapsed = elapsed;
    }

    if (this.props.onProgress) {
      this.props.onProgress({
        elapsed: this.elapsed / 1000,
        interval: this.updateInterval
      });
    }

    if (!this.props.isFocused) {
      this.clearProgressTimer();
    }
  };

  startProgressTimer = () => {
    this.progressTimer = window.setInterval(
      this.incrementProgress,
      this.updateInterval
    );
  };

  handleLoad = ({
    nativeEvent: { duration, interval, elapsed, ...eventData }
  }) => {
    const source = this.props.sources[0];

    if (source && !isVideo(source.mimeType)) {
      this.handlePlay({
        nativeEvent: { duration, interval, elapsed, ...eventData }
      });
    }
  };

  handlePlay = ({
    nativeEvent: { duration, interval, elapsed, ...eventData }
  }) => {
    if (this.isTimerRunning) {
      this.clearProgressTimer();
    }

    if (!this.state.hasLoaded) {
      this.setState({ hasLoaded: true });
    }

    // this.duration = duration;
    this.updateInterval = interval;
    this.elapsed = elapsed;

    if (this.shouldTrackProgress) {
      this.startProgressTimer();
    }

    if (this.props.onPlay) {
      this.props.onPlay({ duration, interval, elapsed, ...eventData });
    }
  };

  handlePause = ({
    nativeEvent: { elapsed, duration, interval, ...eventData }
  }) => {
    if (this.isTimerRunning) {
      this.clearProgressTimer();
    }

    // this.duration = duration;
    this.updateInterval = interval;
    this.elapsed = elapsed;

    if (this.props.onPause) {
      this.props.onPause({ duration, interval, elapsed, ...eventData });
    }
  };

  handleProgress = ({
    nativeEvent: { elapsed, duration, interval, ...eventData }
  }) => {
    if (this.isTimerRunning) {
      this.clearProgressTimer();
    }
    this.duration = duration / 1000;
    this.updateInterval = interval;
    this.elapsed = elapsed / 1000;

    this.props.onProgress &&
      this.props.onProgress({
        duration: this.duration,
        interval: this.updateInterval,
        elapsed: this.elapsed,
        ...eventData
      });
  };

  mediaPlayerRef = React.createRef<MediaPlayerComponent>();
  play = () => this.mediaPlayerRef.current.play();
  pause = () => this.mediaPlayerRef.current.pause();
  advance = (...props) =>
    this.mediaPlayerRef.current.advance.call(
      this.mediaPlayerRef.current,
      props
    );

  onLoad = event => {
    this.setState({ hasLoaded: true });

    this.props.onLoad && this.props.onLoad(event);
  };

  save = (...props) =>
    this.mediaPlayerRef.current.save.call(this.mediaPlayerRef.current, props);

  render() {
    const { onProgress, onPlay, onPause, onLoad, ...otherProps } = this.props;
    return (
      <MediaPlayer
        ref={this.mediaPlayerRef}
        onPlay={this.handlePlay}
        onPause={this.handlePause}
        onProgress={this.handleProgress}
        onLoad={this.handleLoad}
        {...otherProps}
      />
    );
  }
}

export const TrackableMediaPlayer = hoistNonReactStatics(
  _TrackableMediaPlayer,
  MediaPlayer
);
