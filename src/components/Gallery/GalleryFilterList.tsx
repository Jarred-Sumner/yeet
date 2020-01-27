import useKeyboard from "@rnhooks/keyboard";
import { NetworkStatus } from "apollo-client";
import { memoize, uniqBy } from "lodash";
import * as React from "react";
import { useApolloClient, useLazyQuery, useQuery } from "react-apollo";
import {
  InteractionManager,
  StyleSheet,
  View,
  SegmentedControlIOS,
  LayoutAnimation
} from "react-native";
import Animated, { Transition, Transitioning } from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y, BOTTOM_Y } from "../../../config";
import CameraRollGraphQL from "../../lib/CameraRollGraphQL";
import CAMERA_ROLL_QUERY from "../../lib/CameraRollQuery.local.graphql";
import GIFS_QUERY from "../../lib/GIFSearchQuery.local.graphql";
import {
  YeetImageContainer,
  imageContainerFromMediaSource,
  ImageMimeType
} from "../../lib/imageSearch";
import IMAGE_SEARCH_QUERY from "../../lib/ImageSearchQuery.local.graphql";
import { SPACING } from "../../lib/styles";
import { FlatList } from "../FlatList";
import MediaPlayer from "../MediaPlayer";
import { GallerySectionItem } from "../NewPost/ImagePicker/FilterBar";
import ImageSearch, {
  ImageSearchContext,
  IMAGE_SEARCH_HEIGHT
} from "../NewPost/ImagePicker/ImageSearch";
import GalleryItem, { galleryItemMediaSource } from "./GalleryItem";
import { TransparentToggle } from "./GallerySearchFilter";
import { GalleryValue } from "./GallerySection";
import { GallerySectionList } from "./GallerySectionList";
import POST_SEARCH_QUERY from "../../lib/PostSearchQuery.graphql";
import {
  PostSearchQuery,
  PostSearchQueryVariables,
  PostSearchQuery_searchPosts_data
} from "../../lib/graphql/PostSearchQuery";
import { PostFragment } from "../../lib/graphql/PostFragment";
import {
  CameraRollAssetTypeSwitcher,
  MemeFilterControl,
  MemeFilterType
} from "./SegmentFilterControl";

const COLUMN_COUNT = 3;
const GIF_COLUMN_COUNT = 2;
const MEMES_COLUMN_COUNT = 4;
const COLUMN_GAP = 2;

const SEPARATOR_HEIGHT = COLUMN_GAP * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexShrink: 1,
    width: SCREEN_DIMENSIONS.width,
    overflow: "hidden"
  },
  wrapper: {
    flex: 1,
    flexShrink: 1,
    width: SCREEN_DIMENSIONS.width,
    overflow: "hidden"
  },
  separator: {
    height: SEPARATOR_HEIGHT
  },
  column: {
    justifyContent: "center",
    marginLeft: COLUMN_GAP
  },
  fourColumn: {
    justifyContent: "space-evenly",
    paddingRight: COLUMN_GAP
  },
  item: {
    marginRight: COLUMN_GAP
  },
  fourItem: {
    marginLeft: COLUMN_GAP
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999
  }
});

type GalleryFilter = GallerySectionItem | null;

const ItemSeparatorComponent = () => <View style={styles.separator} />;

type Props = {
  images: Array<GalleryValue>;
  networkStatus: NetworkStatus;
  onRefetch: () => void;
};

export const SQUARE_ITEM_WIDTH =
  SCREEN_DIMENSIONS.width / COLUMN_COUNT - COLUMN_GAP * COLUMN_COUNT;
export const SQUARE_ITEM_HEIGHT = SQUARE_ITEM_WIDTH;

export const VERTICAL_ITEM_HEIGHT = SQUARE_ITEM_WIDTH * (16 / 9);
export const VERTICAL_ITEM_WIDTH = SQUARE_ITEM_WIDTH;

export const HORIZONTAL_ITEM_HEIGHT = 200;
export const HORIZONTAL_ITEM_WIDTH =
  SCREEN_DIMENSIONS.width / GIF_COLUMN_COUNT - COLUMN_GAP * GIF_COLUMN_COUNT;

