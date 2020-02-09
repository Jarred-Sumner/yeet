import { NetworkStatus } from "apollo-client";
import * as React from "react";
import { useQuery } from "react-apollo";
import { uniqBy } from "lodash";
import RECENT_IMAGES_QUERY from "../../../lib/RecentImages.local.graphql";
import { COLUMN_COUNT } from "../COLUMN_COUNT";
import {
  buildValue,
  GalleryFilterListComponent,
  getPaginatedLimit,
  postToCell,
  _buildValue,
  getInitialLimit
} from "../GalleryFilterList";
import { SQUARE_ITEM_HEIGHT, SQUARE_ITEM_WIDTH } from "../sizes";
import { buildPost } from "../../../lib/buildPost";
import { RecentlyUsedContentType } from "../../../lib/db/models/RecentlyUsedContent";
import { ScrollDirection } from "../../FastList";
import { GallerySectionItem } from "../../NewPost/ImagePicker/GallerySectionItem";

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
    fetchPolicy: "network-only",
    variables: {
      query: String(query).trim(),
      limit: getInitialLimit(COLUMN_COUNT, SQUARE_ITEM_HEIGHT),
      offset: 0,
      contentType: isModal ? RecentlyUsedContentType.image : null
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
  }, [recentImagesQuery?.data, postToCell, _buildValue]);

  const handleEndReached = React.useCallback(
    ({ nativeEvent: { direction } }) => {
      const { networkStatus, loading } = recentImagesQuery;

      if (loading === true) {
        return;
      }

      if (
        !(
          networkStatus !== NetworkStatus.fetchMore &&
          typeof recentImagesQuery?.fetchMore === "function"
        ) ||
        direction !== ScrollDirection.down
      ) {
        return;
      }

      const limit = getPaginatedLimit(COLUMN_COUNT, SQUARE_ITEM_HEIGHT);

      return recentImagesQuery.fetchMore({
        variables: {
          offset: recentImagesQuery?.data?.recentImages?.page_info?.offset ?? 0,
          query,
          limit
        },
        updateQuery: (
          previousResult,
          { fetchMoreResult }: { fetchMoreResult }
        ) => {
          return {
            ...fetchMoreResult,
            recentImages: {
              ...fetchMoreResult.recentImages,
              data: uniqBy(
                previousResult.recentImages.data.concat(
                  fetchMoreResult.recentImages.data
                ),
                "id"
              )
            }
          };
        }
      });
    },
    [
      recentImagesQuery?.networkStatus,
      recentImagesQuery?.fetchMore,
      recentImagesQuery?.data,
      recentImagesQuery?.data?.recentImages?.page_info?.offset
    ]
  );

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
      listKey={GallerySectionItem.recent}
      isFocused={isFocused}
      hasNextPage={
        recentImagesQuery?.data?.recentImages?.page_info?.has_next_page ?? false
      }
      networkStatus={recentImagesQuery.networkStatus}
    />
  );
};
