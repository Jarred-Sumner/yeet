import * as React from "react";
import { StyleSheet, View, PixelRatio } from "react-native";
import DeviceInfo from "react-native-device-info";
import LinearGradient from "react-native-linear-gradient";
import { Transition, Transitioning } from "react-native-reanimated";
import Video from "react-native-video";
import { Image } from "../Image";
import { buildImgSrc } from "../../lib/imgUri";
import { scaleToWidth } from "../../lib/Rect";

const MEDIA_Z_INDEX = 0;
const MEDIA_OVERLAY_Z_INDEX = 1;

const styles = StyleSheet.create({
  mediaContainerStyle: {}
});

const IS_SIMULATOR = DeviceInfo.isEmulator();

export const resolveImageMediaSource = ({
  media,
  width,
  height,
  priority = Image.priority.high
}) => {
  let srcWidth = PixelRatio.getPixelSizeForLayoutSize(width);
  let srcHeight = PixelRatio.getPixelSizeForLayoutSize(height);

  if (srcWidth > media.width || srcHeight > media.height) {
    srcWidth = media.width;
    srcHeight = media.height;
  }

  return {
    uri: buildImgSrc(media.url, srcWidth, srcHeight),
    width: srcWidth,
    cache: Image.cacheControl.immutable,
    priority,
    height: srcHeight
  };
};

const ImageMedia = ({ media, height, width, priority, onLoad }) => {
  return (
    <Image
      incrementalLoad
      resizeMode="stretch"
      onLoad={onLoad}
      source={resolveImageMediaSource({ media, height, width, priority })}
      style={[{ height, width }]}
    />
  );
};

const VideoMedia = ({ media, paused = false, height, width, onLoad }) => {
  const videoRef = React.createRef<Video>();

  return (
    <Video
      style={[{ height, width }]}
      resizeMode="stretch"
      muted={IS_SIMULATOR}
      controls={false}
      autoPlay
      ref={videoRef}
      onLoad={onLoad}
      repeat
      paused={paused}
      fullscreen={false}
      source={{
        uri: media.url,
        width: media.width ? media.width : undefined,
        height: media.height ? media.height : undefined
      }}
    />
  );
};

export const Media = ({
  media,
  paused,
  height: _height,
  width,
  showGradient = true,
  onLoad,
  priority,
  hideContent = false
}) => {
  let MediaComponent = media.mimeType.includes("image")
    ? ImageMedia
    : VideoMedia;

  const { height } = scaleToWidth(width, media);

  return (
    <>
      <View style={[styles.mediaContainerStyle, { height, width: width }]}>
        {!hideContent && (
          <MediaComponent
            width={width}
            media={media}
            onLoad={onLoad}
            priority={priority}
            paused={paused}
            height={height}
          />
        )}
      </View>
    </>
  );
};

export default Media;
