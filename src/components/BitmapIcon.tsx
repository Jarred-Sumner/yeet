import * as React from "react";
import {
  Image,
  ImageStyle,
  ImageSourcePropType,
  ImageProps
} from "react-native";

export enum BitmapIconName {
  newPost = "Icon__new-post",
  plus = "Icon__miniPlus"
}

const SIZES_BY_NAME = {
  [BitmapIconName.plus]: {
    width: 19,
    height: 19
  }
};

export const getBitmapIconSource = (
  name: BitmapIconName
): ImageSourcePropType => {
  const size = SIZES_BY_NAME[name] || {};

  return { uri: name, ...size };
};

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

export const BitmapIconPlus = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.plus} />
);
