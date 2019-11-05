// import FastImage from "react-native-fast-image";
import React from "react";
import hoistNonReactStatics from "hoist-non-react-statics";
import MediaPlayer, { MediaPlayerComponent, MediaSource } from "./MediaPlayer";
import { mediaSourceFromSource } from "../lib/imageSearch";
import { ImageSourcePropType, ImageStyle } from "react-native";

type BaseProps = {
  style: ImageStyle;
  borderRadius?: number;
};

type MediaSourceImageProps = BaseProps & {
  mediaSource: MediaSource;
  source: never;
};

type AssetSourceImageProps = BaseProps & {
  source: ImageSourcePropType;
  mediaSource: never;
};

type Props = MediaSourceImageProps | AssetSourceImageProps;

const CustomFastImage = React.forwardRef(
  (
    {
      source,
      mediaSource,
      isVisible = true,
      style,
      borderRadius = 0,
      ...props
    }: Props,
    ref
  ) => {
    let sources = [];
    if (typeof mediaSource !== "undefined") {
      sources = [mediaSource];
    } else if (typeof source !== "undefined") {
      sources = [
        mediaSourceFromSource(source, {
          width: source.width,
          height: source.height,
          x: 0,
          y: 0
        })
      ];
    }

    return (
      <MediaPlayer
        ref={ref}
        sources={sources}
        borderRadius={borderRadius}
        isVisible={isVisible}
        autoPlay
        paused={!isVisible}
        style={style}
        {...props}
      />
    );
  }
);

export const Image = hoistNonReactStatics(CustomFastImage, MediaPlayer);

Image.displayName = "MediaPlayerImage";
export default Image;

export const AvatarImage = React.forwardRef(
  (
    { url, size, srcWidth, isLocal, srcHeight, style = {}, ...otherProps },
    ref
  ) => {
    return (
      <Image
        {...otherProps}
        ref={ref}
        borderRadius={size / 2}
        style={[
          style,
          {
            width: size,
            height: size
          }
        ]}
        source={{ uri: url, width: srcWidth, height: srcHeight }}
      />
    );
  }
);
