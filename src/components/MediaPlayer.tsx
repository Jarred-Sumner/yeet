import {
  NativeModules,
  requireNativeComponent,
  View,
  UIManager,
  findNodeHandle,
  StyleProp,
  InteractionManager
} from "react-native";
import React, { ReactEventHandler, useImperativeHandle } from "react";
import { ImageMimeType, YeetImageRect, isVideo } from "../lib/imageSearch";
import { DimensionsRect, BoundsRect } from "../lib/Rect";
import {
  useFocusEffect,
  useIsFocused,
  useNavigationState
} from "react-navigation-hooks";
import hoistNonReactStatics from "hoist-non-react-statics";
import { NativeMediaPlayer, VIEW_NAME } from "./NativeMediaPlayer";
import { SharedElement } from "react-navigation-shared-element";
import { uniq } from "lodash";
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

type MediaPlayerContextValue = {
  registerID: (id: string) => void;
  unregisterID: (id: string) => void;
};

export const MediaPlayerPauser = ({ children, nodeRef }) => {
  const players = React.useRef([]);
  const pausedPlayers = React.useRef([]);
  const ref = React.useRef();
  const registerID = React.useCallback(
    (id: string) => {
      players.current = uniq([...players.current, id]);
    },
    [uniq, players]
  );

  const unregisterID = React.useCallback(
    (id: string) => {
      let _players = [...players.current].splice(
        players.current.indexOf(id),
        1
      );
      players.current = uniq(_players);

      if (pausedPlayers.current.includes(id)) {
        pausedPlayers.current.splice(pausedPlayers.current.indexOf(id), 1);
      }
    },
    [uniq, players]
  );

  const pausePlayers = () => {
    if (players.current.length === 0) {
      return;
    }

    const handle = findNodeHandle(nodeRef.current);
    MediaPlayer.batchPause(handle, players.current);
    pausedPlayers.current = uniq([
      ...pausedPlayers.current,
      ...players.current
    ]);
    players.current = [];
  };

  const unpausePlayers = () => {
    const handle = findNodeHandle(nodeRef.current);
    if (pausedPlayers.current.length > 0) {
      const _players = uniq([...pausedPlayers.current, ...players.current]);
      MediaPlayer.batchPlay(handle, pausedPlayers.current);
      pausedPlayers.current = [];
      players.current = _players;
    }
  };

  const contextValue = React.useMemo(() => {
    return {
      registerID,
      unregisterID,
      pausePlayers,
      unpausePlayers
    };
  }, [registerID, unregisterID]);

  // useFocusEffect(() => {

  // });

  return (
    <MediaPlayerContext.Provider value={contextValue}>
      {children}
    </MediaPlayerContext.Provider>
  );
};

export const MediaPlayerContext = React.createContext<MediaPlayerContextValue | null>(
  null
);
export type MediaSource = {
  id: string;
  url: string;
  mimeType: ImageMimeType;
  width: number;
  height: number;
  cover?: string;
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
  borderRadius?: number;
  onError: ReactEventHandler<StatusEventData>;
  isActive: boolean;
  style: StyleProp<any>;
  prefetch?: boolean;
  muted?: boolean;
  onEnd?: ReactEventHandler<StatusEventData>;
  onLoad?: ReactEventHandler<StatusEventData>;
  onPlay?: ReactEventHandler<StatusEventData>;
  onPause?: ReactEventHandler<StatusEventData>;
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

      return source.url && source.width && source.height;
    })
    .map(source => {
      const cover = [source.cover, source.coverUrl].find(Boolean);
      return {
        ...source,
        playDuration: source.playDuration || 0,
        cover: typeof cover === "string" ? cover : undefined,
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
    paused: false,
    prefetch: false,
    muted: false,
    isActive: true,
    sources: []
  };

  nativeRef = React.createRef();

  static NativeModule = NativeModules["MediaPlayerViewManager"];

  static batchPlay(tag: number, ids: Array<string>) {
    return MediaPlayerComponent.NativeModule.batchPlay(tag, ids);
  }

  static batchPause(tag: number, ids: Array<string>) {
    return MediaPlayerComponent.NativeModule.batchPlay(tag, ids);
  }

  static startCaching(
    mediaSources: Array<Partial<MediaSource | null>>,
    size: BoundsRect,
    contentMode: string
  ) {
    const _mediaSources = clean(mediaSources);

    MediaPlayerComponent.NativeModule.startCachingMediaSources(
      _mediaSources,
      size,
      contentMode
    );
  }

  static stopCaching(
    mediaSources: Array<Partial<MediaSource | null>>,
    size: BoundsRect,
    contentMode: string
  ) {
    const _mediaSources = clean(mediaSources);

    MediaPlayerComponent.NativeModule.startCachingMediaSources(
      _mediaSources,
      size,
      contentMode
    );
  }

  static stopCachingAll() {
    MediaPlayerComponent.NativeModule.stopCachingAll();
  }

  get isVideoPlayer() {
    return !!this.props.sources.find(source => isVideo(source.mimeType));
  }

  componentWillUnmount() {
    if (this.isVideoPlayer) {
      this.reset();
    }
  }

  reset = () => {
    this.callNativeMethod("reset");
  };

  callNativeMethod = (name, args = null, nodeHandle?: number) => {
    const _nodeHandle = nodeHandle ?? findNodeHandle(this);
    return UIManager.dispatchViewManagerCommand(
      _nodeHandle,
      UIManager.getViewManagerConfig(VIEW_NAME).Commands[name],
      args || []
    );
  };

  play = () => {
    this.callNativeMethod("play");
  };

  pause = () => {
    this.callNativeMethod("pause");
  };

  save = () => {
    return new Promise((resolve, reject) => {
      MediaPlayerComponent.NativeModule.save(
        findNodeHandle(this),
        (err, success) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(success);
        }
      );
    });
  };

  crop = (bounds: BoundsRect, size: DimensionsRect) => {
    return MediaPlayer.NativeModule.crop(findNodeHandle(this), bounds, size);
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
      prefetch,
      borderRadius,
      onError,
      isActive,
      onPlay,
      onPause
    } = this.props;

    if (
      paused !== nextProps.paused ||
      autoPlay !== nextProps.autoPlay ||
      onProgress !== nextProps.onProgress ||
      onPlay !== nextProps.onPause ||
      onPause !== nextProps.onPlay ||
      onChangeItem !== nextProps.onChangeItem ||
      onEnd !== nextProps.onEnd ||
      style !== nextProps.style ||
      borderRadius !== nextProps.borderRadius ||
      onError !== nextProps.onError ||
      isActive !== nextProps.isActive ||
      prefetch != nextProps.prefetch
    ) {
      return true;
    }

    const currentSourceIDs = sources
      .map(({ id, url }) => [id, url].join(""))
      .join("-");
    const newSourceIDs = nextProps.sources
      .map(({ id, url }) => [id, url].join(""))
      .join("-");

    return currentSourceIDs !== newSourceIDs;
  }

  render() {
    const {
      sources,
      style,
      prefetch,
      onEnd,
      id,
      borderRadius = 0,
      paused = false,
      onProgress,
      isActive,
      autoPlay,
      onLoad,
      onPlay,
      onPause,
      onError,
      onChangeItem
    } = this.props;

    return (
      <NativeMediaPlayer
        style={style}
        sources={clean(sources)}
        onEnd={onEnd}
        id={id}
        nativeID={id}
        borderRadius={borderRadius}
        isActive={isActive}
        prefetch={prefetch}
        onProgress={onProgress}
        onPlay={onPlay}
        onPause={onPause}
        onLoad={onLoad}
        onError={onError}
        onChangeItem={onChangeItem}
        autoPlay={autoPlay}
        paused={paused}
        ref={this.nativeRef}
      />
    );
  }
}

