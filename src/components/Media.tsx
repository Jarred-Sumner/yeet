import * as React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Transition, Transitioning } from "react-native-reanimated";
import Video from "react-native-video";
import { Image } from "./Image";
import DeviceInfo from "react-native-device-info";

const MEDIA_Z_INDEX = 0;
const MEDIA_OVERLAY_Z_INDEX = 1;

const styles = StyleSheet.create({
  mediaContainerStyle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: MEDIA_Z_INDEX
  },
  mediaGradientStyle: {
    width: "100%",
    height: 240,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: MEDIA_OVERLAY_Z_INDEX
  }
});

const IS_SIMULATOR = DeviceInfo.isEmulator();

const ImageMedia = ({ media, height, width }) => (
  <Image
    resizeMode="contain"
    source={{
      uri: media.url,
      width: media.width ? media.width : undefined,
      height: media.height ? media.height : undefined
    }}
    style={[{ height, width }]}
  />
);

const VideoMedia = ({ media, paused, height, width }) => {
  return (
    <Video
      style={[{ height, width }]}
      resizeMode="contain"
      muted={IS_SIMULATOR}
      controls={false}
      loop
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
  height,
  width,
  showGradient = true
}) => {
  let MediaComponent = media.mimeType.includes("image")
    ? ImageMedia
    : VideoMedia;

  const transition = (
    <Transition.Sequence>
      <Transition.In
        propagation="bottom"
        durationMs={1000}
        type="fade"
        interpolation="easeIn"
      />

      <Transition.Change interpolation="easeInOut" />

      <Transition.Out
        propagation="bottom"
        durationMs={1000}
        type="fade"
        interpolation="easeOut"
      />
    </Transition.Sequence>
  );

  const ref = React.useRef();

  React.useEffect(() => {
    ref.current.animateNextTransition();
  }, [media.id, ref]);

  return (
    <>
      <Transitioning.View ref={ref} transition={transition}>
        <View
          key={media.id}
          style={[styles.mediaContainerStyle, { height, width }]}
        >
          <MediaComponent
            width={width}
            media={media}
            paused={paused}
            height={height}
          />
        </View>
      </Transitioning.View>

      {showGradient && (
        <LinearGradient
          style={styles.mediaGradientStyle}
          colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.24)"]}
          locations={[0.0276, 0.3509]}
        />
      )}
    </>
  );
};

export default Media;
