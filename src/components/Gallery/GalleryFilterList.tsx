import { NetworkStatus } from "apollo-client";
import * as React from "react";
import { useQuery, useApolloClient, useLazyQuery } from "react-apollo";
import {
  StyleSheet,
  View,
  RefreshControl,
  KeyboardAvoidingView
} from "react-native";
import { SCREEN_DIMENSIONS } from "../../../config";
import CAMERA_ROLL_QUERY from "../../lib/CameraRollQuery.local.graphql";
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
import ImageSearch from "../NewPost/ImagePicker/ImageSearch";
import { useDebouncedCallback } from "use-debounce";
import useKeyboard from "@rnhooks/keyboard";
import MediaPlayer from "../MediaPlayer";
import Animated from "react-native-reanimated";

const COLUMN_COUNT = 3;
const GIF_COLUMN_COUNT = 2;
const COLUMN_GAP = 2;

const SEPARATOR_HEIGHT = COLUMN_GAP * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width
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
          resizeMode={this.props.resizeMode}
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

  contentInset = { top: this.props.inset, left: 0, right: 0, bottom: 0 };
  contentOffset = { y: this.props.inset * -1, x: 0 };

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
              }
            }
          }
        ],
        { useNativeDriver: true }
      )
    : undefined;

  render() {
    const {
      data,
      networkStatus,
      isFocused,
      onRefresh,
      hasNextPage = false,
      removeClippedSubviews,
      numColumns = COLUMN_COUNT,
      onEndReached,
      simultaneousHandlers,
      ListHeaderComponent,
      stickyHeader,
      scrollY,
      inset,
      ...otherProps
    } = this.props;

    return (
      <Animated.View
        style={[
          styles.wrapper,
          this.props.scrollY && {
            transform: [
              {
                translateY: Animated.interpolate(this.props.scrollY, {
                  inputRange: [-100, inset * -1, 0],
                  outputRange: [-100, inset * -1, 0],
                  extrapolateRight: Animated.Extrapolate.CLAMP
                })
              }
            ]
          }
        ]}
      >
        <FlatList
          ref={this.setFlatListRef}
          data={data}
          directionalLockEnabled
          ListHeaderComponent={ListHeaderComponent}
          extraData={isFocused}
          getItemLayout={this.getItemLayout}
          keyboardShouldPersistTaps="always"
          onScroll={scrollY ? this.handleScroll : undefined}
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
          removeClippedSubviews={removeClippedSubviews}
          stickyHeaderIndices={
            ListHeaderComponent
              ? GalleryFilterListComponent.stickerHeaderIndices
              : undefined
          }
          contentInset={!ListHeaderComponent ? this.contentInset : undefined}
          overScrollMode="always"
          alwaysBounceVertical
          numColumns={numColumns}
          columnWrapperStyle={styles.column}
          renderItem={this.renderColumn}
          onEndReached={
            networkStatus === NetworkStatus.ready && hasNextPage
              ? onEndReached
              : undefined
          }
          onEndReachedThreshold={0.75}
        />
      </Animated.View>
    );
  }
}

const buildValue = (data: Array<YeetImageContainer> = []) => {
  return (data || []).map(image => {
    return {
      image,
      id: image.id
    };
  });
};

export const GIFsFilterList = ({ isFocused, inset, ...otherProps }) => {
  const [query, onChangeQuery] = React.useState("");
  const [isKeyboardVisible] = useKeyboard();

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
  }, [loadGifs, isFocused]);

  const [debouncedChangeQuery] = useDebouncedCallback(
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
          query: _query
        }
      });
    },
    // delay in ms
    500,
    {
      maxWait: 2000
    }
  );

  const renderSearchBar = React.useMemo(
    () => () => (
      <ImageSearch
        inset={inset}
        query={query}
        onChange={debouncedChangeQuery}
      />
    ),
    [debouncedChangeQuery]
  );

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
        query
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
    <GalleryFilterListComponent
      {...otherProps}
      data={data}
      onRefresh={gifsQuery?.refetch}
      itemHeight={HORIZONTAL_ITEM_HEIGHT}
      itemWidth={HORIZONTAL_ITEM_WIDTH}
      numColumns={GIF_COLUMN_COUNT}
      onEndReached={handleEndReached}
      inset={inset}
      ListHeaderComponent={renderSearchBar}
      stickyHeader={query.length > 0 || isKeyboardVisible}
      // removeClippedSubviews={isFocused}
      isFocused={isFocused}
      hasNextPage={gifsQuery?.data?.gifs?.page_info?.has_next_page ?? false}
      networkStatus={gifsQuery.networkStatus}
    />
  );
};

export const PhotosFilterList = ({ query = "", isFocused, ...otherProps }) => {
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

export const VideosFilterList = ({ query = "", isFocused, ...otherProps }) => {
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
      onEndReached={handleEndReached}
      itemHeight={height}
      itemWidth={width}
      networkStatus={videosQuery.networkStatus}
      hasNextPage={
        videosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false
      }
    />
  );
};
