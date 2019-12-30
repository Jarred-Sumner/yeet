import * as React from "react";
import {
  Image,
  ImageStyle,
  ImageSourcePropType,
  ImageProps,
  Platform,
  PixelRatio
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
  logo = "Icon__logo",
  circleCheckSelected = "Icon__circlelCheckSelected",
  formatHorizontalTextMedia = "Format__horizontalTextMedia",
  formatVerticalTextMedia = "Format__verticalTextMedia",
  formatVerticalMediaText = "Format__verticalMediaText",
  formatHorizontalMediaText = "Format__horizontalMediaText",
  formatMedia = "Format__media",
  formatVerticalMediaMedia = "Format__verticalMediaMedia",
  formatHorizontalMediaMedia = "Format__horizontalMediaMedia",
  templatePixel = "Template__pixel",
  templateMonospace = "Template__monospace",
  templateGary = "Template__gary",
  templateComic = "Template__comic",
  templateClassic = "Template__classic",
  templateBigWords = "Template__bigWords",
  shareCardInstagram = "ShareCard__Instagram",
  shareCardInstagramStory = "ShareCard__InstagramStory",
  shareCardSnapchat = "ShareCard__Snapchat",
  socialButtonInstagram = "SocialButton__Instagram",
  socialButtonSnapchat = "SocialButton__Snapchat",
  socialLogoInstagram = "SocialLogo__Instagram",
  socialLogoSnapchat = "SocialLogo__Snapchat",
  instagramPostFooter = "InstagramPostFooter",
  instagramTabBar = "InstagramTabBar"
}

const SIZES_BY_NAME = {
  [BitmapIconName.templateClassic]: {
    width: 85,
    height: 21
  },
  [BitmapIconName.templateComic]: {
    width: 107,
    height: 50
  },
  [BitmapIconName.templateBigWords]: {
    width: 65,
    height: 21
  },
  [BitmapIconName.templateGary]: {
    width: 47,
    height: 21
  },
  [BitmapIconName.templateMonospace]: {
    width: 113,
    height: 23
  },
  [BitmapIconName.templatePixel]: {
    width: 77,
    height: 21
  },
  [BitmapIconName.plus]: {
    width: 19,
    height: 19
  },
  [BitmapIconName.logo]: {
    width: 114,
    height: 59
  },
  [BitmapIconName.circleCheckSelected]: {
    width: 29,
    height: 29
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

const getAndroidImageDensity = () => {
  const show3x = PixelRatio.get() > 2.5;
  const show2x = PixelRatio.get() > 1.5;

  if (show3x) {
    return "@3x";
  } else if (show2x) {
    return "@2x";
  } else {
    return "";
  }
};

export const getBitmapIconSource = (
  name: BitmapIconName
): ImageSourcePropType => {
  const uri = Platform.select({
    ios: name,
    android: `asset:/custom/${name}${getAndroidImageDensity()}.png`
  });

  const size = SIZES_BY_NAME[name] || {};

  return { uri, ...size };
};

export const BitmapIconImage = React.memo(
  ({
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
  )
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

export const BitmapIconLogo = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.logo} />
);

export const BitmapIconCircleCheckSelected = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage {...otherProps} name={BitmapIconName.circleCheckSelected} />
);

export const BitmapIconTemplatePixel = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    style={style}
    name={BitmapIconName.templatePixel}
  />
);
export const BitmapIconTemplateMonospace = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    style={style}
    name={BitmapIconName.templateMonospace}
  />
);
export const BitmapIconTemplateGary = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    style={style}
    name={BitmapIconName.templateGary}
  />
);
export const BitmapIconTemplateComic = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    style={style}
    name={BitmapIconName.templateComic}
  />
);
export const BitmapIconTemplateClassic = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    style={style}
    name={BitmapIconName.templateClassic}
  />
);

export const BitmapIconTemplateBigWords = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    style={style}
    name={BitmapIconName.templateBigWords}
  />
);

export const BitmapIconShareCardInstagram = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.shareCardInstagram}
    style={style}
  />
);
export const BitmapIconShareCardInstagramStory = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.shareCardInstagramStory}
    style={style}
  />
);
export const BitmapIconShareCardSnapchat = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.shareCardSnapchat}
    style={style}
  />
);
export const BitmapIconSocialButtonInstagram = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.socialButtonInstagram}
    style={style}
  />
);
export const BitmapIconSocialButtonSnapchat = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.socialButtonSnapchat}
    style={style}
  />
);
export const BitmapIconSocialLogoInstagram = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.socialLogoInstagram}
    style={style}
  />
);
export const BitmapIconSocialLogoSnapchat = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.socialLogoSnapchat}
    style={style}
  />
);

export const BitmapIconInstagramTabBar = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.instagramTabBar}
    style={style}
  />
);

export const BitmapIconInstagramPostFooter = ({
  style,
  ...otherProps
}: Partial<ImageProps>) => (
  <BitmapIconImage
    {...otherProps}
    name={BitmapIconName.instagramPostFooter}
    style={style}
  />
);
