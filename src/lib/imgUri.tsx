import { PixelRatio } from "react-native";
import qs from "qs";

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
  if (!source.startsWith("https://") && !source.startsWith("http://")) {
    return source;
  }

  if (source.startsWith("https://image.mux.com")) {
    const vars = qs.stringify({
      ...qs.parse(source.split("?")[1]),
      // width: PixelRatio.roundToNearestPixel(rawSize),
      width: PixelRatio.getPixelSizeForLayoutSize(rawSize),
      fit_mode: "preserve",
      start: 0,
      end: 3
    });

    return [source.split("?")[0], vars].join("?");
  } else {
    return `${IMAGE_HOST}/${normalizeSize(rawSize, rawHeight)}/${source}`;
  }
};
