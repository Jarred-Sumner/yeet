import giphyClient from "giphy-api";
import memoizee from "memoizee";
import CameraRoll from "@react-native-community/cameraroll";
import {
  ImageResolvedAssetSource,
  Image,
  PerpectiveTransform,
  RotateTransform,
  RotateXTransform,
  RotateYTransform,
  RotateZTransform,
  ScaleTransform,
  ScaleXTransform,
  ScaleYTransform,
  TranslateXTransform,
  TranslateYTransform,
  SkewXTransform,
  SkewYTransform,
  ImageSourcePropType
} from "react-native";
import { extname } from "path";
import { MediaSource } from "../components/MediaPlayer";
import { DimensionsRect, BoundsRect } from "./Rect";
import { convertCameraRollIDToRNFetchBlobId } from "./imageResize";

export enum ImageAspectRatio {
  vertical = "vertical",
  square = "square",
  horizontal = "horizontal"
}

export const getAspectRatio = (image: YeetImageContainer) => {
  const { width, height } = image.image;
  const ratio = width / height;

  if (ratio > 0.9 && ratio < 1.1) {
    return ImageAspectRatio.square;
  } else if (ratio <= 0.9) {
    return ImageAspectRatio.vertical;
  } else {
    return ImageAspectRatio.horizontal;
  }
};

export enum ImageMimeType {
  png = "image/png",
  gif = "image/gif",
  jpg = "image/jpeg",
  m3u8 = "video/mp4",
  jpeg = "image/jpeg",
  webp = "image/webp",
  mp4 = "video/mp4",
  mov = "video/quicktime",
  heic = "image/heif",
  heif = "image/heif",
  tiff = "image/tiff",
  bmp = "image/bmp"
}

export const isVideo = (mimeType: ImageMimeType) =>
  [ImageMimeType.mov, ImageMimeType.mp4].includes(mimeType);

export const extensionByMimeType = (mimeType: ImageMimeType) => {
  if (mimeType === ImageMimeType.png) {
    return ".png";
  } else if (mimeType === ImageMimeType.gif) {
    return ".gif";
  } else if (mimeType === ImageMimeType.jpg) {
    return ".jpg";
  } else if (mimeType === ImageMimeType.webp) {
    return ".webp";
  } else if (mimeType === ImageMimeType.mp4) {
    return ".mp4";
  } else if (mimeType === ImageMimeType.heic) {
    return ".heic";
  } else if (mimeType === ImageMimeType.tiff) {
    return ".tiff";
  } else if (mimeType === ImageMimeType.mov) {
    return ".mov";
  } else if (mimeType === ImageMimeType.bmp) {
    return ".bmp";
  } else {
    return null;
  }
};

export const MIME_TYPE_MAPPING = {
  png: ImageMimeType.png,
  gif: ImageMimeType.gif,
  jpg: ImageMimeType.jpg,
  jpeg: ImageMimeType.jpeg,
  webp: ImageMimeType.webp,
  m3u8: ImageMimeType.mp4,
  heic: ImageMimeType.heic,
  tiff: ImageMimeType.tiff,
  tif: ImageMimeType.tiff,
  mp4: ImageMimeType.mp4,
  plist: ImageMimeType.jpg,
  bmp: ImageMimeType.bmp,
  mov: ImageMimeType.mov
};

export const mimeTypeFromFilename = (filename: string) => {
  const ext = extname(filename || ".")
    .substring(1)
    .toLowerCase();

  if (ext === "m3u8") {
    return ImageMimeType.mp4;
  }

  return MIME_TYPE_MAPPING[ext];
};

export enum ImageSourceType {
  cameraRoll = "cameraRoll",
  giphy = "giphy",
  yeet = "yeet",
  search = "search",
  youtube_dl = "youtube_dl",
  opengraph = "opengraph"
}

const giphy = giphyClient({
  https: true,
  apiKey: "2n6uBhuasG4FXnY2zoNd5ay7AQRx1hMw"
});

export type YeetTransform = Array<
  | PerpectiveTransform
  | RotateTransform
  | RotateXTransform
  | RotateYTransform
  | RotateZTransform
  | ScaleTransform
  | ScaleXTransform
  | ScaleYTransform
  | TranslateXTransform
  | TranslateYTransform
  | SkewXTransform
  | SkewYTransform
>;

export type YeetImage = {
  width: number;
  height: number;
  duration: number;
  __typename: "YeetImage";
  uri: string;
  audioURI?: string;
  mimeType: ImageMimeType;
  source: ImageSourceType;

  transform: YeetTransform;
};

