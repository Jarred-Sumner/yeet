import React, { ReactEventHandler } from "react";
import {
  findNodeHandle,
  NativeModules,
  StyleProp,
  UIManager
} from "react-native";
import {
  ImageMimeType,
  isVideo,
  VideoEditResponse
} from "../../lib/imageSearch";
import { BoundsRect, DimensionsRect } from "../../lib/Rect";
import { NativeMediaPlayer, VIEW_NAME } from "./NativeMediaPlayer";
import { MediaPlayerStatus } from "./MediaPlayerContext";
import memoizee from "memoizee";

type MediaPlayerCallbackFunction = (error: Error | null, result: any) => void;

export enum MediaPlayerLoadingStatus {
  pending = "pending",
  loading = "loading",
  loaded = "loaded",
  ready = "ready",
  playing = "playing",
  paused = "paused",
  ended = "ended",
  error = "error"
}

export const isMediaPlayerLoadingStatusLoaded = (
  status: MediaPlayerLoadingStatus
) => {
  return [
    MediaPlayerLoadingStatus.loaded,
    MediaPlayerLoadingStatus.ready,
    MediaPlayerLoadingStatus.playing,
    MediaPlayerLoadingStatus.paused,
    MediaPlayerLoadingStatus.ended
  ].includes(status);
};

export const registrations = {};

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

export type MediaPlayerResizeMode = "aspectFill" | "aspectFit";

export type MediaPlayerProps = {
  autoPlay: boolean;
  sources: Array<MediaSource>;
  borderRadius?: number;
  mediaSource?: MediaSource;
  opaque: boolean;
  thumbnail: boolean;
  onError: ReactEventHandler<StatusEventData>;
  isActive: boolean;
  style: StyleProp<any>;
  prefetch?: boolean;
  muted?: boolean;
  resizeMode: MediaPlayerResizeMode;
  onEnd?: ReactEventHandler<StatusEventData>;
  onLoad?: ReactEventHandler<StatusEventData>;
  onPlay?: ReactEventHandler<StatusEventData>;
  onEditVideo?: ReactEventHandler<VideoEditResponse>;
  onPause?: ReactEventHandler<StatusEventData>;
  id: string;
  paused?: boolean;
  onProgress?: ReactEventHandler<ProgressEventData>;
  onChangeItem?: ReactEventHandler<StatusEventData>;
};

const __clean = (source: Partial<MediaSource | null>) => {
  if (!source) {
    return null;
  }

  const useCached =
    typeof source.id === "string" &&
    global.MediaPlayerViewManager?.isCached(source.id);

  if (useCached) {
    return { id: source.id };
  }

  const cover = source.cover || source.coverUrl;

  return {
    id: source.id || source.url,
    ...source,
    playDuration: source.playDuration || 0,
    cover: typeof cover === "string" ? cover : undefined,
    duration: source.duration || 0,
    pixelRatio: source.pixelRatio || 1.0,
    width: source.width || 0,
    height: source.height || 0
  };
};

const cleanMany = memoizee(sources => sources.map(__clean).filter(Boolean));
const cleanOne = memoizee(sources => [__clean(sources)]);

const clean = sources =>
  sources?.length === 1 ? cleanOne(sources[0]) : cleanMany(sources);

export class MediaPlayerComponent extends React.Component<MediaPlayerProps> {
  static defaultProps = {
    autoPlay: false,
    paused: false,
    prefetch: false,
    muted: false,
    thumbnail: false,
    isActive: true,
    mediaSource: null,
    pauseUnUnmount: false,
    sources: []
  };

  nativeRef = React.createRef();

  get nativeNode() {
    if (!this.nativeRef.current) {
      return null;
    }

    return findNodeHandle(this.nativeRef.current);
  }

  static NativeModule = NativeModules["MediaPlayerViewManager"];

  static batchPlay(tag: number, ids: Array<string>) {
    return global.MediaPlayerViewManager?.batchPlay(tag, ids);
  }

  static batchPause(tag: number, ids: Array<string>) {
    return global.MediaPlayerViewManager?.batchPause(tag, ids);
  }

  static startCaching(
    mediaSources: Array<Partial<MediaSource | null>>,
    size: BoundsRect,
    contentMode: string
  ) {
    const _mediaSources = clean(mediaSources);

    global.MediaPlayerViewManager?.startCaching(
      _mediaSources,
      size,
      contentMode
    );

    // MediaPlayerComponent.NativeModule?.startCachingMediaSources(
    //   _mediaSources,
    //   size,
    //   contentMode
    // );
  }

  static stopCaching(
    mediaSources: Array<Partial<MediaSource | null>>,
    size: BoundsRect,
    contentMode: string
  ) {
    const _mediaSources = clean(mediaSources);

    // MediaPlayerComponent.NativeModule?.startCachingMediaSources(
    //   _mediaSources,
    //   size,
    //   contentMode
    // );
  }

  static stopCachingAll() {
    return global.MediaPlayerViewManager?.stopCaching();

    // MediaPlayerComponent.NativeModule?.stopCachingAll();
  }

  componentWillUnmount() {
    // this1.reset();
  }

  reset = () => {
    this.callNativeMethod("reset");
  };

