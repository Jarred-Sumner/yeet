import {
  NativeModules,
  requireNativeComponent,
  View,
  UIManager,
  findNodeHandle,
  StyleProp
} from "react-native";
import React, { ReactEventHandler, useImperativeHandle } from "react";
import { ImageMimeType, YeetImageRect } from "../lib/imageSearch";
import { DimensionsRect, BoundsRect } from "../lib/Rect";
import { useFocusEffect, useIsFocused } from "react-navigation-hooks";
import hoistNonReactStatics from "hoist-non-react-statics";
import { NativeMediaPlayer } from "./NativeMediaPlayer";

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

  pause = () => {
    this.callNativeMethod("pause");
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

  // shouldComponentUpdate(nextProps, nextState) {
  //   const {
  //     paused,
  //     sources,
  //     style,
  //     onProgress,
  //     onChangeItem,
  //     onEnd,
  //     autoPlay,
  //     prefetch,
  //     borderRadius,
  //     onError,
  //     isActive
  //   } = this.props;

  //   if (this.state !== nextState) {
  //     return true;
  //   }

  //   if (
  //     paused !== nextProps.paused ||
  //     autoPlay !== nextProps.autoPlay ||
  //     onProgress !== nextProps.onProgress ||
  //     onChangeItem !== nextProps.onChangeItem ||
  //     onEnd !== nextProps.onEnd ||
  //     style !== nextProps.style ||
  //     borderRadius !== nextProps.borderRadius ||
  //     onError !== nextProps.onError ||
  //     isActive !== nextProps.isActive ||
  //     prefetch != nextProps.prefetch
  //   ) {
  //     return true;
  //   }

  //   const currentSourceIDs = sources.map(({ id }) => id).join("-");
  //   const newSourceIDs = nextProps.sources.map(({ id }) => id).join("-");

  //   return currentSourceIDs !== newSourceIDs;
  // }

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
      onError,
      onChangeItem
    } = this.props;

    return (
      <NativeMediaPlayer
        style={style}
        sources={clean(sources)}
        onEnd={onEnd}
        id={id}
        borderRadius={borderRadius}
        isActive={isActive}
        prefetch={prefetch}
        onProgress={onProgress}
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

const _MediaPlayer = (React.forwardRef(({ isActive, ...props }: Props, ref) => {
  const [isAutoHidden, setAutoHidden] = React.useState(false);
  const _ref = React.useRef<MediaPlayerComponent>(null);
  useImperativeHandle(ref, () => _ref.current);

  return <MediaPlayerComponent isActive={isActive} ref={_ref} {...props} />;
}) as unknown) as MediaPlayerComponent;

export const MediaPlayer = hoistNonReactStatics(
  _MediaPlayer,
  MediaPlayerComponent
);

export default MediaPlayer;
