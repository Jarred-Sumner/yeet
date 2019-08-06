import FastImage from "react-native-fast-image";
import React from "react";

export const Image = FastImage;
export default Image;

export const AvatarImage = ({
  url,
  size,
  srcWidth,
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
