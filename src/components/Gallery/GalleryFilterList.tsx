import { NetworkStatus } from "apollo-client";
import * as React from "react";
import { useQuery, useApolloClient, useLazyQuery } from "react-apollo";
import {
  StyleSheet,
  View,
  RefreshControl,
  KeyboardAvoidingView,
  InteractionManager,
  Keyboard
} from "react-native";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import CAMERA_ROLL_QUERY from "../../lib/CameraRollQuery.local.graphql";
import IMAGE_SEARCH_QUERY from "../../lib/ImageSearchQuery.local.graphql";
import GIFS_QUERY from "../../lib/GIFSearchQuery.local.graphql";
import {
  YeetImageContainer,
  mediaSourceFromImage
} from "../../lib/imageSearch";
import { SPACING } from "../../lib/styles";
import { FlatList } from "../FlatList";
import { GallerySectionItem } from "../NewPost/ImagePicker/FilterBar";
import { GalleryValue } from "./GallerySection";
import GalleryItem, {
  galleryItemResizeMode,
  galleryItemMediaSource
} from "./GalleryItem";
import CameraRollGraphQL from "../../lib/CameraRollGraphQL";
import { uniqBy } from "lodash";
import ImageSearch, {
  IMAGE_SEARCH_HEIGHT,
  ImageSearchContext
} from "../NewPost/ImagePicker/ImageSearch";
import { useDebouncedCallback } from "use-debounce";
import useKeyboard from "@rnhooks/keyboard";
import MediaPlayer from "../MediaPlayer";
import Animated from "react-native-reanimated";
import { GallerySectionList } from "./GallerySectionList";
import { TransparentToggle } from "./GallerySearchFilter";
import useToggle from "../../lib/useToggle";
import { memoize } from "lodash";

const COLUMN_COUNT = 3;
const GIF_COLUMN_COUNT = 2;
const COLUMN_GAP = 2;

