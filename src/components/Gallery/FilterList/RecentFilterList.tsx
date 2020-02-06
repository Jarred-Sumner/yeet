import { NetworkStatus } from "apollo-client";
import * as React from "react";
import { useQuery } from "react-apollo";
import RECENT_IMAGES_QUERY from "../../../lib/RecentImages.local.graphql";
import { COLUMN_COUNT } from "../COLUMN_COUNT";
import {
  buildValue,
  GalleryFilterListComponent,
  getPaginatedLimit,
  postToCell,
  _buildValue
} from "../GalleryFilterList";
import { SQUARE_ITEM_HEIGHT, SQUARE_ITEM_WIDTH } from "../sizes";
import { buildPost } from "../../../lib/buildPost";

export const RecentFilterList = ({
  isFocused,
  inset,
  offset,
  isModal,
  autoFocus,
  show = true,
  defaultTransparent = false,
  insetValue,
  keyboardVisibleValue,
  scrollY,
  query = "",
  ...otherProps
}) => {
  const filterListRef = React.useRef(null);

  const recentImagesQuery = useQuery(RECENT_IMAGES_QUERY, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    variables: {
      query: String(query).trim()
    },
    notifyOnNetworkStatusChange: true
  });

  const data = React.useMemo(() => {
    const images = recentImagesQuery?.data?.recentImages?.data;

    if (typeof images !== "undefined") {
      return images.map(row => {
        if (row.post) {
          return postToCell(row.post);
        } else {
          return _buildValue(row.image);
        }
      });
    } else {
      return [];
    }
  }, [recentImagesQuery?.data]);

  const handleEndReached = React.useCallback(() => {
    const { networkStatus, loading } = recentImagesQuery;

    if (loading === true) {
      return;
    }

    if (
      !(
        networkStatus !== NetworkStatus.fetchMore &&
        typeof recentImagesQuery?.fetchMore === "function"
      )
    ) {
      return;
    }

    const limit = getPaginatedLimit(COLUMN_COUNT, SQUARE_ITEM_HEIGHT);
    return;

    return recentImagesQuery.fetchMore({
      variables: {
        offset: recentImagesQuery.data.page_info.offset + 20,
        query,
        limit
      },
      updateQuery: (
        previousResult,
        { fetchMoreResult }: { fetchMoreResult }
      ) => {
        return {
          ...fetchMoreResult,
          images: {
            ...fetchMoreResult.images,
            data: previousResult.images.data.concat(fetchMoreResult.images.data)
          }
        };
      }
    });
  }, [
    recentImagesQuery?.networkStatus,
    recentImagesQuery?.fetchMore,
    recentImagesQuery?.data,
    recentImagesQuery?.data?.recentImages?.page_info?.offset
  ]);

  return (
    <GalleryFilterListComponent
      {...otherProps}
      data={data}
      offset={0}
      onRefresh={recentImagesQuery?.refetch}
      itemHeight={SQUARE_ITEM_HEIGHT}
      itemWidth={SQUARE_ITEM_WIDTH}
      numColumns={COLUMN_COUNT}
      headerHeight={0}
      paused={!isFocused}
      resizeMode="aspectFit"
      scrollY={scrollY}
      onEndReached={handleEndReached}
      isModal={isModal}
      ref={filterListRef}
      insetValue={insetValue}
      listKey="recent"
      isFocused={isFocused}
      hasNextPage={
        recentImagesQuery?.data?.recentImages?.page_info?.has_next_page ?? false
      }
      networkStatus={recentImagesQuery.networkStatus}
    />
  );
};
