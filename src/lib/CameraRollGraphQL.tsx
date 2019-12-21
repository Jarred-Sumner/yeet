import CameraRoll from "@react-native-community/cameraroll";
import {
  imageContainerFromCameraRoll,
  searchPhrase,
  getTrending,
  ImageSearchResponse,
  YeetImageContainer,
  YeetImage,
  ImageSourceType
} from "./imageSearch";
import { uniqBy, capitalize } from "lodash";
import { performSearch } from "./SearchResponse";
import { downloadLink } from "./LinkDownloader";
import Storage from "./Storage";
import { Platform } from "react-native";
import { check, PERMISSIONS, request, RESULTS } from "react-native-permissions";

let _lastStatus = null;
const ensureExternalStoragePermission = async () => {
  if (_lastStatus) {
    return _lastStatus;
  }

  if (Platform.OS === "android") {
    let status = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);

    if (status === RESULTS.DENIED) {
      status = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
    }

    _lastStatus = status;

    return status;
  }

  return RESULTS.GRANTED;
};

const graphqlImageContainer = (
  image: YeetImageContainer
): YeetImageContainer => {
  return {
    ...image,
    __typename: "YeetImageContainer",
    preview: image.preview ?? image.image
  };
};

const imageToImageContainer = (image: YeetImage): YeetImageContainer => {
  return {
    id: image.id ?? image.uri,
    image,
    preview: image,
    source: image,
    sourceType: ImageSourceType.search,
    __typename: "YeetImageContainer"
  };
};

export default {
  Query: {
    cameraRoll: async (_, args = {}, { cache, getCacheKey }) => {
      const { assetType, first, mediaSubtypes, after } = args;

      const params = {
        assetType: capitalize(assetType),
        first: first ?? 0,
        mediaSubtypes,
        after
      };

      try {
        if (Platform.OS === "android") {
          const status = await ensureExternalStoragePermission();

          if (status === RESULTS.UNAVAILABLE || status === RESULTS.BLOCKED) {
            return {
              __typename: "CameraRollResult",
              page_info: {
                __typename: "PageInfo",
                limit: params.first,
                start_cursor: 0,
                end_cursor: null,
                hasMore: false,
                id: `cameraroll-pageinfo`
              },
              id: "cameraroll__empty",
              data: []
            };
          }
        }
        const result = await CameraRoll.getPhotos(params);
        const id = `cameraroll_${[
          params.assetType,
          params.first,
          mediaSubtypes,
          after
        ].join("/")}`;

        const response = {
          __typename: "CameraRollResult",
          page_info: {
            __typename: "PageInfo",
            start_cursor: 0,
            end_cursor: 0,

            ...result.page_info,
            limit: params.first,
            id: `${id}-pageinfo`
          },
          id,
          data: result.edges.map(edge =>
            graphqlImageContainer(imageContainerFromCameraRoll(edge))
          )
        };

        return response;
      } catch (exception) {
        console.error(exception);
        throw exception;
      }
    },
    resolveMedia: async (_, args = {}, { cache }) => {
      const { url } = args;

      if (
        (url && typeof url === "string" && url.startsWith("https://")) ||
        url.startsWith("http://")
      ) {
        return await downloadLink(url);
      } else {
        return null;
      }
    },
    recentImages: async (_, args = {}, { cache }) => {
      const status = await ensureExternalStoragePermission();
      if (status !== RESULTS.GRANTED) {
        return {
          __typename: "RecentImageSearchResponse",
          id: "empty-recent",
          data: [],
          page_info: {
            __typename: "PageInfo",
            has_next_page: false,
            offset: 0,
            limit: 80,
            id: `empty_-recent_pageinfo`
          }
        };
      }

      const data = await Storage.getRecentlyUsed();
      const id = `recent/${data.map(({ uri }) => uri).join("-")}`;
      return {
        __typename: "RecentImageSearchResponse",
        id: id,
        data: uniqBy(data.map(imageToImageContainer), "id").slice(0, 15),
        page_info: {
          __typename: "PageInfo",
          has_next_page: false,
          offset: 0,
          limit: 80,
          id: `${id}_pageinfo`
        }
      };
    },
    images: async (_, args = {}, { cache }) => {
      const { query = "", limit = 20, offset = 0, transparent } = args;

      const _query = String(query).trim();
      let response: ImageSearchResponse = {
        images: [],
        offset,
        hasMore: false,
        success: false
      };
      if (_query.length > 0) {
        const search = await performSearch({
          query: _query,
          transparent,
          limit,
          offset
        });

        response = {
          images: search.results,
          hasMore: true,
          offset,
          success: !!search?.results
        };
      }

      const id = `images_${query}-${offset}-${limit}-${transparent}`;

      return {
        __typename: "RemoteImageSearchResponse",
        id,
        data: response.images,
        page_info: {
          __typename: "PageInfo",
          has_next_page: true,
          offset: offset,
          limit,
          id: `${id}_pageinfo`
        }
      };
    },
    gifs: async (_, args = {}, { cache }) => {
      const { query = "", limit = 20, offset = 0 } = args;

      const _query = String(query).trim();
      let results: ImageSearchResponse;
      if (_query.length > 0) {
        results = await searchPhrase(query, offset, limit);
      } else {
        results = await getTrending(offset, limit);
      }

      const id = `gif__${query}-${offset}-${limit}`;

      const response = {
        __typename: "GIFSearchResponse",
        id,
        data: results.images.map(graphqlImageContainer),
        page_info: {
          __typename: "PageInfo",
          has_next_page: results.hasMore,
          offset: results.offset,

          limit,
          id: `${id}_pageinfo`
        }
      };

      return response;
    }
  }
};