export type YeetImageRect = {
  x: number;
  y: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

type YeetImageContainerBase = {
  preview?: YeetImage;
  image: YeetImage;
  id: string;
};

type YeetImageContainerGiphy = YeetImageContainerBase & {
  source: giphyClient.GIFObject;
  sourceType: ImageSourceType.giphy;
};

type YeetImageContainerYeet = YeetImageContainerBase & {
  source: YeetImageContainer;
  sourceType: ImageSourceType.yeet;
};

type YeetImageContainerCameraRoll = YeetImageContainerBase & {
  source: CameraRoll.PhotoIdentifier;
  sourceType: ImageSourceType.cameraRoll;
};

export type YeetImageContainer =
  | YeetImageContainerGiphy
  | YeetImageContainerYeet
  | YeetImageContainerCameraRoll;

const normalizeBaseImage = (
  image,
  transform: YeetTransform = []
): YeetImage => {
  const assetData = {
    uri: image.webp || image.url,
    width: Number(image.width),
    height: Number(image.height)
  };
  return {
    ...assetData,
    duration: Number(image.length || 0),
    mimeType: mimeTypeFromFilename(assetData.uri),
    source: ImageSourceType.giphy,
    __typename: "YeetImage",
    transform
  };
};

export const normalizeResizedImage = (
  original: YeetImageContainer,
  uri: string,
  width: number,
  height: number,
  duration: number = 0,
  transform: YeetTransform = []
): YeetImageContainer => {
  const assetData = {
    uri,
    width,
    height
  };

  const image = {
    ...assetData,
    duration: duration,
    playDuration: duration,
    mimeType: original.image.mimeType,
    __typename: "YeetImage",
    source: ImageSourceType.cameraRoll,
    transform
  };

  return {
    image,
    source: original.source,
    id: image.uri,
    sourceType: original.sourceType
  };
};

export const imageContainerFromCameraRoll = (
  photo: CameraRoll.PhotoIdentifier,
  transform: YeetTransform = []
): YeetImageContainer => {
  const {
    uri,
    width,
    height,
    playableDuration: duration = 0,
    filename
  } = photo.node.image;

  const assetData = {
    uri,
    width,
    height
  };

  const mimeType = mimeTypeFromFilename(filename);

  if (!mimeType) {
    throw Error(`Invalid mimetype for photo: ${JSON.stringify(photo)}`);
  }

  const image = {
    ...assetData,
    duration: duration,
    __typename: "YeetImage",
    playDuration: duration,
    mimeType,
    source: ImageSourceType.cameraRoll,
    transform
  };

  return {
    image,
    source: photo,
    id: image.uri,
    sourceType: ImageSourceType.cameraRoll
  };
};

const normalizeOriginalImage = (image, transform = []): YeetImage => {
  const assetData = {
    uri: image.mp4 || image.webp || image.url,
    width: Number(image.width),
    height: Number(image.height)
  };

  return {
    ...assetData,
    duration: Number(image.length || 1),
    playDuration: Number(image.length || 1),
    __typename: "YeetImage",
    mimeType: mimeTypeFromFilename(assetData.uri),
    source: ImageSourceType.giphy,

    transform
  };
};

const findGiphyImage = (
  image: giphyClient.GIFObject,
  order = [
    "fixed_height_small",
    "fixed_height",
    "fixed_height_downsampled",

    "downsized_medium"
  ],
  preferredContentType: "mp4" | "webp" = "mp4"
) => {
  const item = order.find(item => {
    return (
      image.images[item] &&
      String(image.images[item][preferredContentType]).length > 0
    );
  });

  if (item) {
    return image.images[item];
  } else {
    return image.images[
      order.find(item => {
        return image.images[item] && image.images[item].url;
      })
    ];
  }
};

const normalizeImage = (gif: giphyClient.GIFObject): YeetImageContainer => ({
  id: gif.id,
  source: gif,
  preview: normalizeBaseImage(findGiphyImage(gif, undefined, "webp")),
  image: normalizeOriginalImage(gif.images.original),
  sourceType: ImageSourceType.giphy,
  __typename: "YeetImageContainer"
});

export type ImageSearchResponse = {
  images: Array<YeetImageContainer>;
  success: boolean;
  hasMore: boolean;
  offset: number;
};

const normalizeGiphyResponse = async (
  response: Promise<giphyClient.MultiResponse>
): Promise<ImageSearchResponse> => {
  const results = await response;

  return {
    images: results.data.map(normalizeImage),
    success: true,
    hasMore:
      results.pagination.count + results.pagination.offset <
      results.pagination.total_count,
    offset: results.pagination.offset + results.pagination.count
  };
};

const _searchPhrase = (
  query: string,
  offset: number = 0,
  limit: number = 50
) => {
  return normalizeGiphyResponse(
    giphy.search({
      rating: "PG-13",
      offset,
      limit,
      q: query
    })
  );
};

const _getTrending = (offset: number = 0, limit: number = 50) => {
  return normalizeGiphyResponse(giphy.trending({ limit, offset }));
};

export const searchPhrase = memoizee(_searchPhrase, {
  async: true,
  max: 4
});

export const getTrending = memoizee(_getTrending, {
  async: true,
  max: 1
});

export const getSourceDimensions = (
  image: YeetImageContainer
): YeetImageRect => {
  if (image.sourceType === ImageSourceType.cameraRoll) {
    const { width, height } = image.source.node.image;
    return { width, height, x: 0, y: 0, maxX: width, maxY: height };
  } else if (image.sourceType === ImageSourceType.giphy) {
    const { width: _width, height: _height } = image.source.images.original;
    const width = Number(_width);
    const height = Number(_height);

    return { width, height, x: 0, y: 0, maxX: width, maxY: height };
  } else if (image.sourceType === ImageSourceType.yeet) {
    const { width, height } = image.image;
    return { width, height, x: 0, y: 0, maxX: width, maxY: height };
  } else {
    return { width: 0, height: 0, x: 0, y: 0, maxX: 0, maxY: 0 };
  }
};

export const imageFromMediaSource = (
  mediaSource: Partial<MediaSource>
): YeetImage => {
  const {
    width = 0,
    url: _url,
    height = 0,
    pixelRatio,
    mimeType: _mimeType,
    duration = 0,
    playDuration = 0
  } = mediaSource;

  if (!_url) {
    throw Error(`Invalid url for asset ${JSON.stringify(mediaSource)}`);
  }

  const mimeType =
    ImageMimeType[_mimeType] || mimeTypeFromFilename(_url.split("?")[0]);

  if (!mimeType) {
    throw Error(`Invalid mimetype for asset ${JSON.stringify(mediaSource)}`);
  }

  const url =
    mimeType !== undefined && _url.includes("ph://")
      ? convertCameraRollIDToRNFetchBlobId(_url, extensionByMimeType(mimeType))
      : _url;

  return {
    uri: url,
    width,
    __typename: "YeetImage",
    height,
    mimeType,
    duration,
    transform: [],
    source: ImageSourceType.yeet
  };
};

export const imageContainerFromMediaSource = (
  mediaSource: Partial<MediaSource>,
  source: YeetImageContainer
): YeetImageContainer => {
  return {
    id: mediaSource.id,
    sourceType: ImageSourceType.yeet,
    image: imageFromMediaSource(mediaSource),
    preview: imageFromMediaSource(mediaSource),
    source
  };
};

export const mediaSourceFromImage = (
  container: YeetImageContainer,
  dimensions: BoundsRect,
  forceImage: Boolean = false,
  preferPreview: Boolean = false
): MediaSource => {
  const image = preferPreview
    ? container.preview ?? container.image
    : container.image;

  const { width, height, uri: __url, mimeType, duration } = image;

  const _url = __url ?? image.url;

  if (!mimeType) {
    throw Error(`Invalid mimetype for asset ${JSON.stringify(container)}`);
  }

  if (_url === null) {
    throw Error(`Invalid url for asset ${JSON.stringify(container)}`);
  }

  const url =
    mimeType !== undefined && _url.includes("ph://")
      ? convertCameraRollIDToRNFetchBlobId(_url, extensionByMimeType(mimeType))
      : _url;

  const _mimeType =
    forceImage && isVideo(mimeType) ? ImageMimeType.jpeg : mimeType;

  return {
    url,
    width,
    height,
    mimeType: _mimeType,
    duration,
    playDuration: duration,
    id: `${container.id}-${dimensions.width}-${dimensions.height}-${_mimeType}`,
    bounds: dimensions,
    pixelRatio: 1.0
  };
};

export const mediaSourceFromSource = (
  source: ImageSourcePropType,
  dimensions: BoundsRect,
  duration: number = 0,
  preferPreview: Boolean = false
): MediaSource => {
  const { width = 0, uri: _url, height = 0, mimeType: _mimeType } = source;

  if (!_url) {
    throw Error(`Invalid url for asset ${JSON.stringify(source)}`);
  }

  const mimeType = _mimeType || mimeTypeFromFilename(_url.split("?")[0]);

  if (!mimeType) {
    throw Error(`Invalid mimetype for asset ${JSON.stringify(source)}`);
  }

  const url =
    mimeType !== undefined && _url.includes("ph://")
      ? convertCameraRollIDToRNFetchBlobId(_url, extensionByMimeType(mimeType))
      : _url;

  return {
    url,
    width,
    height,
    mimeType,
    duration,
    playDuration: duration,
    id: [url, width, height].join("-"),
    bounds: dimensions,
    pixelRatio: 1.0
  };
};

export const mediaSourcesFromImage = (
  container: YeetImageContainer,
  dimensions: BoundsRect,
  playDuration?: number = 0.0,
  usePreview: Boolean = false
): Array<MediaSource> => {
  return [mediaSourceFromImage(container, dimensions, usePreview, usePreview)];
};
