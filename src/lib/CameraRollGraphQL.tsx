import CameraRoll from "@react-native-community/cameraroll";
import {
  imageContainerFromCameraRoll,
  searchPhrase,
  getTrending,
  ImageSearchResponse,
  YeetImageContainer
} from "./imageSearch";

const graphqlImageContainer = (
  image: YeetImageContainer
): YeetImageContainer => {
  return {
    ...image,
    __typename: "YeetImageContainer",
    preview: image.preview ?? image.image
  };
};

export default {
  Query: {
    cameraRoll: async (_, args = {}, { cache, getCacheKey }) => {
      const { assetType, first, mediaSubtypes, after } = args;

      const params = {
        assetType: assetType,
        first: first ?? 0,
        mediaSubtypes,
        after
      };

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