export const MEMES_ITEM_WIDTH =
  SCREEN_DIMENSIONS.width / MEMES_COLUMN_COUNT -
  COLUMN_GAP * MEMES_COLUMN_COUNT;
export const MEMES_ITEM_HEIGHT =
  SCREEN_DIMENSIONS.width / MEMES_COLUMN_COUNT -
  COLUMN_GAP * MEMES_COLUMN_COUNT;

const getPaginatedLimit = (columnCount: number, height: number) => {
  return (SCREEN_DIMENSIONS.height / height) * columnCount;
};

const getInitialLimit = (columnCount: number, height: number) => {
  return getPaginatedLimit(columnCount, height) * 1.5;
};

class GalleryFilterListComponent extends React.Component<Props> {
  static defaultProps = {
    headerHeight: 0,
    numColumns: COLUMN_COUNT
  };
  constructor(props) {
    super(props);
  }

  setFlatListRef = (flatList: FlatList) => {
    this.flatListRef = flatList;

    const { flatListRef } = this.props;

    if (flatListRef && typeof flatListRef === "function") {
      flatListRef(flatList);
    }
  };

  componentDidUpdate(prevProps) {
    const { data } = this.props;

    if (
      prevProps.data !== data &&
      data.length > 0 &&
      prevProps.data.length > 0 &&
      data[0].id !== prevProps.data[0].id
    ) {
      this.flatListRef.scrollToOffset({
        offset: this.props.offset - (this.props.isModal ? 0 : TOP_Y),
        animated: true
      });
    }
  }

  flatListRef: FlatList | null = null;

  handlePressColumn = (
    image: YeetImageContainer,
    post?: Partial<PostFragment>
  ) => {
    this.props.onPress(image, post);
  };

  renderColumn = ({ item, index }: { item: GalleryValue; index: number }) => {
    return (
      <View style={this.props.numColumns === 4 ? styles.fourItem : styles.item}>
        <GalleryItem
          image={item.image}
          width={this.props.itemWidth}
          height={this.props.itemHeight}
          post={item.post}
          onPress={this.handlePressColumn}
          transparent={this.props.transparent}
          resizeMode={this.props.resizeMode}
          isSelected={this.props.selectedIDs.includes(item.image.id)}
          paused={
            !this.props.isFocused ||
            item.image.image.mimeType === ImageMimeType.jpeg
          }
          id={item.id}
        />
      </View>
    );
  };

  keyExtractor = item => item.id;

  getItemLayout = (_data, index) => {
    const length = this.props.itemHeight;
    const offset =
      this.props.itemHeight * Math.floor(index / this.props.numColumns);

    return {
      length,
      offset,
      index
    };
  };

  contentInset = {
    top: this.props.inset,
    left: 0,
    right: 0,
    bottom: this.props.bottomInset || 0
  };
  contentOffset = {
    y: this.props.offset,
    x: 0
  };

  renderListEmpty = () => {
    const {
      ListEmptyComponent,
      onPressColumn,
      isFocused,
      onChangeFilter,
      selectedIDs
    } = this.props;

    return (
      <ListEmptyComponent
        isFocused={isFocused}
        onPress={this.props.onPress}
        onChangeFilter={onChangeFilter}
        selectedIDs={selectedIDs}
      />
    );
  };

  static stickerHeaderIndices = [0];
  // https://github.com/facebook/react-native/issues/26610
  static scrollIndicatorInsets = { right: 1, left: 0, top: 0, bottom: 0 };
  handleScroll = this.props.scrollY
    ? Animated.event(
        [
          {
            nativeEvent: {
              contentOffset: { y: this.props.scrollY },
              contentInset: { top: this.props.insetValue }
            }
          }
        ],
        { useNativeDriver: true }
      )
    : undefined;

  translateY = this.props.isModal
    ? Animated.interpolate(this.props.scrollY, {
        inputRange: [-200, this.props.inset * -1, 0],
        outputRange: [-200, this.props.inset, 0],
        extrapolateRight: Animated.Extrapolate.CLAMP
      })
    : undefined;

