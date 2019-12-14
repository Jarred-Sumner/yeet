import qs from "qs";
import {
  YeetImage,
  mimeTypeFromFilename,
  ImageSourceType,
  YeetImageContainer,
  MIME_TYPE_MAPPING
} from "./imageSearch";
import { debounce } from "lodash";

declare namespace ImageSearchResponse {
  export interface Result {
    format: string;
    height: number;
    source: string;
    url: string;
    width: number;
  }

  export interface RootObject {
    query: string;
    results: Result[];
  }
}

const URL = "https://st8j1p5h5j.execute-api.us-east-1.amazonaws.com/prod/s";

const normalizeSearchResponse = (
  result: ImageSearchResponse.Result
): YeetImageContainer => {
  const { width = 0, height = 0, url, format } = result;

  const image: YeetImage = {
    __typename: "YeetImage",
    mimeType:
      MIME_TYPE_MAPPING[format] || mimeTypeFromFilename(url) || "image/jpeg",
    width,
    height,
    duration: 0,
    uri: url,
    transform: [],
    source: ImageSourceType.search
  };

  return {
    id: `search/${url}`,
    source: result,
    preview: image,
    image,
    sourceType: ImageSourceType.search,
    __typename: "YeetImageContainer"
  };
};

export type YeetImageSearchResponse = {
  results: Array<YeetImageContainer>;
  query: string;
};

export const performSearch = ({
  query,
  transparent = false,
  limit = 60,
  offset = 0
}: {
  query: string;
  transparent: boolean;
  limit: number;
  offset: number;
}): Promise<YeetImageSearchResponse> => {
  const params = {
    q: query,
    limit,
    offset
  };

  console.log({ transparent });

  if (transparent) {
    params.transparent = 1;
  }

  const url = `${URL}?${qs.stringify(params)}`;

  return fetch(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(resp => resp.json())
    .then((json: ImageSearchResponse.RootObject) => {
      const { results, query } = json;
      return {
        query,
        results: results.map(normalizeSearchResponse)
      };
    });
};
