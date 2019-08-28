import path from "path";
import RNFetchBlob from "rn-fetch-blob";
import { Image, ImageEditor, PixelRatio } from "react-native";
import RNFS from "react-native-fs";
import PhotoEditor, { MimeType } from "react-native-photo-manipulator";

export const convertLocalIdentifierToAssetLibrary = (localIdentifier, ext) => {
  const hash = localIdentifier.split("/")[0];
  return `assets-library://asset/asset.${ext}?id=${hash}&ext=${ext}`;
};

const getAssetFileAbsolutePath = async assetPath => {
  const dest = `${RNFS.TemporaryDirectoryPath}${Math.random()
    .toString(36)
    .substring(7)}.png`;

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

  return RNFetchBlob.config({
    fileCache: true,
    // by adding this option, the temp files will have a file extension
    appendExt: path.extname(uri)
  })
    .fetch("GET", uri)
    .then(res => {
      return res.path();
    });
};

export const resizeImage = async ({
  uri: _uri,
  width,
  height,
  top = 0,
  bottom = 0,
  x = 0,
  originalWidth,
  originalHeight,
  displaySize
}) => {
  const multiplier = originalWidth / width;

  const uri = await getLocalURI(_uri);

  const size = {
    width: width * multiplier,
    height: (height - Math.abs(bottom)) * multiplier,
    y: top * multiplier,
    x: x * multiplier
  };

  return PhotoEditor.crop(
    uri,
    size,
    displaySize || { width: size.width, height: size.height },
    "image/png"
  ).then(newUri => {
    const source = Image.resolveAssetSource({
      uri: newUri,
      width: size.width,
      height: size.height
    });
    return {
      ...size,
      ...source,
      source,
      uri: newUri
    };
  });
};
