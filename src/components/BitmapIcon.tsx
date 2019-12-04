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
  next = "Icon__next",
  waitlistLogo = "Icon__waitlist",
  twitterDiscuss = "Icon__twitterDiscuss",
  formatHorizontalTextMedia = "Format__horizontalTextMedia",
  formatVerticalTextMedia = "Format__verticalTextMedia",
  formatVerticalMediaText = "Format__verticalMediaText",
  formatHorizontalMediaText = "Format__horizontalMediaText",
  formatMedia = "Format__media",
  formatVerticalMediaMedia = "Format__verticalMediaMedia",
  formatHorizontalMediaMedia = "Format__horizontalMediaMedia"
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
  [BitmapIconName.formatHorizontalTextMedia]: {
    width: 39,
    height: 39
  },
  [BitmapIconName.formatVerticalTextMedia]: {
    width: 39,
    height: 39
  },
  [BitmapIconName.formatVerticalMediaText]: {
    width: 39,
    height: 39
  },
  [BitmapIconName.formatHorizontalMediaText]: {
    width: 39,
    height: 39
  },
  [BitmapIconName.formatMedia]: {
    width: 39,
    height: 39
  },
  [BitmapIconName.formatVerticalMediaMedia]: {
    width: 39,
    height: 39
  },
  [BitmapIconName.formatHorizontalMediaMedia]: {
    width: 39,
    height: 39
  },
  [BitmapIconName.addSticker]: {
    width: 43,
    height: 43
  },
  [BitmapIconName.waitlistLogo]: {
    width: 83,
    height: 44
  },
  [BitmapIconName.twitterDiscuss]: {
    width: 155,
    height: 45
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

export const BitmapIconLogoWaitlist = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.waitlistLogo} />
);

export const BitmapIconTwitterDiscuss = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.twitterDiscuss} />
);

export const BitmapIconFormatHorizontalTextMedia = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.formatHorizontalTextMedia}
  />
);
export const BitmapIconFormatVerticalTextMedia = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.formatVerticalTextMedia}
  />
);
export const BitmapIconFormatVerticalMediaText = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.formatVerticalMediaText}
  />
);
export const BitmapIconFormatHorizontalMediaText = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.formatHorizontalMediaText}
  />
);
export const BitmapIconFormatMedia = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.formatMedia} />
);
export const BitmapIconFormatVerticalMediaMedia = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.formatVerticalMediaMedia}
  />
);
export const BitmapIconFormatHorizontalMediaMedia = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.formatHorizontalMediaMedia}
  />
);
