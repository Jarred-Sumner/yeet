import {
  NativeModules,
  requireNativeComponent,
  View,
  UIManager,
  findNodeHandle
} from "react-native";
import React from "react";

const VIEW_NAME = "MediaPlayerView";
let NativeMediaPlayer;
if (typeof NativeMediaPlayer === "undefined") {
  NativeMediaPlayer = requireNativeComponent(VIEW_NAME);
}

type MediaPlayerCallbackFunction = (error: Error | null, result: any) => void;

export class MediaPlayer extends React.Component {
  nativeRef = React.createRef();

  static NativeModule = NativeModules["MediaPlayerViewManager"];

  callNativeMethod = (name, args = null) => {
    return UIManager.dispatchViewManagerCommand(
      findNodeHandle(this),
      UIManager.getViewManagerConfig(VIEW_NAME).Commands[name],
      args
    );
  };

  play = () => {
    this.callNativeMethod("play");
  };

  componentDidMount() {
    if (this.props.autoPlay) {
      this.play();
    }
  }

  pause = () => {
    this.callNativeMethod("pause");
  };

  advance = (index: number) => {
    return MediaPlayer.NativeModule.advance(findNodeHandle(this), index);
  };

  goNext = (cb: MediaPlayerCallbackFunction = function() {}) => {
    return new Promise((resolve, reject) => {
      MediaPlayer.NativeModule.goNext(index, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });
  };

  goBack = (cb: MediaPlayerCallbackFunction = function() {}) => {
    return new Promise((resolve, reject) => {
      MediaPlayer.NativeModule.goBack(findNodeHandle(this), (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });
  };

  setNativeProps = nativeProps => {
    this.nativeRef.current.setNativeProps(nativeProps);
  };

  shouldComponentUpdate(nextProps) {
    const {
      paused,
      sources,
      style,
      onProgress,
      onChangeItem,
      onEnd,
      autoPlay,
      prefetch
    } = this.props;

    if (
      paused !== nextProps.paused ||
      autoPlay !== nextProps.autoPlay ||
      onProgress !== nextProps.onProgress ||
      onChangeItem !== nextProps.onChangeItem ||
      onEnd !== nextProps.onEnd ||
      style != nextProps.style ||
      prefetch != nextProps.prefetch
    ) {
      return true;
    }

    const currentSourceIDs = sources.map(({ id }) => id).join("-");
    const newSourceIDs = nextProps.map(({ id }) => id).join("-");

    return currentSourceIDs !== newSourceIDs;
  }

  componentDidUpdate(prevProps) {
    const { paused } = this.props;
    if (prevProps.paused !== paused) {
      if (paused) {
        this.pause();
      } else {
        this.play();
      }
    }
  }

  render() {
    const {
      sources,
      style,
      prefetch,
      onEnd,
      id,
      paused = false,
      onProgress,
      onChangeItem
    } = this.props;

    return (
      <NativeMediaPlayer
        style={style}
        sources={sources}
        onEnd={onEnd}
        id={id}
        prefetch={prefetch}
        onProgress={onProgress}
        onChangeItem={onChangeItem}
        autoPlay={this.props.autoPlay}
        paused={paused}
        ref={this.nativeRef}
      />
    );
  }
}

export default MediaPlayer;