  scrollTop = (animated = true) => {
    this.flatListRef &&
      this.flatListRef.scrollToOffset({
        offset: this.props.isModal
          ? this.contentOffset.y
          : this.contentOffset.y - TOP_Y,
        animated
      });
  };

  onScrollBeginDrag =
    this.props.insetValue &&
    Animated.event(
      [
        {
          nativeEvent: { contentInset: { top: this.props.insetValue } }
        }
      ],
      { useNativeDriver: true }
    );

  listStyle = [styles.container];

  render() {
    const {
      data,
      networkStatus,
      isFocused,
      selectedIDs,
      onRefresh,
      hasNextPage = false,
      removeClippedSubviews,
      numColumns,
      onEndReached,
      simultaneousHandlers,
      ListHeaderComponent,
      isModal,
      stickyHeader,
      scrollY,
      inset,
      ListFooterComponent,
      headerHeight = 0,
      ListEmptyComponent,
      offset,
      ...otherProps
    } = this.props;

    return (
      <>
        <Animated.View
          style={[
            styles.wrapper,
            isModal && {
              transform: [
                {
                  translateY: this.translateY
                }
              ]
            }
          ]}
        >
          {ListHeaderComponent && isModal && (
            <Animated.View
              style={{
                height: headerHeight,
                width: 1,
                transform: [
                  { translateY: Animated.multiply(this.translateY, -1) }
                ]
              }}
            >
              <ListHeaderComponent />
            </Animated.View>
          )}

          <FlatList
            ref={this.setFlatListRef}
            data={data}
            directionalLockEnabled
            nestedScrollEnabled
            bounces
            listKey={this.props.listKey}
            // ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={
              ListEmptyComponent ? this.renderListEmpty : undefined
            }
            extraData={isFocused}
            getItemLayout={this.getItemLayout}
            keyboardShouldPersistTaps="always"
            onScroll={scrollY ? this.handleScroll : undefined}
            onScrollBeginDrag={this.onScrollBeginDrag}
            scrollEventThrottle={scrollY ? 1 : undefined}
            scrollIndicatorInsets={
              GalleryFilterListComponent.scrollIndicatorInsets
            }
            // refreshControl={
            //   <RefreshControl
            //     refreshing={networkStatus === NetworkStatus.refetch}
            //     onRefresh={onRefresh}
            //     tintColor="white"
            //   />
            // }
            simultaneousHandlers={simultaneousHandlers}
            ItemSeparatorComponent={ItemSeparatorComponent}
            refreshing={networkStatus === NetworkStatus.refetch}
            keyboardDismissMode="on-drag"
            style={this.listStyle}
            keyExtractor={this.keyExtractor}
            contentInsetAdjustmentBehavior="automatic"
            extraData={selectedIDs}
            removeClippedSubviews={removeClippedSubviews}
            contentInset={this.contentInset}
            contentOffset={this.contentOffset}
            overScrollMode="always"
            // stickyHeaderIndices={
            //   ListHeaderComponent
            //     ? GalleryFilterListComponent.stickerHeaderIndices
            //     : undefined
            // }
            alwaysBounceVertical
            numColumns={numColumns}
            columnWrapperStyle={
              numColumns === 4 ? styles.fourColumn : styles.column
            }
            scrollToOverflowEnabled
            renderItem={this.renderColumn}
            onEndReached={
              networkStatus === NetworkStatus.ready && hasNextPage
                ? onEndReached
                : undefined
            }
            onEndReachedThreshold={0.75}
          />
        </Animated.View>

        {ListHeaderComponent && (
          <Animated.View
            style={[
              styles.header,
              {
                top: this.props.isModal
                  ? inset - 1
                  : TOP_Y + inset - headerHeight - SPACING.normal
              }
              // {
              //   translateY: this.translateY
              // }
            ]}
          >
            <ListHeaderComponent />
          </Animated.View>
        )}

        {ListFooterComponent && (
          <Animated.View
            style={[
              styles.footer,
              {
                bottom: this.props.isModal
                  ? inset - 1
                  : BOTTOM_Y - SPACING.normal
              }
              // {
              //   translateY: this.translateY
              // }
            ]}
          >
            <ListFooterComponent />
          </Animated.View>
        )}
      </>
    );
  }
}

