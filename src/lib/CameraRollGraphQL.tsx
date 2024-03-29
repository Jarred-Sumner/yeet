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
import { uniqBy, capitalize, get, map } from "lodash";
import { performSearch } from "./SearchResponse";
import { downloadLink } from "./LinkDownloader";
import Storage, { fetchRecentlyUsedContent } from "./Storage";
import { Platform } from "react-native";
import { check, PERMISSIONS, request, RESULTS } from "react-native-permissions";
import memoizee from "memoizee";

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
  const preview = image.preview ?? image.image;
  return {
    ...image,
    __typename: "YeetImageContainer",
    preview,
    timestamp: preview.timestamp || null
  };
};

export default {
  Query: {
    cameraRoll: async (_, args = {}, { cache, getCacheKey }) => {
      const {
        assetType,
        first,
        mediaSubtypes,
        after,
        offset = 0,
        album,
        width,
        height,
        contentMode = "aspectFill",
        cache: shouldCache = true
      } = args;

      const params = {
        assetType: capitalize(assetType),
        first: first ?? 0,
        offset,
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

        console.time("Get Photos");

        const _offset = Math.max(offset, 0);

        const result = global.MediaPlayerViewManager.getPhotos({
          mediaType: assetType,
          albumId: album,
          offset: _offset,
          length: first,
          size: {
            width,
            height
          },
          contentMode,
          cache: shouldCache
        });
        console.timeEnd("Get Photos");

        const id = `cameraroll_${[
          params.assetType,
          mediaSubtypes,
          _offset,
          album,
          first
        ].join("/")}`;

        const response = {
          __typename: "CameraRollResult",
          page_info: {
            ...result.page_info,
            __typename: "PageInfo",
            offset: Math.max(result.page_info.offset, 0),
            id: `${id}-pageinfo`
          },
          id,
          album: result.album,
          sessionId: result.sessionId,
          data: result.data.map(edge =>
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
      const { limit = 50, offset = 0, contentType = null } = args;
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
      try {
        console.time("Recent images");
        const [data, count] = await fetchRecentlyUsedContent(
          limit,
          offset,
          contentType
        );
        const _offset = offset + data.length;
        console.timeEnd("Recent images");
        const id = `recent-images-${limit}-${offset}-${contentType}`;
        return {
          __typename: "RecentImageSearchResponse",
          id: id,
          data,
          page_info: {
            __typename: "PageInfo",
            has_next_page: count > _offset,
            offset: _offset,
            limit: data.length,
            id: `${id}_pageinfo`
          }
        };
      } catch (exception) {
        console.error(exception);
      }
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
