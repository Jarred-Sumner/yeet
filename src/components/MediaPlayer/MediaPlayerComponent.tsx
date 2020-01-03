import React, { ReactEventHandler } from "react";
import {
  findNodeHandle,
  NativeModules,
  StyleProp,
  UIManager
} from "react-native";
import { ImageMimeType, isVideo } from "../../lib/imageSearch";
import { BoundsRect, DimensionsRect } from "../../lib/Rect";
import { NativeMediaPlayer, VIEW_NAME } from "./NativeMediaPlayer";
import { MediaPlayerStatus } from "./MediaPlayerContext";
import memoizee from "memoizee";

type MediaPlayerCallbackFunction = (error: Error | null, result: any) => void;

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
  onError: ReactEventHandler<StatusEventData>;
  isActive: boolean;
  style: StyleProp<any>;
  prefetch?: boolean;
  muted?: boolean;
  resizeMode: MediaPlayerResizeMode;
  onEnd?: ReactEventHandler<StatusEventData>;
  onLoad?: ReactEventHandler<StatusEventData>;
  onPlay?: ReactEventHandler<StatusEventData>;
  onPause?: ReactEventHandler<StatusEventData>;
  id: string;
  paused?: boolean;
  onProgress?: ReactEventHandler<ProgressEventData>;
  onChangeItem?: ReactEventHandler<StatusEventData>;
};

const _clean = (
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

const clean = memoizee(_clean);

export class MediaPlayerComponent extends React.Component<MediaPlayerProps> {
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

  get nativeNode() {
    return findNodeHandle(this.nativeRef.current);
  }

  static NativeModule = NativeModules["MediaPlayerViewManager"];

  static batchPlay(tag: number, ids: Array<string>) {
    return MediaPlayerComponent.NativeModule?.batchPlay(tag, ids);
  }

  static batchPause(tag: number, ids: Array<string>) {
    return MediaPlayerComponent.NativeModule?.batchPause(tag, ids);
  }

  static startCaching(
    mediaSources: Array<Partial<MediaSource | null>>,
    size: BoundsRect,
    contentMode: string
  ) {
    const _mediaSources = clean(mediaSources);

    MediaPlayerComponent.NativeModule?.startCachingMediaSources(
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

    MediaPlayerComponent.NativeModule?.startCachingMediaSources(
      _mediaSources,
      size,
      contentMode
    );
  }

  static stopCachingAll() {
    MediaPlayerComponent.NativeModule?.stopCachingAll();
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
    this.callNativeMethod("play");
  };

  pause = () => {
    this.callNativeMethod("pause");
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