const _MediaPlayer = (React.forwardRef(
  ({ isActive, id, sharedId, ...props }: Props, ref) => {
    const [isAutoHidden, setAutoHidden] = React.useState(false);
    const _ref = React.useRef<MediaPlayerComponent>(null);
    useImperativeHandle(ref, () => _ref.current);
    const mediaPlayerContext = React.useContext(MediaPlayerContext);

    React.useEffect(() => {
      if (mediaPlayerContext === null || !id) {
        return;
      }

      if (id) {
        mediaPlayerContext.registerID(id);
      }

      return () => {
        mediaPlayerContext.unregisterID(id);
      };
    }, [mediaPlayerContext, id]);

    const player = (
      <MediaPlayerComponent id={id} isActive={isActive} ref={_ref} {...props} />
    );

    if (sharedId) {
      return (
        <SharedElement id={sharedId}>
          <View>{player}</View>
        </SharedElement>
      );
    } else {
      return player;
    }
  }
) as unknown) as MediaPlayerComponent;

export const MediaPlayer = hoistNonReactStatics(
  _MediaPlayer,
  MediaPlayerComponent
);

export default MediaPlayer;

class _TrackableMediaPlayer extends React.Component<Props> {
  constructor(props) {
    super(props);

    this.duration = props.duration || 0.0;
  }

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

  componentDidUpdate(prevProps) {
    if (prevProps.paused !== this.props.paused) {
      if (this.isTimerRunning && this.props.paused) {
        this.clearProgressTimer();
      } else if (!this.props.paused && !this.isTimerRunning) {
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

    console.log({
      duration: this.duration,
      interval: this.updateInterval,
      elapsed
    });

    if (this.props.onProgress) {
      this.props.onProgress({
        elapsed: this.elapsed / 1000,
        interval: this.updateInterval
      });
    }
  };

  startProgressTimer = () => {
    this.progressTimer = window.setInterval(
      this.incrementProgress,
      this.updateInterval
    );
  };

  handlePlay = ({
    nativeEvent: { duration, interval, elapsed, ...eventData }
  }) => {
    if (this.isTimerRunning) {
      this.clearProgressTimer();
    }

    console.log({ duration, interval, elapsed });

    // this.duration = duration;
    this.updateInterval = interval;
    this.elapsed = elapsed;
    this.startProgressTimer();

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

  save = (...props) =>
    this.mediaPlayerRef.current.save.call(this.mediaPlayerRef.current, props);

  render() {
    const { onProgress, onPlay, onPause, ...otherProps } = this.props;
    return (
      <MediaPlayer
        ref={this.mediaPlayerRef}
        onPlay={this.handlePlay}
        onPause={this.handlePause}
        onProgress={this.handleProgress}
        {...otherProps}
      />
    );
  }
}

export const TrackableMediaPlayer = hoistNonReactStatics(
  _TrackableMediaPlayer,
  MediaPlayer
);
