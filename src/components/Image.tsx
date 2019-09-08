import FastImage from "react-native-fast-image";
import React from "react";
import hoistNonReactStatics from "hoist-non-react-statics";

const CustomFastImage = React.forwardRef(
  ({ source, incrementalLoad = true, ...props }, ref) => {
    if (
      typeof source === "object" &&
      typeof source.uri === "string" &&
      source.uri.startsWith("ph://")
    ) {
      const { uri, ...otherSource } = source;
      return (
        <FastImage
          ref={ref}
          incrementalLoad={false}
          source={{
            uri: source.uri.replace("ph://", "photos://asset/"),
            ...otherSource
          }}
          {...props}
        />
      );
    } else {
      return (
        <FastImage
          ref={ref}
          source={source}
          incrementalLoad={incrementalLoad}
          {...props}
        />
      );
    }
  }
);

export const Image = hoistNonReactStatics(CustomFastImage, FastImage);
export default Image;

export const AvatarImage = ({
  url,
  size,
  srcWidth,
  isLocal,
  srcHeight,
  style = {},
  ...otherProps
}) => {
  return (
    <Image
      {...otherProps}
      style={[
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2
        }
      ]}
      source={{ uri: url, width: srcWidth, height: srcHeight }}
    />
  );
};