const buildValue = memoize((data: Array<YeetImageContainer> = []) => {
  return (data || []).map(image => {
    return {
      image,
      id: image.id
    };
  });
});

const buildPostValue = memoize(
  (data: Array<PostSearchQuery_searchPosts_data> = []) => {
    return (data || []).map(post => {
      const { media, id } = post;

      return {
        image: imageContainerFromMediaSource(media, null),
        post,
        id
      };
    });
  }
);

export const SearchFilterList = ({
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
  ...otherProps
}) => {
  const [query, onChangeQuery] = React.useState("");

  const [transparent, changeTransparent] = React.useState(defaultTransparent);
  const [isKeyboardVisible] = useKeyboard();
  const _inset = isModal ? inset : Math.abs(inset) + IMAGE_SEARCH_HEIGHT;

  const filterListRef = React.useRef();

  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

  const skip = String(query).trim().length === 0 || !isFocused || !show;

  const imagesQuery = useQuery(IMAGE_SEARCH_QUERY, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    variables: {
      query: String(query).trim(),
      transparent
    },
    skip,
    notifyOnNetworkStatusChange: true
  });

  const isFirstShown = React.useRef(true);
  React.useEffect(() => {
    if (show && !isFirstShown.current) {
      changeTransparent(defaultTransparent);
      onChangeQuery("");
    } else if (show && isFirstShown.current) {
      isFirstShown.current = false;
    }
  }, [changeTransparent, defaultTransparent, onChangeQuery, show]);

  const [data, setData] = React.useState(
    buildValue(imagesQuery?.data?.images?.data)
  );

  React.useEffect(() => {
    if (isFocused && insetValue && show) {
      insetValue.setValue(_inset);
    }
  }, [isFocused, show, insetValue, _inset, onChangeQuery]);

  React.useEffect(() => {
    const images = imagesQuery?.data?.images?.data;

    if (typeof images !== "undefined") {
      setData(buildValue(images));
    }
  }, [imagesQuery?.data, setData]);

  React.useEffect(() => {
    if (!show) {
      const task = InteractionManager.runAfterInteractions(() => {
        changeTransparent(defaultTransparent);
        onChangeQuery("");
        filterListRef.current?.scrollTop(false);
        setData([]);
      });

      return () => {
        task.cancel();
      };
    }
  }, [show, onChangeQuery, setData, defaultTransparent]);

  const changeQuery = React.useCallback(
    // function
    (_query: string) => {
      onChangeQuery(_query);

      filterListRef.current?.scrollTop();
    },
    [onChangeQuery, imagesQuery, setData, transparent, isFocused, show]
  );

  const toggleTransparent = React.useCallback(
    (value: boolean) => {
      if (!isFocused) {
        return;
      }
      changeTransparent(value);
      filterListRef.current?.scrollTop();
    },
    [changeTransparent, query, isFocused]
  );

  const imageSearchContext = React.useMemo(() => {
    return {
      query,
      scrollY,
      isFocused,
      additionalOffset: 4,
      show,
      autoFocus: autoFocus,
      keyboardVisibleValue,
      rightActions: (
        <TransparentToggle value={transparent} onPress={toggleTransparent} />
      ),
      placeholder: "Search the internet",
      networkStatus: imagesQuery?.loading
        ? NetworkStatus.loading
        : imagesQuery?.networkStatus,

      onChange: changeQuery
    };
  }, [
    query,
    isFocused,
    scrollY,
    keyboardVisibleValue,
    show,

    autoFocus,
    changeQuery,
    toggleTransparent,

    transparent,
    imagesQuery.networkStatus,
    imagesQuery
  ]);

  const handleEndReached = React.useCallback(() => {
    const { networkStatus, loading } = imagesQuery;

    if (loading === true) {
      return;
    }

    if (
      !(
        (imagesQuery?.data?.images?.page_info?.has_next_page ?? false) &&
        networkStatus !== NetworkStatus.fetchMore &&
        typeof imagesQuery?.fetchMore === "function"
      )
    ) {
      return;
    }

    const limit = getPaginatedLimit(COLUMN_COUNT, SQUARE_ITEM_HEIGHT);
    return imagesQuery.fetchMore({
      variables: {
        offset: imagesQuery.data.images.page_info.offset + 20,
        query,
        transparent,
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
    imagesQuery?.networkStatus,
    imagesQuery?.fetchMore,
    transparent,
    imagesQuery?.data,
    imagesQuery?.data?.images?.page_info?.offset
  ]);

  return (
    <ImageSearchContext.Provider value={imageSearchContext}>
      <GalleryFilterListComponent
        {...otherProps}
        data={String(query).trim().length === 0 ? [] : data}
        offset={
          isModal ? offset : (Math.abs(offset) + IMAGE_SEARCH_HEIGHT) * -1
        }
        onRefresh={imagesQuery?.refetch}
        itemHeight={SQUARE_ITEM_HEIGHT}
        itemWidth={SQUARE_ITEM_WIDTH}
        numColumns={COLUMN_COUNT}
        headerHeight={IMAGE_SEARCH_HEIGHT}
        resizeMode="aspectFit"
        transparent={transparent}
        scrollY={scrollY}
        onEndReached={handleEndReached}
        isModal={isModal}
        ref={filterListRef}
        insetValue={insetValue}
        listKey="recent"
        inset={_inset}
        ListHeaderComponent={ImageSearch}
        ListEmptyComponent={GallerySectionList}
        stickyHeader={query.length > 0 || isKeyboardVisible}
        // removeClippedSubviews={isFocused}

        isFocused={isFocused}
        hasNextPage={
          imagesQuery?.data?.images?.page_info?.has_next_page ?? false
        }
        networkStatus={imagesQuery.networkStatus}
      />
    </ImageSearchContext.Provider>
  );
};

export const GIFsFilterList = ({
  isFocused,
  inset,
  offset,
  isModal,
  insetValue,
  keyboardVisibleValue,
  scrollY,
  ...otherProps
}) => {
  const [query, onChangeQuery] = React.useState("");
  const [isKeyboardVisible] = useKeyboard();
  const _inset = isModal ? inset : Math.abs(inset) + IMAGE_SEARCH_HEIGHT;

  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

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

    if (isFocused && insetValue) {
      insetValue.setValue(_inset);
    }
  }, [loadGifs, isFocused, insetValue, _inset]);

  const changeQuery = React.useCallback(
    // function
    (_query: string) => {
      if (_query === query) {
        return;
      }

      onChangeQuery(_query);

      if (
        !(
          typeof gifsQuery.refetch === "function" &&
          gifsQuery.networkStatus === NetworkStatus.ready
        )
      ) {
        return;
      }

      return gifsQuery.refetch({
        variables: {
          query: _query,
          limit: getInitialLimit(GIF_COLUMN_COUNT, HORIZONTAL_ITEM_HEIGHT)
        }
      });
    },
    [onChangeQuery, gifsQuery]
  );

  const imageSearchContext = React.useMemo(() => {
    return {
      query,
      scrollY,
      additionalOffset: 4,
      keyboardVisibleValue,
      networkStatus: gifsQuery?.networkStatus,
      placeholder: "Search GIPHY",

      onChange: changeQuery
    };
  }, [
    query,
    scrollY,
    keyboardVisibleValue,

    changeQuery,
    gifsQuery?.networkStatus
  ]);

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
    <ImageSearchContext.Provider value={imageSearchContext}>
      <GalleryFilterListComponent
        {...otherProps}
        data={data}
        offset={
          isModal ? offset : (Math.abs(offset) + IMAGE_SEARCH_HEIGHT) * -1
        }
        onRefresh={gifsQuery?.refetch}
        itemHeight={HORIZONTAL_ITEM_HEIGHT}
        itemWidth={HORIZONTAL_ITEM_WIDTH}
        numColumns={GIF_COLUMN_COUNT}
        headerHeight={IMAGE_SEARCH_HEIGHT}
        scrollY={scrollY}
        listKey="gifs"
        onEndReached={handleEndReached}
        isModal={isModal}
        insetValue={insetValue}
        inset={_inset}
        ListHeaderComponent={ImageSearch}
        stickyHeader={query.length > 0 || isKeyboardVisible}
        // removeClippedSubviews={isFocused}
        isFocused={isFocused}
        hasNextPage={gifsQuery?.data?.gifs?.page_info?.has_next_page ?? false}
        networkStatus={gifsQuery.networkStatus}
      />
    </ImageSearchContext.Provider>
  );
};

