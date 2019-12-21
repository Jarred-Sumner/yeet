import Video from "react-native-video";
import { Image, ImageSourcePropType } from "react-native";
import { MediaSource, MediaPlayerProps } from "./MediaPlayerComponent";
import * as React from "react";
import { isVideo, ImageMimeType } from "../../lib/imageSearch";
import memoizee from "memoizee";
import { buildImgSrc } from "../../lib/imgUri";

export const VIEW_NAME = "MediaPlayerView";

type Props = MediaPlayerProps & {
  playerRef: React.RefObject<Video | Image>;
};

const videoSource = memoizee((source: MediaSource) => {
  return {
    uri: source.url
  };
});

const imageSource = memoizee(
  (source: MediaSource): ImageSourcePropType => {
    return {
      uri: buildImgSrc(source.url, source.width, source.height),
      width: source.width,
      height: source.height
    };
  }
);

class NativeMediaPlayerComponent extends React.Component<Props> {
  videoRef: Video | null = null;
  imageRef: Image | null = null;

  updateViewRef = newRef => {
    if (this.props.playerRef) {
      this.props.playerRef.current = newRef;
    }
  };

  updateVideoRef = newRef => {
    this.videoRef = newRef;
    if (this.props.playerRef) {
      this.props.playerRef.current = newRef;
    }
  };

  updateImageRef = newRef => {
    this.imageRef = newRef;
    if (this.props.playerRef) {
      this.props.playerRef.current = newRef;
    }
  };

  render() {
    const {
      sources = [],
      style,
      paused,
      autoPlay,
      isActive,
      muted,
      borderRadius,
      resizeMode,
      ...otherProps
    } = this.props;

    const [source] = sources;

    if (source && isVideo(source.mimeType)) {
      return (
        <Video
          ref={this.updateVideoRef}
          resizeMode={
            {
              aspectFill: "contain",
              aspectFit: "cover"
            }[resizeMode] || "contain"
          }
          style={style}
          source={videoSource(source)}
          paused={paused}
          autoPlay={autoPlay}
          repeat
          muted={muted}
        />
      );
    } else if (source && !isVideo(source.mimeType)) {
      return (
        <Image
          ref={this.updateImageRef}
          progressiveRenderingEnabled={
            source.mimeType === ImageMimeType.jpg ||
            source.mimeType === ImageMimeType.webp
          }
          resizeMode={
            {
              aspectFill: "contain",
              aspectFit: "cover"
            }[resizeMode] || "contain"
          }
          style={style}
          source={imageSource(source)}
          paused={paused}
          autoPlay={autoPlay}
          borderRadius={borderRadius}
          repeat
          muted={muted}
        />
      );
    } else {
      return <View ref={this.updateViewRef} style={style} />;
    }
  }
}

export const NativeMediaPlayer = React.forwardRef((props, ref) => {
  return <NativeMediaPlayerComponent {...props} playerRef={ref} />;
}) as React.ComponentType<MediaPlayerProps>;

export default NativeMediaPlayer;
