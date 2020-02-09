import { NetworkStatus } from "apollo-client";
import { uniqBy } from "lodash";
import * as React from "react";
import { useLazyQuery } from "react-apollo";
import {
  PostSearchQuery,
  PostSearchQueryVariables
} from "../../../lib/graphql/PostSearchQuery";
import POST_SEARCH_QUERY from "../../../lib/PostSearchQuery.graphql";
import { ScrollDirection } from "../../FastList";
import { MEMES_COLUMN_COUNT } from "../COLUMN_COUNT";
import {
  buildPostValue,
  GalleryFilterListComponent,
  getInitialLimit,
  getPaginatedLimit
} from "../GalleryFilterList";
import { MemeFilterControl, MemeFilterType } from "../SegmentFilterControl";
import { MEMES_ITEM_HEIGHT, MEMES_ITEM_WIDTH } from "../sizes";
import { GallerySectionItem } from "../../NewPost/ImagePicker/GallerySectionItem";

export const MemesFilterList = ({
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

  const [loadMemes, memesQuery] = useLazyQuery<
    PostSearchQuery,
    PostSearchQueryVariables
  >(POST_SEARCH_QUERY, {
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
    if (isFocused && typeof loadMemes === "function") {
      loadMemes();
    }
  }, [loadMemes, isFocused, otherProps?.offset]);

  const data = React.useMemo(() => {
    return buildPostValue(memesQuery?.data?.searchPosts?.data);
  }, [memesQuery?.data, memesQuery?.networkStatus]);

  const handleEndReached = React.useCallback(
    args => {
      const { networkStatus, loading } = memesQuery;
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
          (memesQuery?.data?.searchPosts?.hasMore ?? false) &&
          networkStatus !== NetworkStatus.fetchMore &&
          typeof memesQuery?.fetchMore === "function"
        )
      ) {
        return;
      }

      const offset =
        memesQuery?.data?.searchPosts?.offset +
        memesQuery?.data?.searchPosts?.limit;

      const limit = getPaginatedLimit(MEMES_COLUMN_COUNT, MEMES_ITEM_HEIGHT);

      return memesQuery.fetchMore({
        variables: {
          query,
          offset,
          limit
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const queryUPdate = {
            ...fetchMoreResult,
            searchPosts: {
              ...fetchMoreResult.searchPosts,
              data: uniqBy(
                previousResult.searchPosts.data.concat(
                  fetchMoreResult.searchPosts.data
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
    [memesQuery?.networkStatus, memesQuery?.fetchMore, memesQuery?.data]
  );

  return (
    <>
      <GalleryFilterListComponent
        {...otherProps}
        data={data}
        offset={offset}
        onRefresh={memesQuery?.refetch}
        itemHeight={MEMES_ITEM_HEIGHT}
        itemWidth={MEMES_ITEM_WIDTH}
        numColumns={MEMES_COLUMN_COUNT}
        scrollY={scrollY}
        listKey={GallerySectionItem.memes}
        onEndReached={handleEndReached}
        isModal={isModal}
        insetValue={insetValue}
        isFocused={isFocused}
        paused
        hasNextPage={memesQuery?.data?.searchPosts?.hasMore ?? false}
        networkStatus={memesQuery.networkStatus}
      />

      <MemeFilterControl
        isModal={isModal}
        value={filter}
        onChange={onChangeFilter}
      />
    </>
  );
};