export const MemesFilterList = ({
  isFocused,
  inset,
  offset,
  isModal,
  insetValue,
  keyboardVisibleValue,
  scrollY,
  ...otherProps
}) => {
  const [query, onChangeQuery] = React.useState("");
  const [isKeyboardVisible] = useKeyboard();
  const [filter, onChangeFilter] = React.useState(MemeFilterType.spicy);
  const _inset = isModal ? inset : Math.abs(inset) + IMAGE_SEARCH_HEIGHT;
  const isHeaderSticky = query.length > 0 || isKeyboardVisible;

  const [loadMemes, memesQuery] = useLazyQuery<
    PostSearchQuery,
    PostSearchQueryVariables
  >(POST_SEARCH_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      query,
      limit: getInitialLimit(MEMES_COLUMN_COUNT, MEMES_ITEM_HEIGHT),
      offset: 0,
      latest: filter === MemeFilterType.recent && !isHeaderSticky
    },
    notifyOnNetworkStatusChange: true
  });

  React.useEffect(() => {
    if (isFocused && typeof loadMemes === "function") {
      loadMemes();
    }

    if (isFocused && insetValue) {
      insetValue.setValue(_inset);
    }
  }, [loadMemes, isFocused, insetValue, _inset]);

  const changeQuery = React.useCallback(
    // function
    (_query: string) => {
      if (_query === query) {
        return;
      }

      onChangeQuery(_query);

      if (
        !(
          typeof memesQuery.refetch === "function" &&
          memesQuery.networkStatus === NetworkStatus.ready
        )
      ) {
        return;
      }

      return memesQuery.refetch({
        variables: {
          query: _query,
          limit: getInitialLimit(MEMES_COLUMN_COUNT, MEMES_ITEM_HEIGHT)
        }
      });
    },
    [onChangeQuery, memesQuery]
  );

  const imageSearchContext = React.useMemo(() => {
    return {
      query,
      scrollY,
      additionalOffset: 4,
      keyboardVisibleValue,
      networkStatus: memesQuery?.networkStatus,
      placeholder: "Search yeet",

      onChange: changeQuery
    };
  }, [
    query,
    scrollY,
    keyboardVisibleValue,

    changeQuery,
    memesQuery?.networkStatus
  ]);

  const data = React.useMemo(() => {
    return buildPostValue(memesQuery?.data?.searchPosts?.data);
  }, [memesQuery?.data, memesQuery?.networkStatus]);

  const handleEndReached = React.useCallback(() => {
    const { networkStatus, loading } = memesQuery;

    if (loading === true) {
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

    return memesQuery.fetchMore({
      variables: {
        query,
        offset:
          memesQuery?.data?.searchPosts?.offset +
          memesQuery?.data?.searchPosts?.limit,
        limit: getPaginatedLimit(MEMES_COLUMN_COUNT, MEMES_ITEM_HEIGHT)
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        return {
          ...fetchMoreResult,
          searchPosts: {
            ...fetchMoreResult.searchPosts,
            data: previousResult.searchPosts.data.concat(
              fetchMoreResult.searchPosts.data
            )
          }
        };
      }
    });
  }, [memesQuery?.networkStatus, memesQuery?.fetchMore, memesQuery?.data]);

  return (
    <ImageSearchContext.Provider value={imageSearchContext}>
      <GalleryFilterListComponent
        {...otherProps}
        data={data}
        offset={
          isModal ? offset : (Math.abs(offset) + IMAGE_SEARCH_HEIGHT) * -1
        }
        onRefresh={memesQuery?.refetch}
        itemHeight={MEMES_ITEM_HEIGHT}
        itemWidth={MEMES_ITEM_WIDTH}
        numColumns={MEMES_COLUMN_COUNT}
        headerHeight={IMAGE_SEARCH_HEIGHT}
        scrollY={scrollY}
        listKey="memes"
        onEndReached={handleEndReached}
        isModal={isModal}
        insetValue={insetValue}
        inset={_inset}
        ListHeaderComponent={ImageSearch}
        stickyHeader={isHeaderSticky}
        // removeClippedSubviews={isFocused}
        isFocused={isFocused}
        hasNextPage={memesQuery?.data?.searchPosts?.hasMore ?? false}
        networkStatus={memesQuery.networkStatus}
      />

      {!isHeaderSticky && (
        <MemeFilterControl
          isModal={isModal}
          value={filter}
          onChange={onChangeFilter}
        />
      )}
    </ImageSearchContext.Provider>
  );
};

