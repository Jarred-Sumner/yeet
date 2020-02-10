import { NetworkStatus } from "apollo-client";
import * as React from "react";
import { useLazyQuery } from "react-apollo";
import { StyleSheet, View } from "react-native";
import { SCREEN_DIMENSIONS, BOTTOM_Y } from "../../../config";
import {
  PostSearchQuery,
  PostSearchQueryVariables
} from "../../lib/graphql/PostSearchQuery";
import IMAGE_SEARCH_QUERY from "../../lib/ImageSearchQuery.local.graphql";
import POST_SEARCH_QUERY from "../../lib/PostSearchQuery.graphql";
import FastList from "../FastList";
import { GallerySectionItem } from "../NewPost/ImagePicker/GallerySectionItem";
import { COLUMN_COUNT, COLUMN_GAP } from "./COLUMN_COUNT";
import {
  buildPostValue,
  GalleryFilterListComponent,
  getInitialLimit
} from "./GalleryFilterList";
import { GalleryRow } from "./GalleryItem";
import { SQUARE_ITEM_HEIGHT, SQUARE_ITEM_WIDTH } from "./sizes";
import { COLORS } from "../../lib/styles";

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    backgroundColor: COLORS.primaryDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 0,
    overflow: "hidden",
    position: "relative"
  },
  list: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible"
  }
});

const SCROLL_INSETS = { top: 0, left: 0, right: 1, bottom: 0 };

const GallerySearchListComponent = ({
  itemWidth,
  itemHeight,
  columnCount,
  ListEmptyComponent,
  sections,
  scrollY,
  height,
  listKey,
  onPress,
  inset,
  bottomInset = 0,
  isModal,
  offset,
  networkStatus,
  headerHeight,
  renderHeader,
  ...otherProps
}) => {
  const sectionCounts = React.useMemo(
    () => [
      Math.ceil(sections[0].length / columnCount),
      Math.ceil(sections[1].length / columnCount)
    ],
    [sections, columnCount]
  );

  const chunkedSections = React.useMemo(
    () => [
      GalleryFilterListComponent.getSections(sections[0], columnCount),
      GalleryFilterListComponent.getSections(sections[1], columnCount)
    ],
    [GalleryFilterListComponent.getSections, sections, columnCount]
  );

  const renderRow = React.useCallback(
    (section: number, row: number) => {
      const columns = chunkedSections[section][row];

      return (
        <GalleryRow
          numColumns={columnCount}
          width={itemWidth}
          height={itemHeight}
          first={columns[0]}
          selectedIDs={[]}
          second={columns[1]}
          onPress={onPress}
          paused
          third={columns[2]}
        />
      );
    },
    [chunkedSections, itemHeight, itemWidth, columnCount, onPress]
  );

  const contentInset = React.useMemo(
    () => ({
      top: inset || 0,
      left: 0,
      right: 0,
      bottom: Math.abs((bottomInset * -1 + (isModal ? 0 : BOTTOM_Y)) * -1)
    }),
    [inset, bottomInset, isModal]
  );
  const contentOffset = React.useMemo(
    () => ({
      y: offset || 0,
      x: 0
    }),
    [offset]
  );

  return (
    <View height={height} style={styles.container}>
      <FastList
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        contentInset={contentInset}
        contentOffset={contentOffset}
        insetBottom={Math.abs(contentInset.bottom) * -1}
        insetTop={contentInset.top}
        scrollTopValue={scrollY}
        scrollIndicatorInsets={SCROLL_INSETS}
        // renderHeader={this.props.renderHeader}
        automaticallyAdjustContentInsets={false}
        keyboardShouldPersistTaps="always"
        isLoading={
          networkStatus === NetworkStatus.loading ||
          networkStatus === NetworkStatus.refetch ||
          networkStatus === NetworkStatus.fetchMore
        }
        renderRow={renderRow}
        containerHeight={height}
        scrollToOverflowEnabled
        overScrollMode="automatic"
        scrollTopValue={scrollY}
        footerHeight={0}
        isFastList
        headerHeight={headerHeight}
        renderHeader={renderHeader}
        style={styles.list}
        // onScrollEnd={this.handleScrollEnd}
        isFastList
        listKey={listKey}
        renderEmpty={ListEmptyComponent}
        rowHeight={itemHeight + COLUMN_GAP}
        // sectionHeight={this.getTotalHeight}
        sections={sectionCounts}
      />
    </View>
  );
};

