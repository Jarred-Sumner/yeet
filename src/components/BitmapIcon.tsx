import * as React from "react";
import {
  Image,
  ImageStyle,
  ImageSourcePropType,
  ImageProps
} from "react-native";

export enum BitmapIconName {
  newPost = "Icon__new-post"
}

export const getBitmapIconSource = (name: BitmapIconName) => ({ uri: name });

export const BitmapIconImage = ({
  name,
  style,
  source,
  ...otherProps
}: {
  name: BitmapIconName;
  style?: ImageStyle;
  source?: ImageSourcePropType;
}) => (
  <Image {...otherProps} source={getBitmapIconSource(name)} style={style} />
);

export const BitmapIconNewPost = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.newPost}
    style={style}
  />
);
