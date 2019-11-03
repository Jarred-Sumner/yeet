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
  ({ source, mediaSource, style, borderRadius = 0, ...props }: Props, ref) => {
    const sources = React.useMemo(() => {
      if (typeof mediaSource !== "undefined") {
        return [mediaSource];
      } else if (typeof source !== "undefined") {
        return [
          mediaSourceFromSource(source, {
            width: source.width,
            height: source.height,
            x: 0,
            y: 0
          })
        ];
      }
    }, [mediaSource, source, mediaSourceFromSource]);

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
