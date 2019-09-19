import * as React from "react";
import { StyleSheet, View, PixelRatio } from "react-native";
import DeviceInfo from "react-native-device-info";
import LinearGradient from "react-native-linear-gradient";
import Animated, { Transition, Transitioning } from "react-native-reanimated";
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

const VideoMedia = ({
  media,
  paused = false,
  height,
  width,
  onLoad,
  containerHeight,
  containerWidth,
  size = "full"
}) => {
  const videoRef = React.createRef<Video>();
  const scale = width / media.width;
  const translateX =
    containerWidth !== width ? (containerWidth - width) / 2 : 0;
  const translateY =
    containerHeight !== height ? (containerHeight - height) / 2 : 0;

  return (
    <Animated.View
      style={{
        width,
        height
      }}
    >
      <Video
        style={[
          // size === "full"
          // ? {
          {
            height,
            width,
            // height: media.height,
            // width: media.width,
            transform: [
              { translateX },
              { translateY }
              // {
              //   scale
              // }
              // {
              //   translateX: media.width / (media.pixelRatio * -1)
              // },
              // {
              //   translateY: media.height / (media.pixelRatio * -1)
              // }
            ]
          }
          // : { height, width }
        ]}
        resizeMode={size === "full" ? "center" : undefined}
        muted={IS_SIMULATOR}
        controls={false}
        autoPlay
        ref={videoRef}
        onLoad={onLoad}
        repeat
        bufferConfig={{
          minBufferMs: 1,
          maxBufferMs: 2000,
          bufferForPlaybackMs: 1,
          bufferForPlaybackAfterRebufferMs: 1000
        }}
        paused={paused}
        fullscreen={false}
        selectedVideoTrack={
          size === "thumbnail"
            ? {
                type: "resolution",
                value: 240
              }
            : undefined
        }
        source={{
          uri: media.url,
          width: media.width ? media.width : undefined,
          height: media.height ? media.height : undefined
        }}
      />
    </Animated.View>
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
  hideContent = false,
  containerHeight,
  containerWidth,
  size
}) => {
  let MediaComponent = media.mimeType.includes("image")
    ? ImageMedia
    : VideoMedia;

  const { height } = scaleToWidth(width, media);

  return (
    <>
      <View
        style={[styles.mediaContainerStyle, { height: _height, width: width }]}
      >
        {!hideContent && (
          <MediaComponent
            width={width}
            containerHeight={containerHeight}
            containerWidth={containerWidth}
            media={media}
            onLoad={onLoad}
            priority={priority}
            paused={paused}
            size={size}
            height={height}
          />
        )}
      </View>
    </>
  );
};

export default Media;
