import {
  NativeModules,
  requireNativeComponent,
  View,
  UIManager,
  findNodeHandle,
  StyleProp
} from "react-native";
import React, { ReactEventHandler, useImperativeHandle } from "react";
import { ImageMimeType } from "../lib/imageSearch";
import { DimensionsRect } from "../lib/Rect";
import { useFocusEffect } from "react-navigation-hooks";
import hoistNonReactStatics from "hoist-non-react-statics";

const VIEW_NAME = "MediaPlayerView";
let NativeMediaPlayer;
if (typeof NativeMediaPlayer === "undefined") {
  NativeMediaPlayer = requireNativeComponent(VIEW_NAME);
}

type MediaPlayerCallbackFunction = (error: Error | null, result: any) => void;

export enum MediaPlayerStatus {
  pending = "pending",
  loading = "loading",
  loaded = "loaded",
  ready = "ready",
  playing = "playing",
  paused = "paused",
  ended = "ended",
  error = "error"
}

export type MediaSource = {
  id: string;
  url: string;
  mimeType: ImageMimeType;
  width: number;
  height: number;
  pixelRatio: number;
  duration: number;
  bounds: DimensionsRect;
  playDuration: number;
};

type StatusEventData = {
  index: number;
  id: string;
  status: MediaPlayerStatus;
  url: string;
};

type ProgressEventData = StatusEventData & {
  elapsed: number;
  interval: number;
};

type Props = {
  autoPlay: boolean;
  sources: Array<MediaSource>;
  style: StyleProp<any>;
  prefetch?: boolean;
  muted?: boolean;
  onEnd?: ReactEventHandler<StatusEventData>;
  onLoad?: ReactEventHandler<StatusEventData>;
  id: string;
  paused?: boolean;
  onProgress?: ReactEventHandler<ProgressEventData>;
  onChangeItem?: ReactEventHandler<StatusEventData>;
};

const clean = (
  sources: Array<Partial<MediaSource | null>>
): Array<MediaSource> => {
  return sources
    .filter(source => {
      if (!source || typeof source !== "object") {
        return false;
      }

      return source.url && source.id && source.width && source.height;
    })
    .map(source => {
      return {
        ...source,
        playDuration: source.playDuration || 0,
        duration: source.duration || 0,
        pixelRatio: source.pixelRatio || 1.0,
        width: source.width || 0,
        height: source.height || 0
      };
    });
};

export class MediaPlayerComponent extends React.Component<Props> {
  static defaultProps = {
    autoPlay: false,
    paused: true,
    prefetch: false,
    muted: false,
    sources: []
  };

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

  advance = (index: number, withFrame: Boolean = false) => {
    if (withFrame) {
      return MediaPlayer.NativeModule.advanceWithFrame(
        findNodeHandle(this),
        index
      );
    } else {
      return MediaPlayer.NativeModule.advance(findNodeHandle(this), index);
    }
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
    const newSourceIDs = nextProps.sources.map(({ id }) => id).join("-");

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
        sources={clean(sources)}
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

const _MediaPlayer = (React.forwardRef((props: Props, ref) => {
  const [autoPaused, setAutoPaused] = React.useState(false);
  const _ref = React.useRef<MediaPlayerComponent>(null);
  useImperativeHandle(ref, () => _ref.current);

  const pauseOnUnfocus = React.useCallback(() => {
    if (autoPaused) {
      _ref.current && _ref.current.play();
    }

    return () => {
      _ref.current && _ref.current.pause();
      setAutoPaused(true);
    };
  }, [_ref.current, setAutoPaused, autoPaused]);

  useFocusEffect(pauseOnUnfocus);

  return <MediaPlayerComponent ref={_ref} {...props} />;
}) as unknown) as MediaPlayerComponent;

export const MediaPlayer = hoistNonReactStatics(
  _MediaPlayer,
  MediaPlayerComponent
);

export default MediaPlayer;
