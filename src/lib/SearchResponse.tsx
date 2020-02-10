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

// const URL = "https://st8j1p5h5j.execute-api.us-east-1.amazonaws.com/prod/s";
const URL =
  "https://us-central1-kapwing-181323.cloudfunctions.net/image_search";

const normalizeSearchResponse = (
  result: ImageSearchResponse.Result
): YeetImageContainer => {
  const { width = 0, height = 0, url, mime: format } = result;

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
    __typename: "YeetImageContainer",
    timestamp: null
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
  // const params = {
  //   q: query,
  //   limit,
  //   offset
  // };

  const params = { query };
  if (transparent) {
    // params.transparent = 1;
  }

  const url = URL;

  return fetch(
    "https://us-central1-kapwing-181323.cloudfunctions.net/image_search",
    {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: {
        "content-type": "application/json",
        referer: "https://www.kapwing.com/studio/editor/overlay/search",
        origin: "https://www.kapwing.com",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36"
      }
    }
  )
    .then(resp => resp.json())
    .then(json => {
      if (!json?.images) {
        return { query, results: [] };
      }

      return {
        query,
        results: json.images.map(normalizeSearchResponse)
      };
    });

  // return fetch(url, {
  //   method: "POST",
  //   body: JSON.stringify(params),
  //   credentials: "include",
  //   headers: {
  //     referer: "https://www.kapwing.com/studio/editor/overlay/search",
  //     origin: "https://www.kapwing.com",
  //     "sec-fetch-dest": "empty",
  //     "sec-fetch-mode": "cors",
  //     "sec-fetch-site": "cross-site",
  //     "user-agent":
  //       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36"
  //   }
  // })
  //   .then(resp => {
  //     console.log(resp.status);
  //     return resp.json();
  //   }, console.error)
  //   .then((json: ImageSearchResponse.RootObject) => {
  //     const { images: results } = json;
  //     console.log(json);
  //     return {
  //       query,
  //       results: results.map(normalizeSearchResponse)
  //     };
  //   }, console.error);
};
