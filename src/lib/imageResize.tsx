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

export function calculateAspectRatioFit(
  srcWidth,
  srcHeight,
  maxWidth,
  maxHeight
) {
  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

  return { width: srcWidth * ratio, height: srcHeight * ratio };
}
