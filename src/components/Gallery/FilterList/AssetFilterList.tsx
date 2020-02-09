import { NetworkStatus } from "apollo-client";
import { uniqBy } from "lodash";
import * as React from "react";
import { useLazyQuery } from "react-apollo";
import ASSET_SEARCH_QUERY from "../../../lib/AssetSearchQuery.graphql";
import {
  AssetSearchQuery,
  AssetSearchQueryVariables
} from "../../../lib/graphql/AssetSearchQuery";
import { ScrollDirection } from "../../FastList";
import { MEMES_COLUMN_COUNT } from "../COLUMN_COUNT";
import {
  buildMediaValue,
  GalleryFilterListComponent,
  getInitialLimit,
  getPaginatedLimit
} from "../GalleryFilterList";
import { MemeFilterControl, MemeFilterType } from "../SegmentFilterControl";
import { MEMES_ITEM_HEIGHT, MEMES_ITEM_WIDTH } from "../sizes";
import { GallerySectionItem } from "../../NewPost/ImagePicker/GallerySectionItem";

export const AssetsFilterList = ({
  isFocused,
  inset,
  offset,
  isModal,
  insetValue,
  keyboardVisibleValue,
  scrollY,
  query,
  ...otherProps
}) => {
  const [filter, onChangeFilter] = React.useState(MemeFilterType.spicy);

  const [loadAssets, assetsQuery] = useLazyQuery<
    AssetSearchQuery,
    AssetSearchQueryVariables
  >(ASSET_SEARCH_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      query,
      limit: getInitialLimit(MEMES_COLUMN_COUNT, MEMES_ITEM_HEIGHT),
      offset: 0,
      latest: filter === MemeFilterType.recent
    },
    notifyOnNetworkStatusChange: true
  });

  React.useEffect(() => {
    if (isFocused && typeof loadAssets === "function") {
      loadAssets();
    }
  }, [loadAssets, isFocused, otherProps?.offset]);

  const data = React.useMemo(() => {
    return buildMediaValue(assetsQuery?.data?.searchAssets?.data);
  }, [assetsQuery?.data, assetsQuery?.networkStatus]);

  const handleEndReached = React.useCallback(
    args => {
      const { networkStatus, loading } = assetsQuery;
      console.time("Fetch More");
      if (loading === true) {
        return;
      }

      const { direction } = args?.nativeEvent ?? {};

      if (direction !== ScrollDirection.down) {
        return;
      }

      if (
        !(
          (assetsQuery?.data?.searchAssets?.hasMore ?? false) &&
          networkStatus !== NetworkStatus.fetchMore &&
          typeof assetsQuery?.fetchMore === "function"
        )
      ) {
        return;
      }

      const offset =
        assetsQuery?.data?.searchAssets?.offset +
        assetsQuery?.data?.searchAssets?.limit;

      const limit = getPaginatedLimit(MEMES_COLUMN_COUNT, MEMES_ITEM_HEIGHT);

      return assetsQuery.fetchMore({
        variables: {
          query,
          offset,
          limit
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const queryUPdate = {
            ...fetchMoreResult,
            searchAssets: {
              ...fetchMoreResult.searchAssets,
              data: uniqBy(
                previousResult.searchAssets.data.concat(
                  fetchMoreResult.searchAssets.data
                ),
                "id"
              )
            }
          };
          console.timeEnd("Fetch More");
          return queryUPdate;
        }
      });
    },
    [assetsQuery?.networkStatus, assetsQuery?.fetchMore, assetsQuery?.data]
  );

  return (
    <>
      <GalleryFilterListComponent
        {...otherProps}
        data={data}
        offset={offset}
        onRefresh={assetsQuery?.refetch}
        itemHeight={MEMES_ITEM_HEIGHT}
        itemWidth={MEMES_ITEM_WIDTH}
        numColumns={MEMES_COLUMN_COUNT}
        headerHeight={0}
        scrollY={scrollY}
        listKey={GallerySectionItem.assets}
        onEndReached={handleEndReached}
        isModal={isModal}
        insetValue={insetValue}
        isFocused={isFocused}
        paused
        hasNextPage={assetsQuery?.data?.searchAssets?.hasMore ?? false}
        networkStatus={assetsQuery.networkStatus}
      />

      <MemeFilterControl
        isModal={isModal}
        value={filter}
        onChange={onChangeFilter}
      />
    </>
  );
};
