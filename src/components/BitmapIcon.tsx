import * as React from "react";
import {
  Image,
  ImageStyle,
  ImageSourcePropType,
  ImageProps
} from "react-native";

export enum BitmapIconName {
  newPost = "Icon__new-post",
  plus = "Icon__miniPlus",
  addPhoto = "Icon__addPhoto",
  addGif = "Icon__addGif",
  addSticker = "Icon__addSticker",
  addText = "Icon__addText",
  next = "Icon__next"
}

const SIZES_BY_NAME = {
  [BitmapIconName.plus]: {
    width: 19,
    height: 19
  },
  [BitmapIconName.addPhoto]: {
    width: 41,
    height: 38
  },
  [BitmapIconName.addSticker]: {
    width: 43,
    height: 43
  },
  [BitmapIconName.addGif]: {
    width: 51,
    height: 26
  },
  [BitmapIconName.addText]: {
    width: 47,
    height: 41
  },
  [BitmapIconName.next]: {
    width: 51,
    height: 51
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

export const BitmapIconAddPhoto = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.addPhoto} />
);

export const BitmapIconAddSticker = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.addSticker} />
);

export const BitmapIconAddText = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.addText} />
);

export const BitmapIconAddGif = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.addGif} />
);

export const BitmapIconNext = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.next} />
);
