import giphyClient from "giphy-api";
import memoizee from "memoizee";
import CameraRoll from "@react-native-community/cameraroll";
import { ImageResolvedAssetSource, Image } from "react-native";
import { extname } from "path";

const mimeTypeFromFilename = (filename: string) =>
  ({
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp"
  }[
    extname(filename || ".")
      .substring(1)
      .toLowerCase()
  ]);

enum ImageSourceType {
  cameraRoll = "cameraRoll",
  giphy = "giphy"
}

const giphy = giphyClient({
  https: true,
  apiKey: "2n6uBhuasG4FXnY2zoNd5ay7AQRx1hMw"
});

export type YeetImage = {
  width: number;
  height: number;
  duration: number;
  uri: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  source: ImageSourceType;
  asset: ImageResolvedAssetSource;
};

export type YeetImageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type YeetImageContainer = {
  source: giphyClient.GIFObject | CameraRoll.PhotoIdentifier | YeetImage;
  preview?: YeetImage;
  image: YeetImage;
  id: string;
};

const normalizeBaseImage = (image): YeetImage => {
  const assetData = {
    uri: image.webp,
    width: Number(image.width),
    height: Number(image.height)
  };
  return {
    ...assetData,
    duration: Number(image.length || 0),
    mimeType: "image/webp",
    source: ImageSourceType.giphy,
    asset: Image.resolveAssetSource(assetData)
  };
};

export const normalizeResizedImage = (
  original: YeetImageContainer,
  uri: string,
  width: number,
  height: number,
  duration: number = 0
): YeetImageContainer => {
  const assetData = {
    uri,
    width,
    height
  };

  const image = {
    ...assetData,
    duration: duration,
    mimeType: original.image.mimeType,
    source: ImageSourceType.cameraRoll,
    asset: Image.resolveAssetSource(assetData)
  };

  return {
    image,
    source: original.source,
    id: image.uri
  };
};

export const imageContainerFromCameraRoll = (
  photo: CameraRoll.PhotoIdentifier
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

  const image = {
    ...assetData,
    duration: duration,
    mimeType: mimeTypeFromFilename(filename),
    source: ImageSourceType.cameraRoll,
    asset: Image.resolveAssetSource(assetData)
  };

  return {
    image,
    source: photo,
    id: image.uri
  };
};

const normalizeOriginalImage = (image): YeetImage => {
  const assetData = {
    uri: image.webp,
    width: Number(image.width),
    height: Number(image.height)
  };

  return {
    ...assetData,
    duration: Number(image.length || 1),
    mimeType: "image/webp",
    source: ImageSourceType.giphy,
    asset: Image.resolveAssetSource(assetData)
  };
};

const normalizeImage = (gif: giphyClient.GIFObject): YeetImageContainer => ({
  id: gif.id,
  source: gif,
  preview: normalizeBaseImage(gif.images.fixed_height_small),
  image: normalizeOriginalImage(gif.images.original)
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