const SEPARATOR_HEIGHT = COLUMN_GAP * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible"
  },
  wrapper: {
    flex: 1,
    flexShrink: 0,
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
  item: {
    marginRight: COLUMN_GAP,
    flex: 1
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

class GalleryFilterListComponent extends React.Component<Props> {
  static defaultProps = {
    headerHeight: 0
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

  handlePressColumn = (image: YeetImageContainer) => {
    this.props.onPress(image);
  };

  renderColumn = ({ item, index }: { item: GalleryValue; index: number }) => {
    return (
      <View style={styles.item}>
        <GalleryItem
          image={item.image}
          width={this.props.itemWidth}
          height={this.props.itemHeight}
          onPress={this.handlePressColumn}
          transparent={this.props.transparent}
          resizeMode={this.props.resizeMode}
          isSelected={this.props.selectedIDs.includes(item.image.id)}
          paused={!this.props.isFocused}
          id={item.id}
        />
      </View>
    );
  };

  keyExtractor = item => item.id;

  getItemLayout = (_data, index) => ({
    length: this.props.itemHeight,
    offset: this.props.itemHeight * index + index * this.props.itemHeight,
    index
  });

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
  static scrollIndicatorInsets = { right: 1 };
  handleScroll = this.props.scrollY
    ? Animated.event(
        [
          {
            nativeEvent: {
              contentOffset: {
                y: this.props.scrollY
              },
              contentInset: {
                top: this.props.insetValue
              }
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

  onScrollBeginDrag = Animated.event(
    [
      {
        nativeEvent: {
          // contentOffset: {
          //   y: this.props.scrollY
          // },
          contentInset: {
            top: this.props.insetValue
          }
        }
      }
    ],
    { useNativeDriver: true }
  );

  render() {
    const {
      data,
      networkStatus,
      isFocused,
      selectedIDs,
      onRefresh,
      hasNextPage = false,
      removeClippedSubviews,
      numColumns = COLUMN_COUNT,
      onEndReached,
      simultaneousHandlers,
      ListHeaderComponent,
      isModal,
      stickyHeader,
      scrollY,
      inset,
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
            style={styles.container}
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
            columnWrapperStyle={styles.column}
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

  const hasTextValue = React.useRef(new Animated.Value(query.length > 0));

  const filterListRef = React.useRef();

  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

  const skip = String(query).trim().length === 0 || !isFocused || !show;

  console.log({ skip, show, isFocused });

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
        filterListRef.current && filterListRef.current.scrollTop(false);
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
      hasTextValue.current.setValue(_query.length > 0 ? 1 : 0);
      filterListRef.current && filterListRef.current.scrollTop();
    },
    [
      onChangeQuery,
      imagesQuery,
      hasTextValue,

      setData,
      transparent,
      isFocused,
      show
    ]
  );

  const toggleTransparent = React.useCallback(
    (value: boolean) => {
      if (!isFocused) {
        return;
      }
      changeTransparent(value);
      filterListRef.current && filterListRef.current.scrollTop();
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
      hasTextValue: hasTextValue.current,
      onChange: changeQuery
    };
  }, [
    query,
    isFocused,
    scrollY,
    keyboardVisibleValue,
    show,
    hasTextValue,
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

    return imagesQuery.fetchMore({
      variables: {
        offset: imagesQuery.data.images.page_info.offset + 20,
        query,
        transparent,
        limit: 20
      },
      updateQuery: (
        previousResult,
        { fetchMoreResult }: { fetchMoreResult }
      ) => {
        return {
          ...fetchMoreResult,
          images: {
            ...fetchMoreResult.images,
            data: uniqBy(
              previousResult.images.data.concat(fetchMoreResult.images.data),
              "id"
            )
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

  const hasTextValue = React.useRef(new Animated.Value(query.length > 0));

  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

  const [loadGifs, gifsQuery] = useLazyQuery(GIFS_QUERY, {
    variables: {
      query
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
      hasTextValue.current.setValue(_query.length > 0 ? 1 : 0);

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
          query: _query
        }
      });
    },
    [onChangeQuery, gifsQuery, hasTextValue]
  );

  const imageSearchContext = React.useMemo(() => {
    return {
      query,
      scrollY,
      additionalOffset: 4,
      keyboardVisibleValue,
      networkStatus: gifsQuery?.networkStatus,
      placeholder: "Search GIPHY",
      hasTextValue: hasTextValue.current,
      onChange: changeQuery
    };
  }, [
    query,
    scrollY,
    keyboardVisibleValue,
    hasTextValue,
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
        limit: 20
      },
      updateQuery: (
        previousResult,
        { fetchMoreResult }: { fetchMoreResult }
      ) => {
        return {
          ...fetchMoreResult,
          gifs: {
            ...fetchMoreResult.gifs,
            data: uniqBy(
              previousResult.gifs.data.concat(fetchMoreResult.gifs.data),
              "id"
            )
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

export const PhotosFilterList = ({
  query = "",
  isFocused,
  offset,
  scrollY,
  ...otherProps
}) => {
  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

  const height = SQUARE_ITEM_HEIGHT;
  const width = SQUARE_ITEM_WIDTH;

  const [loadPhotos, photosQuery] = useLazyQuery(CAMERA_ROLL_QUERY, {
    variables: {
      assetType: "photos",
      first: 33
    },
    notifyOnNetworkStatusChange: true
  });

  React.useEffect(() => {
    if (isFocused && typeof loadPhotos === "function") {
      loadPhotos();
    }
  }, [loadPhotos, isFocused]);

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
        assetType: "photos",
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

    return () => {
      const data = photosQuery?.data?.cameraRoll?.data ?? [];
      if (data.length === 0) {
        return;
      }

      console.log("STOP CACHING!", data.length);

      MediaPlayer.stopCachingAll();
    };
  }, [photosQuery?.data?.cameraRoll?.data]);

  return (
    <GalleryFilterListComponent
      {...otherProps}
      data={data}
      onRefresh={photosQuery?.refetch}
      isFocused={isFocused}
      listKey="photos"
      offset={offset}
      scrollY={scrollY}
      itemHeight={height}
      itemWidth={width}
      onEndReached={handleEndReached}
      networkStatus={photosQuery.networkStatus}
      hasNextPage={
        photosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false
      }
    />
  );
};

export const VideosFilterList = ({
  query = "",
  isFocused,
  offset,
  scrollY,
  ...otherProps
}) => {
  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

  const [loadVideos, videosQuery] = useLazyQuery(CAMERA_ROLL_QUERY, {
    variables: {
      assetType: "videos",
      first: 33,
      offset: 0
    },

    notifyOnNetworkStatusChange: true
  });

  React.useEffect(() => {
    if (isFocused && typeof loadVideos === "function") {
      loadVideos();
    }
  }, [loadVideos, isFocused]);

  const data: Array<GalleryValue> = React.useMemo(() => {
    return buildValue(videosQuery?.data?.cameraRoll?.data);
  }, [videosQuery?.data, videosQuery?.networkStatus]);

  const handleEndReached = React.useCallback(() => {
    const { networkStatus, loading } = videosQuery;

    if (loading === true) {
      return;
    }

    if (
      !(
        (videosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false) &&
        networkStatus !== NetworkStatus.fetchMore &&
        typeof videosQuery?.fetchMore === "function"
      )
    ) {
      return;
    }

    console.log("FETCHING more");

    return videosQuery.fetchMore({
      variables: {
        after: videosQuery.data.cameraRoll?.page_info.end_cursor,
        assetType: "videos",
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
    videosQuery?.networkStatus,
    videosQuery?.fetchMore,
    videosQuery?.loading,
    videosQuery?.data,
    videosQuery?.data?.page_info?.end_cursor,
    videosQuery?.data?.cameraRoll?.page_info?.has_next_page
  ]);

  const height = VERTICAL_ITEM_HEIGHT;
  const width = VERTICAL_ITEM_WIDTH;

  React.useEffect(() => {
    const data = videosQuery?.data?.cameraRoll?.data ?? [];

    if (data.length > 0) {
      MediaPlayer.startCaching(
        data.map(image => galleryItemMediaSource(image, width, height)),
        { width, height },
        "contain"
      );
    }

    return () => {
      const data = videosQuery?.data?.cameraRoll?.data ?? [];
      if (data.length === 0) {
        return;
      }

      console.log("STOP CACHING!", data.length);

      MediaPlayer.stopCachingAll();
    };
  }, [videosQuery?.data?.cameraRoll?.data, width, height]);

  return (
    <GalleryFilterListComponent
      {...otherProps}
      data={data}
      onRefresh={videosQuery?.refetch}
      isFocused={isFocused}
      offset={offset}
      onEndReached={handleEndReached}
      listKey="videos"
      scrollY={scrollY}
      itemHeight={height}
      itemWidth={width}
      networkStatus={videosQuery.networkStatus}
      hasNextPage={
        videosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false
      }
    />
  );
};
