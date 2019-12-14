import { YoutubeDLResponse } from "./YoutubeDLResponse";
import { orderBy, sortBy } from "lodash";
import qs from "qs";
import {
  YeetImage,
  mimeTypeFromFilename,
  ImageSourceType,
  YeetImageContainer,
  mediaSourceFromSource,
  ImageMimeType,
  imageFromMediaSource,
  extensionByMimeType
} from "./imageSearch";
import { GenericeExtractorResponse } from "./GenericExtractorResponse";

export declare module OpenGraphResponse {
  export interface Result {
    descrpition: string;
    image: string;
    title: string;
  }

  export interface RootObject {
    result: Result;
    success: boolean;
    type: number;
  }
}

const LINK_DOWNLOAD_URL =
  "https://hh8hic8tk3.execute-api.us-east-1.amazonaws.com/prod/a/";

export enum LinkResponseType {
  youtube_dl = 0,
  opengraph = 1
}

type LinkResponse = YoutubeDLResponse.RootObject | OpenGraphResponse.RootObject;

export const downloadLink = (
  url: string
): Promise<YeetImageContainer | null> => {
  return fetch(`${LINK_DOWNLOAD_URL}?${qs.stringify({ url })}`)
    .then(resp => resp.json())
    .then(normalizeDownloadLink);
};

export const normalizeDownloadLink = (
  response: LinkResponse
): YeetImageContainer | null => {
  if (!response?.success || typeof response?.type !== "number") {
    return null;
  }

  if (response.type === LinkResponseType.opengraph) {
    const result = response.result as OpenGraphResponse.Result;
    return normalizeOpenGraphResponse(result);
  } else if (
    response.type === LinkResponseType.youtube_dl &&
    response?.result?.extractor_key === "Generic"
  ) {
    return normalizeGenericExtractor(response.result);
  } else {
    return normalizeYoutubeDLResponse(response.result);
  }
};

const normalizeOpenGraphResult = ({
  image: url
}: OpenGraphResponse.Result): YeetImage => {
  const assetData = {
    uri: url,
    width: 0,
    height: 0
  };
  return {
    ...assetData,
    duration: 0,
    mimeType: mimeTypeFromFilename(assetData.uri) || "image/jpeg",
    source: ImageSourceType.search,
    __typename: "YeetImage",
    transform: []
  };
};

const normalizeOpenGraphResponse = (
  result: OpenGraphResponse.Result
): YeetImageContainer => {
  const { image: url } = result;
  const image = mediaSourceFromSource(
    {
      uri: url
    },
    {
      width: -1,
      height: -1,
      x: 0,
      y: 0
    }
  );

  return {
    id: url,
    source: result,
    preview: image,
    image,
    sourceType: ImageSourceType.opengraph,
    __typename: "YeetImageContainer"
  };
};

const normalizeGenericExtractor = (
  result: GenericeExtractorResponse.Result
): YeetImageContainer => {
  const { image: url, id, width = -1, height = -1, duration = 0 } = result;
  const image = imageFromMediaSource({
    url: url,
    width,
    height,
    mimeType: mimeTypeFromFilename(result.ext || result.url),
    duration
  });

  return {
    id: id || url,
    source: result,
    preview: image,
    image,
    sourceType: ImageSourceType.search,
    __typename: "YeetImageContainer"
  };
};

const SUPPORTED_VIDEO_CODECS = [
  "avc1.42001e",
  "avc1.66.30",
  "avc1.42001f",
  "avc1.4d001e",
  "avc1.77.30",
  "avc1.4d001f",
  "avc1.4d0028",
  "avc1.64001f",
  "avc1.640028",
  "avc1.640029"
];

const SUPPORTED_AUDIO_CODECS = ["mp4a.40.2", "mp4a.40.5", "mp4a.40.34"];
const isAudioSupported = (format: YoutubeDLResponse.Format) => {
  if (format.acodec === "none") {
    return false;
  }

  if (format.format.includes("hls")) {
    return true;
  }

  return SUPPORTED_AUDIO_CODECS.includes(format.format);
};

const isVideoSupported = (format: YoutubeDLResponse.Format) => {
  if (format.vcodec === "none") {
    return false;
  }

  if (format.format.includes("hls") && !/audio\s?only/i.test(format.format)) {
    return true;
  }

  return SUPPORTED_VIDEO_CODECS.includes(format.format);
};

const chooseBestVideo = (formats: Array<YoutubeDLResponse.Format>) => {
  const biggestVideos = orderBy(formats, ["width", "desc"]);

  const largestNon1080pVideoWithAudio = biggestVideos.find(format => {
    const { width, height } = format;

    return (
      isAudioSupported(format) &&
      typeof width === "number" &&
      width < 1920 &&
      typeof height === "number" &&
      height < 1920
    );
  });

  const largestNon1080pVideoWitouthAudio = biggestVideos.find(format => {
    const { width, height } = format;

    return (
      !isAudioSupported(format) &&
      typeof width === "number" &&
      width < 1920 &&
      typeof height === "number" &&
      height < 1920
    );
  });

  return [
    largestNon1080pVideoWithAudio,
    largestNon1080pVideoWitouthAudio,
    ...formats
  ].filter(Boolean)[0];
};

const formatToImage = (
  image: YoutubeDLResponse.Format,
  duration: number = 0,
  audioURI?: string
): YeetImage => {
  const assetData = {
    uri: image.url,
    width: Number(image.width || -1),
    height: Number(image.height || -1)
  };

  return {
    ...assetData,
    duration: Number(duration || 0),
    audioURI: audioURI,
    mimeType: mimeTypeFromFilename(image.ext) || ImageMimeType.mp4,
    source: ImageSourceType.youtube_dl,
    __typename: "YeetImage",
    transform: []
  };
};

const normalizeFormat = (
  result: YoutubeDLResponse.Result,
  format: YoutubeDLResponse.Format,
  audioFormat?: YoutubeDLResponse.Format
): YeetImageContainer => {
  const image = formatToImage(format, result.duration, audioFormat?.url);
  return {
    id: result.id,
    source: result,
    preview:
      typeof result.thumbnail === "string"
        ? mediaSourceFromSource(
            {
              uri: result.thumbnail
            },
            {
              width: -1,
              height: -1,
              x: 0,
              y: 0
            }
          )
        : image,
    image,
    sourceType: ImageSourceType.youtube_dl,
    __typename: "YeetImageContainer"
  };
};

const normalizeYoutubeDLResponse = (
  result: YoutubeDLResponse.Result
): YeetImageContainer | null => {
  const { formats } = result;

  const combinedFormats = formats.filter(format => {
    return isVideoSupported(format) && isAudioSupported(format);
  });

  let bestVideo = chooseBestVideo(combinedFormats);
  let audioFormat = null;

  if (!bestVideo) {
    const videoFormats = formats.filter(isVideoSupported);
    const audioFormats = formats.filter(isAudioSupported);
    audioFormat = audioFormats[0];

    bestVideo = chooseBestVideo(videoFormats);
  }

  if (!bestVideo) {
    return null;
  }

  return normalizeFormat(result, bestVideo, audioFormat?.url);
};
