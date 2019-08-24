import path from "path";
import RNFetchBlob from "rn-fetch-blob";
import { Image, ImageEditor } from "react-native";

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
  y,
  x = 0,
  originalWidth,
  originalHeight
}) => {
  const multiplier = originalWidth / width;

  const uri = await getLocalURI(_uri);

  const cropDimensions = {
    size: {
      width: width * multiplier,
      height: height * multiplier
    },
    offset: {
      y: y * multiplier,
      x: x * multiplier
    },
    resizeMode: "stretch"
  };

  console.log(cropDimensions);

  return new Promise((resolve, reject) => {
    ImageEditor.cropImage(
      uri,
      cropDimensions,
      newUri => {
        console.log("HI");
        return resolve({
          ...Image.resolveAssetSource({
            uri: newUri,
            width: cropDimensions.size.width,
            height: cropDimensions.size.height
          }),
          ...cropDimensions.offset
        });
      },
      err => {
        console.warn(err);
        reject(err);
      }
    );
  });
};
