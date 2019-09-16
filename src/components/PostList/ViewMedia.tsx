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

const ImageMedia = ({ media, height, width }) => {
  const srcWidth = PixelRatio.getPixelSizeForLayoutSize(width);
  const srcHeight = PixelRatio.getPixelSizeForLayoutSize(height);

  const source = {
    uri: buildImgSrc(media.url, srcWidth, srcHeight),
    width: srcWidth,
    height: srcHeight
  };

  return (
    <Image resizeMode="stretch" source={source} style={[{ height, width }]} />
  );
};

const VideoMedia = ({ media, paused = false, height, width }) => {
  const videoRef = React.createRef<Video>();

  return (
    <Video
      style={[{ height, width }]}
      resizeMode="stretch"
      muted={IS_SIMULATOR}
      controls={false}
      autoPlay
      ref={videoRef}
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
  showGradient = true
}) => {
  let MediaComponent = media.mimeType.includes("image")
    ? ImageMedia
    : VideoMedia;

  const { height } = scaleToWidth(width, media);

  return (
    <>
      <View
        key={media.id}
        style={[styles.mediaContainerStyle, { height, width: width }]}
      >
        <MediaComponent
          width={width}
          media={media}
          paused={paused}
          height={height}
        />
      </View>
    </>
  );
};

export default Media;
