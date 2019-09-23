import { PixelRatio } from "react-native";

export const IMAGE_HOST = "https://i.webthing.co";
// export const IMAGE_HOST = "https://d2kjmdvibq1qcy.cloudfront.net"

export const normalizeFormat = value => {
  if (typeof value === "string") {
    return PixelRatio.getPixelSizeForLayoutSize(
      parseInt(value.split("px")[0], 10)
    );
  } else {
    return PixelRatio.getPixelSizeForLayoutSize(value);
  }
};

const normalizeSize = (size, rawHeight) => {
  if (size && rawHeight) {
    const width = normalizeFormat(size);
    const height = normalizeFormat(rawHeight);
    return `${width}x${height}`;
  } else {
    return normalizeFormat(size);
  }
};

export const buildImgSrc = (source, rawSize, rawHeight) => {
  return `${IMAGE_HOST}/${normalizeSize(rawSize, rawHeight)}/${source}`;
};
