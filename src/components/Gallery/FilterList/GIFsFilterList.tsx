import { NetworkStatus } from "apollo-client";
import * as React from "react";
import { useLazyQuery } from "react-apollo";
import GIFS_QUERY from "../../../lib/GIFSearchQuery.local.graphql";
import { GIF_COLUMN_COUNT } from "../COLUMN_COUNT";
import {
  buildValue,
  GalleryFilterListComponent,
  getInitialLimit,
  getPaginatedLimit
} from "../GalleryFilterList";
import { HORIZONTAL_ITEM_HEIGHT, HORIZONTAL_ITEM_WIDTH } from "../sizes";

export const GIFsFilterList = ({
  isFocused,
  inset,
  offset,
  isModal,
  insetValue,
  keyboardVisibleValue,
  scrollY,
  query = "",
  ...otherProps
}) => {
  const [loadGifs, gifsQuery] = useLazyQuery(GIFS_QUERY, {
    variables: {
      query,
      limit: getInitialLimit(GIF_COLUMN_COUNT, HORIZONTAL_ITEM_HEIGHT)
    },
    notifyOnNetworkStatusChange: true
  });

  React.useEffect(() => {
    if (isFocused && typeof loadGifs === "function") {
      loadGifs();
    }
  }, [loadGifs, isFocused]);

  const data = React.useMemo(() => {
    return buildValue(gifsQuery?.data?.gifs?.data);
  }, [gifsQuery?.data, gifsQuery?.networkStatus]);

  const handleEndReached = React.useCallback(() => {
    const { networkStatus, loading } = gifsQuery;

    if (loading === true) {
      return;
    }

    if (
      !(
        (gifsQuery?.data?.gifs?.page_info?.has_next_page ?? false) &&
        networkStatus !== NetworkStatus.fetchMore &&
        typeof gifsQuery?.fetchMore === "function"
      )
    ) {
      return;
    }

    return gifsQuery.fetchMore({
      variables: {
        offset: gifsQuery.data.gifs.page_info.offset,
        query,
        limit: getPaginatedLimit(GIF_COLUMN_COUNT, HORIZONTAL_ITEM_HEIGHT)
      },
      updateQuery: (
        previousResult,
        { fetchMoreResult }: { fetchMoreResult }
      ) => {
        return {
          ...fetchMoreResult,
          gifs: {
            ...fetchMoreResult.gifs,
            data: previousResult.gifs.data.concat(fetchMoreResult.gifs.data)
          }
        };
      }
    });
  }, [gifsQuery?.networkStatus, gifsQuery?.fetchMore, gifsQuery?.data]);

  return (
    <GalleryFilterListComponent
      {...otherProps}
      data={data}
      offset={0}
      onRefresh={gifsQuery?.refetch}
      itemHeight={HORIZONTAL_ITEM_HEIGHT}
      itemWidth={HORIZONTAL_ITEM_WIDTH}
      numColumns={GIF_COLUMN_COUNT}
      scrollY={scrollY}
      listKey="gifs"
      paused={!isFocused}
      onEndReached={handleEndReached}
      isModal={isModal}
      insetValue={insetValue}
      inset={0}
      isFocused={isFocused}
      hasNextPage={gifsQuery?.data?.gifs?.page_info?.has_next_page ?? false}
      networkStatus={gifsQuery.networkStatus}
    />
  );
};
