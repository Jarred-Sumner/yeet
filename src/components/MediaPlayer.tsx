import hoistNonReactStatics from "hoist-non-react-statics";
import { uniq } from "lodash";
import React, { ReactEventHandler, useImperativeHandle } from "react";
import {
  findNodeHandle,
  NativeModules,
  StyleProp,
  UIManager,
  View
} from "react-native";
import { SharedElement } from "react-navigation-shared-element";
import { ImageMimeType, isVideo } from "../lib/imageSearch";
import { BoundsRect, DimensionsRect } from "../lib/Rect";
import { NativeMediaPlayer, VIEW_NAME } from "./NativeMediaPlayer";

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
  registerID: (id: string, nodeHandle: number) => void;
  unregisterID: (id: string) => void;
};

export const MediaPlayerPauser = React.forwardRef(
  ({ children, nodeRef, isHidden }, ref) => {
    const players = React.useRef({});
    const pausedPlayers = React.useRef([]);
    const registerID = React.useCallback(
      (id: string, instance: Object) => {
        players.current = {
          ...players.current,
          [id]: instance
        };
      },
      [uniq, players]
    );

    const unregisterID = React.useCallback(
      (id: string) => {
        let _players = { ...players.current };
        _players[id] = null;
        players.current = _players;

        if (pausedPlayers.current.includes(id)) {
          pausedPlayers.current.splice(pausedPlayers.current.indexOf(id), 1);
        }
      },
      [uniq, players]
    );

    const pausePlayers = React.useCallback(() => {
      if (Object.keys(players.current).length === 0) {
        return;
      }

      // const handle = findNodeHandle(nodeRef.current) ?? -1;
      MediaPlayerComponent.batchPause(
        -1,
        Object.values(players.current)
          .map(findNodeHandle)
          .filter(Boolean)
      );
      pausedPlayers.current = uniq([
        ...pausedPlayers.current,
        ...Object.values(players.current)
      ]);
    }, [players, pausedPlayers, nodeRef]);

    const unpausePlayers = React.useCallback(() => {
      // const handle = findNodeHandle(nodeRef.current);
      if (pausedPlayers.current.length > 0) {
        console.log("PLAYERS", pausedPlayers.current);
        MediaPlayerComponent.batchPlay(
          -1,
          pausedPlayers.current.filter(Boolean)
        );
        pausedPlayers.current = [];
      }
    }, [players, pausedPlayers, nodeRef]);

    const contextValue = React.useMemo(() => {
      return {
        registerID,
        unregisterID,
        pausePlayers,
        unpausePlayers
      };
    }, [registerID, unregisterID]);

    // useFocusEffect(
    //   React.useCallback(() => {
    //     console.log("UNPAUSE");
    //     unpausePlayers();

    //     return () => {
    //       console.log("PAUSE");
    //       pausePlayers();
    //     };
    //   }, [pausePlayers, unpausePlayers])
    // );

    // useEffect(() => {
    //   if (isHidden === false) {
    //     pausePlayers();
    //   } else if (isHidden === true) {
    //     unpausePlayers();
    //   }
    // }, [pausePlayers, unpausePlayers, isHidden]);

    useImperativeHandle(ref, () => ({
      pausePlayers,
      unpausePlayers
    }));

    return (
      <MediaPlayerContext.Provider value={contextValue}>
        {children}
      </MediaPlayerContext.Provider>
    );
  }
);

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
  resizeMode: "aspectFill" | "aspectFit";
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
    pauseUnUnmount: false,
    sources: []
  };

  nativeRef = React.createRef();

  static NativeModule = NativeModules["MediaPlayerViewManager"];

  static batchPlay(tag: number, ids: Array<string>) {
    return MediaPlayerComponent.NativeModule.batchPlay(tag, ids);
  }

  static batchPause(tag: number, ids: Array<string>) {
    return MediaPlayerComponent.NativeModule.batchPause(tag, ids);
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
    // this1.reset();
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
      resizeMode,
      isActive,
      muted,
      onPlay,
      onPause
    } = this.props;

    if (
      paused !== nextProps.paused ||
      muted !== nextProps.muted ||
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
      prefetch != nextProps.prefetch ||
      resizeMode !== nextProps.resizeMode
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
      muted,
      resizeMode,
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
        allowSkeleton
        prefetch={prefetch}
        onProgress={onProgress}
        muted={muted}
        onPlay={onPlay}
        resizeMode={resizeMode}
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
  ({ onLoad, isActive, id, sharedId, borderRadius, ...props }: Props, ref) => {
    const _ref = React.useRef<MediaPlayerComponent>(null);
    useImperativeHandle(ref, () => _ref.current);
    const mediaPlayerContext = React.useContext(MediaPlayerContext);

    React.useEffect(() => {
      if (mediaPlayerContext === null || !id) {
        return;
      }

      if (id) {
        mediaPlayerContext.registerID(id, findNodeHandle(_ref.current));
      }

      return () => {
        mediaPlayerContext.unregisterID(id);
      };
    }, [mediaPlayerContext, id]);

    const player = (
      <MediaPlayerComponent
        onLoad={onLoad}
        id={id}
        isActive={isActive}
        borderRadius={borderRadius}
        ref={_ref}
        {...props}
      />
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

type TrackableMediaPlayerState = {
  hasLoaded: boolean;
};

class _TrackableMediaPlayer extends React.Component<
  Props,
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
