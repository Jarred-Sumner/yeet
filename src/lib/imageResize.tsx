import path from "path";
import { Image } from "react-native";
import RNFS from "react-native-fs";
import PhotoEditor from "react-native-photo-manipulator";
import RNFetchBlob from "rn-fetch-blob";
import {
  YeetImage,
  YeetImageContainer,
  normalizeResizedImage,
  YeetImageRect
} from "./imageSearch";

export const generateFilename = (extension = "png") =>
  `${Math.random()
    .toString(36)
    .substring(7)}.${extension}`;

export const convertLocalIdentifierToAssetLibrary = (localIdentifier, ext) => {
  const hash = localIdentifier.split("/")[0];
  return `assets-library://asset/asset.${ext}?id=${hash}&ext=${ext}`;
};

const getAssetFileAbsolutePath = async assetPath => {
  const dest = `${RNFS.TemporaryDirectoryPath}${generateFilename()}`;

  const _path = assetPath.startsWith("ph://")
    ? convertLocalIdentifierToAssetLibrary(
        assetPath.split("://")[1].split("/")[0],
        "png"
      )
    : assetPath;

  try {
    return await RNFS.copyAssetsFileIOS(_path, dest, 0, 0);
  } catch (err) {
    console.log(err);
  }
};

export const getLocalURI = async (_uri: string | Object) => {
  const uri = typeof _uri === "string" ? _uri : _uri.uri;
  if (!uri.startsWith("http")) {
    return uri;
  }

  return uri;
  // return RNFetchBlob.config({
  //   fileCache: true,
  //   // by adding this option, the temp files will have a file extension
  //   appendExt: path.extname(uri)
  // })
  //   .fetch("GET", uri)
  //   .then(res => {
  //     return res.path();
  //   });
};

export const resizeImage = async ({
  image,
  width,
  height,
  top = 0,
  bottom = 0,
  x = 0,
  displaySize
}: {
  image: YeetImageContainer;
  width: number;
  height: number;
  top: number;
  bottom: number;
  x: number;
  displaySize?: { width: number; height: number };
}): Promise<[YeetImageContainer, YeetImageRect]> => {
  const multiplier = image.image.width / width;
  const isAnimated = image.image.duration > 0;
  const uri = await getLocalURI(image.image.uri);

  const size = {
    width: width * multiplier,
    height: (height - Math.abs(bottom)) * multiplier,
    y: top * multiplier,
    x: x * multiplier
  };

  if (isAnimated) {
    const _displaySize = displaySize || { width, height };
    const ratio = _displaySize.width / image.image.width;

    const croppedSize = {
      width: _displaySize.width,
      height: height * multiplier * ratio,
      x: size.x * ratio,
      y: size.y * ratio,
      maxX: _displaySize.width,
      maxY: (height - Math.abs(bottom)) * multiplier * ratio
    };

    return [
      normalizeResizedImage(
        image,
        uri,
        size.width,
        size.height,
        image.image.duration,
        []
      ),
      croppedSize
    ];
  }

  const croppedSize = displaySize || { width: size.width, height: size.height };

  return PhotoEditor.batch(uri, [], size, croppedSize, 100, "image/webp").then(
    newUri => {
      return [
        normalizeResizedImage(
          image,
          newUri,
          croppedSize.width,
          croppedSize.height,
          image.image.duration
        ),
        croppedSize
      ];
    }
  );
};

export function calculateAspectRatioFit(
  srcWidth,
  srcHeight,
  maxWidth,
  maxHeight
) {
  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

  return { width: srcWidth * ratio, height: srcHeight * ratio };
}
