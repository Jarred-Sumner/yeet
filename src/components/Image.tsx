// import FastImage from "react-native-fast-image";
import React from "react";
import hoistNonReactStatics from "hoist-non-react-statics";
import MediaPlayer, { MediaPlayerComponent } from "./MediaPlayer";
import { mediaSourceFromSource } from "../lib/imageSearch";

const CustomFastImage = React.forwardRef(
  (
    {
      source,
      mediaSource,
      style,
      borderRadius = 0,
      incrementalLoad = false,
      ...props
    },
    ref
  ) => {
    let sources = mediaSource
      ? [mediaSource]
      : [
          mediaSourceFromSource(source, {
            width: source.width,
            height: source.height
          })
        ];

    return (
      <MediaPlayer
        ref={ref}
        sources={sources}
        borderRadius={borderRadius}
        style={style}
        {...props}
      />
    );
  }
);

export const Image = hoistNonReactStatics(CustomFastImage, MediaPlayer);
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