  callNativeMethod = (name, args = null, nodeHandle?: number) => {
    const _nodeHandle = nodeHandle ?? this.nativeNode;
    return UIManager.dispatchViewManagerCommand(
      _nodeHandle,
      UIManager.getViewManagerConfig(VIEW_NAME).Commands[name],
      args || []
    );
  };

  play = () => {
    return global.MediaPlayerViewManager?.play(this.nativeNode);
    // this.callNativeMethod("play");
  };

  pause = () => {
    // this.callNativeMethod("pause");
    return global.MediaPlayerViewManager?.pause(this.nativeNode);
  };

  save = () => {
    return new Promise((resolve, reject) => {
      MediaPlayerComponent.NativeModule?.save(
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

  share = (network: String | null) => {
    return new Promise((resolve, reject) => {
      MediaPlayerComponent.NativeModule?.share(
        findNodeHandle(this),
        network,
        (err, success) => {
          if (err) {
            reject(err);
            return;
          } else {
            resolve(success);
          }
        }
      );
    });
  };

  crop = (bounds: BoundsRect, size: DimensionsRect) => {
    return MediaPlayerComponent.NativeModule?.crop(
      findNodeHandle(this),
      bounds,
      size
    );
  };

  detectRectangles = () => {
    return new Promise((resolve, reject) => {
      MediaPlayerComponent.NativeModule?.detectRectangles(
        findNodeHandle(this),
        (err, success) => {
          if (err) {
            reject(err);
            return;
          } else {
            resolve(success);
          }
        }
      );
    });
  };

  editVideo = (): Promise<VideoEditResponse> =>
    new Promise<VideoEditResponse>((resolve, reject) => {
      MediaPlayerComponent.NativeModule?.editVideo(
        findNodeHandle(this),
        (err, success) => {
          if (err) {
            reject(err);
            return;
          } else {
            resolve(success);
          }
        }
      );
    });

  advance = (index: number, withFrame: Boolean = false) => {
    if (withFrame) {
      return MediaPlayerComponent.NativeModule?.advanceWithFrame(
        findNodeHandle(this),
        index
      );
    } else {
      return MediaPlayerComponent.NativeModule?.advance(
        findNodeHandle(this),
        index
      );
    }
  };

  goNext = (cb: MediaPlayerCallbackFunction = function() {}) => {
    return new Promise((resolve, reject) => {
      MediaPlayerComponent.NativeModule?.goNext(index, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });
  };

  get currentStatus(): MediaPlayerLoadingStatus {
    if (!this.nativeNode) {
      return MediaPlayerLoadingStatus.pending;
    }

    return (
      global.MediaPlayerViewManager?.getStatus(this.nativeNode) ||
      MediaPlayerLoadingStatus.pending
    );
  }

  getSize = async (): DimensionsRect => {
    const size = await global.MediaPlayerViewManager?.getSize(this.nativeNode);

    if (
      size &&
      typeof size === "object" &&
      typeof size.width === "number" &&
      typeof size.height === "number"
    ) {
      return size;
    } else {
      return { width: 0, height: 0 };
    }
  };

  goBack = (cb: MediaPlayerCallbackFunction = function() {}) => {
    return new Promise((resolve, reject) => {
      MediaPlayerComponent.NativeModule?.goBack(
        findNodeHandle(this),
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });
  };

  setNativeProps = nativeProps => {
    this.nativeRef.current?.setNativeProps(nativeProps);
  };

  shouldComponentUpdate(nextProps: Props) {
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
      containerTag,
      id,
      opaque,
      muted,
      thumbnail,
      mediaSource,
      onPlay,
      onPause,
      onEditVideo
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
      containerTag != nextProps.containerTag ||
      thumbnail !== nextProps.thumbnail ||
      resizeMode !== nextProps.resizeMode ||
      onEditVideo !== nextProps.onEditVideo ||
      mediaSource !== nextProps.mediaSource ||
      clean(sources) !== clean(nextProps.sources) ||
      opaque !== nextProps.opaque ||
      id !== nextProps.id
    ) {
      return true;
    } else {
      return false;
    }
  }

  handleError = event => {
    this.props.onError && this.props.onError(event);

    const source = clean(this.props.sources)[0];

    if (source?.id) {
      delete registrations[source?.id];
    }
  };

  handleLoad = event => {
    const sources = clean(this.props.sources);
    sources.forEach(({ id }) => {
      registrations[id] = true;
    });

    this.props.onLoad && this.props.onLoad(event);
  };

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
      containerTag,
      resizeMode,
      mediaSource,
      thumbnail,
      onError,
      opaque,
      onEditVideo,
      onChangeItem
    } = this.props;

    return (
      <NativeMediaPlayer
        style={style}
        sources={clean(sources)}
        onEnd={onEnd}
        id={id}
        thumbnail={thumbnail}
        containerTag={containerTag}
        nativeID={id}
        borderRadius={borderRadius}
        isActive={isActive}
        allowSkeleton
        onEditVideo={onEditVideo}
        opaque={opaque}
        prefetch={prefetch}
        onProgress={onProgress}
        muted={muted}
        onPlay={onPlay}
        resizeMode={resizeMode}
        onPause={onPause}
        onLoad={onLoad}
        onError={onError}
        // onLoad={this.handleLoad}
        // onError={this.handleError}
        onChangeItem={onChangeItem}
        autoPlay={autoPlay}
        paused={paused}
        ref={this.nativeRef}
      />
    );
  }
}
