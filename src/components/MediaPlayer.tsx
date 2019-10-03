import {
  NativeModules,
  requireNativeComponent,
  View,
  UIManager,
  findNodeHandle
} from "react-native";
import React from "react";

const VIEW_NAME = "MediaPlayerView";
const NativeMediaPlayer = requireNativeComponent(VIEW_NAME);

export class MediaPlayer extends React.Component {
  nativeRef = React.createRef();

  callNativeMethod = (name, args = null) => {
    UIManager.dispatchViewManagerCommand(
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
    this.callNativeMethod("advance", [index]);
  };

  goNext = () => {
    this.callNativeMethod("goNext");
  };

  goBack = () => {
    this.callNativeMethod("goBack");
  };

  setNativeProps = nativeProps => {
    this.nativeRef.current.setNativeProps(nativeProps);
  };

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

      onEnd,
      paused = false,
      onProgress,
      onChangeItem
    } = this.props;

    return (
      <NativeMediaPlayer
        style={style}
        sources={sources}
        onEnd={onEnd}
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