export const CameraRollFilterList = ({
  query = "",
  isFocused,
  offset,
  scrollY,
  isModal,
  defaultAssetType = "all",
  ...otherProps
}) => {
  const [assetType, setAssetType] = React.useState(defaultAssetType);

  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

  let height = SQUARE_ITEM_HEIGHT;
  let width = SQUARE_ITEM_WIDTH;

  if (assetType === "videos") {
    height = VERTICAL_ITEM_HEIGHT;
    width = VERTICAL_ITEM_WIDTH;
  }

  const [loadPhotos, photosQuery] = useLazyQuery(CAMERA_ROLL_QUERY, {
    variables: {
      assetType,
      first: 33
    },
    notifyOnNetworkStatusChange: true
  });

  React.useEffect(() => {
    if (isFocused && typeof loadPhotos === "function") {
      loadPhotos();
    }
  }, [loadPhotos, isFocused, assetType]);

  const data: Array<GalleryValue> = React.useMemo(() => {
    const data = photosQuery?.data?.cameraRoll?.data ?? [];

    return buildValue(data);
  }, [photosQuery?.data, photosQuery, photosQuery?.networkStatus]);

  const handleEndReached = React.useCallback(() => {
    const { networkStatus, loading } = photosQuery;

    if (loading === true) {
      return;
    }

    if (
      !(
        (photosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false) &&
        networkStatus !== NetworkStatus.fetchMore &&
        typeof photosQuery?.fetchMore === "function"
      )
    ) {
      console.log(photosQuery);
      return;
    }

    return photosQuery.fetchMore({
      variables: {
        after: photosQuery.data.cameraRoll.page_info.end_cursor,
        assetType,
        first: 42
      },
      updateQuery: (
        previousResult,
        { fetchMoreResult }: { fetchMoreResult }
      ) => {
        return {
          ...fetchMoreResult,
          cameraRoll: {
            ...fetchMoreResult.cameraRoll,
            data: previousResult.cameraRoll.data.concat(
              fetchMoreResult.cameraRoll.data
            )
          }
        };
      }
    });
  }, [
    assetType,
    photosQuery?.networkStatus,
    photosQuery?.fetchMore,
    photosQuery?.data,
    photosQuery?.data?.cameraRoll?.page_info?.has_next_page,
    photosQuery.data?.cameraRoll?.page_info?.end_cursor
  ]);

  React.useEffect(() => {
    const data = photosQuery?.data?.cameraRoll?.data ?? [];

    if (data.length > 0) {
      MediaPlayer.startCaching(
        data.map(image => galleryItemMediaSource(image, width, height)),
        { width, height },
        "cover"
      );
    }
  }, [photosQuery?.data?.cameraRoll?.data]);

  React.useEffect(() => {
    return () => {
      MediaPlayer.stopCachingAll();
    };
  }, []);

  return (
    <View style={styles.container}>
      <GalleryFilterListComponent
        {...otherProps}
        data={data}
        onRefresh={photosQuery?.refetch}
        isFocused={isFocused}
        listKey={assetType}
        offset={offset}
        scrollY={scrollY}
        itemHeight={height}
        itemWidth={width}
        isModal={isModal}
        onEndReached={handleEndReached}
        networkStatus={photosQuery.networkStatus}
        hasNextPage={
          photosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false
        }
      ></GalleryFilterListComponent>

      <CameraRollAssetTypeSwitcher
        isModal={isModal}
        assetType={assetType}
        setAssetType={setAssetType}
      />
    </View>
  );
};