export const GallerySearchList = ({
  query,
  isFocused,
  inset,
  offset,
  isModal,
  insetValue,
  keyboardVisibleValue,

  scrollY,
  ...otherProps
}) => {
  const [loadMemes, memesQuery] = useLazyQuery<
    PostSearchQuery,
    PostSearchQueryVariables
  >(POST_SEARCH_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      query,
      limit: getInitialLimit(COLUMN_COUNT, SQUARE_ITEM_HEIGHT),
      offset: 0,
      latest: true
    },
    notifyOnNetworkStatusChange: true
  });

  const [loadImages, imagesQuery] = useLazyQuery(IMAGE_SEARCH_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      query,
      limit: getInitialLimit(COLUMN_COUNT, SQUARE_ITEM_HEIGHT),
      offset: 0
    },
    notifyOnNetworkStatusChange: true
  });

  React.useEffect(() => {
    if (isFocused && typeof loadMemes === "function") {
      loadMemes();
    }
  }, [loadMemes, isFocused]);

  React.useEffect(() => {
    if (isFocused && typeof loadImages === "function") {
      loadImages();
    }
  }, [loadImages, isFocused]);

  const memes = React.useMemo(() => {
    return buildPostValue(memesQuery?.data?.searchPosts?.data);
  }, [memesQuery?.data, memesQuery?.networkStatus]);

  const images = React.useMemo(() => {
    return buildPostValue(imagesQuery?.data?.images?.data);
  }, [imagesQuery?.data, imagesQuery?.networkStatus]);

  const sections = React.useMemo(() => [memes, images], [memes, images]);

  // const handleEndReached = React.useCallback(
  //   args => {
  //     const { networkStatus, loading } = memesQuery;
  //     console.time("Fetch More");
  //     if (loading === true) {
  //       return;
  //     }

  //     const { direction } = args?.nativeEvent ?? {};

  //     if (direction !== ScrollDirection.down) {
  //       return;
  //     }

  //     if (
  //       !(
  //         (memesQuery?.data?.searchPosts?.hasMore ?? false) &&
  //         networkStatus !== NetworkStatus.fetchMore &&
  //         typeof memesQuery?.fetchMore === "function"
  //       )
  //     ) {
  //       return;
  //     }

  //     const offset =
  //       memesQuery?.data?.searchPosts?.offset +
  //       memesQuery?.data?.searchPosts?.limit;

  //     const limit = getPaginatedLimit(MEMES_COLUMN_COUNT, MEMES_ITEM_HEIGHT);

  //     return memesQuery.fetchMore({
  //       variables: {
  //         query,
  //         offset,
  //         limit
  //       },
  //       updateQuery: (previousResult, { fetchMoreResult }) => {
  //         const queryUPdate = {
  //           ...fetchMoreResult,
  //           searchPosts: {
  //             ...fetchMoreResult.searchPosts,
  //             data: uniqBy(
  //               previousResult.searchPosts.data.concat(
  //                 fetchMoreResult.searchPosts.data
  //               ),
  //               "id"
  //             )
  //           }
  //         };
  //         console.timeEnd("Fetch More");
  //         return queryUPdate;
  //       }
  //     });
  //   },
  //   [memesQuery?.networkStatus, memesQuery?.fetchMore, memesQuery?.data]
  // );

  return (
    <GallerySearchListComponent
      columnCount={COLUMN_COUNT}
      itemWidth={SQUARE_ITEM_WIDTH}
      itemHeight={SQUARE_ITEM_HEIGHT}
      inset={inset}
      offset={offset}
      listKey={GallerySectionItem.search}
      networkStatus={imagesQuery.networkStatus}
      scrollY={scrollY}
      isFocused={isFocused}
      sections={sections}
      {...otherProps}
    />
  );
};
