import useKeyboard from "@rnhooks/keyboard";
import { NetworkStatus } from "apollo-client";
import { chunk, uniqBy, first, flatMap } from "lodash";
import * as React from "react";
import { useApolloClient, useLazyQuery, useQuery } from "react-apollo";
import { InteractionManager, PixelRatio, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { BOTTOM_Y, SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import CameraRollGraphQL from "../../lib/CameraRollGraphQL";
import CAMERA_ROLL_QUERY from "../../lib/CameraRollQuery.local.graphql";
import GIFS_QUERY from "../../lib/GIFSearchQuery.local.graphql";
import { PostFragment } from "../../lib/graphql/PostFragment";
import {
  PostSearchQuery,
  PostSearchQueryVariables,
  PostSearchQuery_searchPosts_data
} from "../../lib/graphql/PostSearchQuery";
import { YeetImageContainer } from "../../lib/imageSearch";
import IMAGE_SEARCH_QUERY from "../../lib/ImageSearchQuery.local.graphql";
import POST_SEARCH_QUERY from "../../lib/PostSearchQuery.graphql";
import { SPACING } from "../../lib/styles";
import FastList, { ScrollDirection } from "../FastList";
import { FlatList } from "../FlatList";
import MediaPlayer from "../MediaPlayer";
import { registrations } from "../MediaPlayer/MediaPlayerComponent";
import { GallerySectionItem } from "../NewPost/ImagePicker/FilterBar";
import { partition, maxBy } from "lodash";
import ImageSearch, {
  ImageSearchContext,
  IMAGE_SEARCH_HEIGHT
} from "../NewPost/ImagePicker/ImageSearch";
import {
  COLUMN_COUNT,
  COLUMN_GAP,
  GIF_COLUMN_COUNT,
  MEMES_COLUMN_COUNT
} from "./COLUMN_COUNT";
import { galleryItemMediaSource, GalleryRow } from "./GalleryItem";
import { TransparentToggle } from "./GallerySearchFilter";
import { GalleryValue } from "./GallerySection";
import { GallerySectionList } from "./GallerySectionList";
import {
  CameraRollAssetTypeSwitcher,
  MemeFilterControl,
  MemeFilterType
} from "./SegmentFilterControl";
import {
  HORIZONTAL_ITEM_HEIGHT,
  HORIZONTAL_ITEM_WIDTH,
  MEMES_ITEM_HEIGHT,
  MEMES_ITEM_WIDTH,
  SQUARE_ITEM_HEIGHT,
  SQUARE_ITEM_WIDTH,
  VERTICAL_ITEM_HEIGHT,
  VERTICAL_ITEM_WIDTH
} from "./sizes";
import memoizee from "memoizee";
import { isSameDay } from "date-fns/esm";
import { PERMISSIONS, RESULTS } from "react-native-permissions";

const memoize = memoizee;
const SEPARATOR_HEIGHT = COLUMN_GAP * 2;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height,
    backgroundColor: "black",
    flex: 0,
    overflow: "visible"
  },
  modalContainer: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible"
  },
  wrapper: {
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height,
    flex: 0,
    overflow: "visible",
    backgroundColor: "black"
  },
  modalWrapper: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
    overflow: "hidden"
  },
  separator: {
    height: SEPARATOR_HEIGHT
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

const getPaginatedLimit = (columnCount: number, height: number) => {
  return Math.ceil((SCREEN_DIMENSIONS.height / height) * columnCount * 1.2);
};

const getInitialLimit = (columnCount: number, height: number) => {
  return getPaginatedLimit(columnCount, height) * 4;
};

class GalleryFilterListComponent extends React.PureComponent<Props> {
  static defaultProps = {
    headerHeight: 0,
    bottomInset: 0,

    paused: true,
    inset: 0,
    numColumns: COLUMN_COUNT,
    useFastList: true
  };
  constructor(props) {
    super(props);

    this.state = {
      showScrollView: !!props.isFocused
    };
  }

  flatListRef: FastList | null = null;

  setFlatListRef = (flatList: FlatList) => {
    this.flatListRef = flatList;

    const { flatListRef } = this.props;

    if (flatListRef && typeof flatListRef === "function") {
      flatListRef(flatList);
    }

    if (this.flatListRef) {
      this.handleScroll({
        nativeEvent: { visibleRows: this.flatListRef.visibleRows }
      });
    }
  };

  componentDidMount() {
    if (
      this.props.onVisibleItemsChange &&
      this.state.showScrollView &&
      this.sectionCounts
    ) {
      if (this.flatListRef) {
        this.handleScroll({
          nativeEvent: { visibleRows: this.flatListRef.visibleRows }
        });
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { data } = this.props;

    if (
      prevProps.data !== data &&
      data.length > 0 &&
      prevProps.data.length > 0 &&
      data[0].id !== prevProps.data[0].id
    ) {
      this.scrollTop(true);
      this.handleScroll({
        nativeEvent: { visibleRows: this.flatListRef.visibleRows }
      });
    }

    if (
      this.props.onVisibleItemsChange &&
      !prevState.showScrollView &&
      this.state.showScrollView &&
      this.sectionCounts
    ) {
      if (this.flatListRef) {
        this.handleScroll({
          nativeEvent: { visibleRows: this.flatListRef.visibleRows }
        });
      }
    }
  }

  flatListRef: FlatList | null = null;

  handlePressColumn = (
    image: YeetImageContainer,
    post?: Partial<PostFragment>
  ) => {
    this.props.onPress(image, post);
  };

  keyExtractor = item => item.join("-");

  getItemLayout = (_data, index) => {
    const length = this.props.itemHeight + SEPARATOR_HEIGHT;
    const offset =
      (this.props.itemHeight + SEPARATOR_HEIGHT) *
      Math.ceil(index / this.props.numColumns);
    return {
      length,
      offset,
      index
    };
  };

  // contentInset = {
  //   top: this.props.inset,
  //   left: 0,
  //   right: 0,
  //   bottom: this.props.bottomInset || 0
  // };
  scrollIndicatorInsets = {
    top: this.props.inset,
    bottom: this.props.bottomInset || 0,
    left: 0,
    right: 1
  };
  contentOffset = {
    y: this.props.offset + (!this.props.isModal ? TOP_Y * -1 : 0),
    x: 0
  };
  contentInset = {
    top: Math.abs(this.props.inset + (this.props.isModal ? 0 : TOP_Y)),
    left: 0,
    right: 0,
    bottom: Math.abs(
      (this.props.bottomInset * -1 + (this.props.isModal ? 0 : BOTTOM_Y)) * -1
    )
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

  static getDerivedStateFromProps(props, state) {
    if (props.isFocused && !state.showScrollView) {
      return { showScrollView: true };
    } else {
      return state;
    }
  }

  static stickerHeaderIndices = [0];
  // https://github.com/facebook/react-native/issues/26610
  static scrollIndicatorInsets = { right: 1, left: 0, top: 0, bottom: 0 };

  translateY = this.props.isModal
    ? Animated.interpolate(this.props.scrollY, {
        inputRange: [-200, this.props.inset * -1, 0],
        outputRange: [-200, this.props.inset, 0],
        extrapolateRight: Animated.Extrapolate.CLAMP
      })
    : undefined;

  scrollToTopRaf: number | null = 0;

  scrollTop = (animated = true) => {
    if (!this.state.showScrollView) {
      return;
    }

    let scrollToTopRaf = window.requestAnimationFrame(() => {
      if (this.props.useFastList) {
        this.flatListRef &&
          typeof this.flatListRef.scrollToTop === "function" &&
          this.flatListRef.scrollToTop(animated);
      } else {
        this.flatListRef?.scrollToOffset({
          offset: this.props.isModal
            ? this.contentOffset.y
            : this.contentOffset.y - TOP_Y,
          animated
        });
      }

      if (scrollToTopRaf === this.scrollToTopRaf) {
        this.scrollToTopRaf = null;
        scrollToTopRaf = null;
      }
    });

    this.scrollToTopRaf = scrollToTopRaf;
  };

  componentWillUnmount() {
    this.visibleRaf && window.cancelAnimationFrame(this.visibleRaf);
    this.scrollToTopRaf && window.cancelAnimationFrame(this.scrollToTopRaf);
  }

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

  listStyle = this.props.isModal
    ? [styles.modalContainer, { height: this.props.height }]
    : [styles.container, { height: this.props.height }];

  static getSections = memoize((data, numColumns) => {
    return chunk(
      data.map((row, index) => index),
      numColumns
    );
  });

  get sections() {
    return GalleryFilterListComponent.getSections(
      this.props.data,
      this.props.numColumns
    );
  }

  static getColumnCounts = memoize((length, numColumns) => {
    return [Math.ceil(length / numColumns)];
  });

  get sectionCounts() {
    return GalleryFilterListComponent.getColumnCounts(
      this.props.data.length,
      this.props.numColumns
    );
  }

  getItemCount = data => this.sectionCounts[0];

  handleRenderRow = (section: number, row: number) => {
    const { itemWidth, itemHeight, data, numColumns } = this.props;
    const columns = this.sections[row];
    return (
      <GalleryRow
        first={data[columns[0]]}
        second={data[columns[1]]}
        third={data[columns[2]]}
        fourth={data[columns[3]]}
        width={itemWidth}
        numColumns={numColumns}
        selectedIDs={this.props.selectedIDs}
        height={itemHeight}
        onPress={this.handlePressColumn}
        transparent={this.props.transparent}
        resizeMode={this.props.resizeMode}
        paused={this.props.paused}
      />
    );
  };

  _handleRenderRow = ({ item: columns }) => {
    const { itemWidth, itemHeight, data, numColumns } = this.props;
    return (
      <GalleryRow
        first={data[columns[0]]}
        second={data[columns[1]]}
        third={data[columns[2]]}
        fourth={data[columns[3]]}
        width={itemWidth}
        numColumns={numColumns}
        selectedIDs={this.props.selectedIDs}
        height={itemHeight}
        onPress={this.handlePressColumn}
        transparent={this.props.transparent}
        resizeMode={this.props.resizeMode}
        paused={this.props.paused}
      />
    );
  };

  visibleKey = null;

  visibleItemsFromRows = (visibleRows, ids) => {
    return flatMap(visibleRows, rowNumber =>
      this.sections[rowNumber].map(item => {
        const cell = this.props.data[item];
        if (cell) {
          ids?.push(cell.id);
        }

        return cell;
      })
    );
  };

  visibleRaf: number | null = null;
  handleScroll = () => {
    // console.time("Handle Scroll");
    // if (this.visibleRaf) {
    //   window.cancelAnimationFrame(this.visibleRaf);
    // }
    // const raf = window.requestAnimationFrame(() => {
    //   if (!this.flatListRef) {
    //     return;
    //   }
    //   const visibleIDs = [];
    //   const visibleRows = this.visibleItemsFromRows(
    //     this.flatListRef.visibleRows,
    //     visibleIDs
    //   );
    //   const visibleKey = visibleIDs.join("-");
    //   if (visibleKey !== this.visibleKey) {
    //     this.visibleKey = visibleIDs;
    //     this.props.onVisibleItemsChange &&
    //       this.props.onVisibleItemsChange(visibleRows);
    //   }
    //   if (this.visibleRaf === raf) {
    //     this.visibleRaf = null;
    //   }
    //   console.timeEnd("Handle Scroll");
    // });
    // this.visibleRaf = raf;
  };

  renderHeader = list => {
    const { ListHeaderComponent } = this.props;

    return (
      <Animated.View
        style={{
          transform: []
        }}
      >
        <ListHeaderComponent />
      </Animated.View>
    );
  };

  handleScrollEnd = event => {
    this.props.onEndReached && this.props.onEndReached(event);
  };

  render() {
    const {
      data,
      networkStatus,
      isFocused,
      selectedIDs,
      useFastList,
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
      itemHeight,
      ListFooterComponent,
      bottomInset,
      headerHeight = 0,
      height = 0,
      ListEmptyComponent,
      offset,
      ...otherProps
    } = this.props;
    const { showScrollView } = this.state;

    const containerHeight = isModal ? height : SCREEN_DIMENSIONS.height;

    const ContainerComponent = isModal ? Animated.View : View;
    const containerStyles = isModal
      ? [
          styles.modalWrapper,
          {
            paddingTop: headerHeight,
            transform: [
              {
                translateY: this.translateY
              }
            ]
          }
        ]
      : [
          styles.wrapper
          // {
          //   paddingTop: inset + TOP_Y,
          //   paddingBottom: bottomInset ?? BOTTOM_Y
          // }
        ];

    const { contentInset, contentOffset } = this;

    const isEmpty = this.sectionCounts[0] === 0;

    return (
      <>
        <ContainerComponent height={containerHeight} style={containerStyles}>
          {showScrollView && useFastList && (
            <FastList
              ref={this.setFlatListRef}
              contentInsetAdjustmentBehavior="never"
              keyboardDismissMode="on-drag"
              contentInset={this.contentInset}
              contentOffset={this.contentOffset}
              insetBottom={Math.abs(this.contentInset.bottom) * -1}
              insetTop={Math.abs(this.contentInset.top) * -1}
              scrollTopValue={this.props.scrollY}
              scrollIndicatorInsets={this.scrollIndicatorInsets}
              insetTopValue={this.props.insetValue}
              automaticallyAdjustContentInsets={false}
              keyboardShouldPersistTaps="always"
              isLoading={
                this.props.networkStatus === NetworkStatus.loading ||
                this.props.networkStatus === NetworkStatus.refetch ||
                this.props.networkStatus === NetworkStatus.fetchMore
              }
              renderRow={this.handleRenderRow}
              containerHeight={containerHeight}
              translateY={this.translateY}
              scrollToOverflowEnabled
              overScrollMode="always"
              scrollTopValue={this.props.scrollY}
              footerHeight={0}
              // refreshControl={
              //   <RefreshControl
              //     refreshing={refreshing}
              //     onRefresh={this.handleRefresh}
              //     tintColor="white"
              //   />
              // }
              headerHeight={0}
              style={this.listStyle}
              onScrollEnd={this.handleScrollEnd}
              isFastList
              alwaysBounceVertical
              renderEmpty={
                ListEmptyComponent ? this.renderListEmpty : undefined
              }
              rowHeight={this.props.itemHeight + SEPARATOR_HEIGHT}
              // sectionHeight={this.getTotalHeight}
              sections={this.sectionCounts}
              uniform
            />
          )}

          {ListHeaderComponent && isModal && (
            <Animated.View
              style={{
                height: headerHeight,
                width: "100%",
                zIndex: 999,
                top: 0,
                left: 0,
                right: 0,
                position: "absolute",
                transform: [
                  { translateY: Animated.multiply(this.translateY, -1) }
                ]
              }}
            >
              <ListHeaderComponent />
            </Animated.View>
          )}
        </ContainerComponent>

        {ListHeaderComponent && !isModal && (
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

const _buildValue = image => ({
  image,
  id: `${image.id}-cell`
});

const buildValue = (data: Array<YeetImageContainer> = []) => {
  return (data || []).map(_buildValue);
};

const postToCell = memoize(
  post => {
    const {
      media: { width, height, previewUrl, coverUrl, url, duration, mimeType },
      id
    } = post;

    const _id = `${id}-cell`;

    return {
      mediaSource: registrations[_id]
        ? { id: _id }
        : {
            width,
            height,
            duration,
            mimeType,
            id: _id,
            url: url,
            cover: coverUrl ?? previewUrl
          },
      post,
      id
    };
  },
  { max: 500 }
);

const buildPostValue = (data: Array<PostSearchQuery_searchPosts_data> = []) => {
  console.time("Create values");
  const values = (data || []).map(postToCell);
  console.timeEnd("Create values");
  return values;
};

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

  const filterListRef = React.useRef(null);

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

  const changeQuery = React.useCallback(
    // function
    (_query: string) => {
      onChangeQuery(_query);

      filterListRef?.current?.scrollTop();
    },
    [
      onChangeQuery,
      imagesQuery,
      setData,
      transparent,
      isFocused,
      show,
      filterListRef
    ]
  );

  const toggleTransparent = React.useCallback(
    (value: boolean) => {
      if (!isFocused) {
        return;
      }
      changeTransparent(value);
      filterListRef?.current?.scrollTop();
    },
    [changeTransparent, query, isFocused, filterListRef]
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
  }, [loadGifs, isFocused, insetValue, _inset]);

  React.useEffect(() => {
    if (isFocused && insetValue) {
      insetValue.setValue(_inset);
    }
  }, [insetValue, _inset, isFocused]);

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
        paused={!isFocused}
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
  const _inset = isModal ? inset : Math.abs(inset);
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
  }, [loadMemes, isFocused, otherProps?.offset]);

  React.useEffect(() => {
    if (isFocused && insetValue) {
      insetValue.setValue(_inset);
    }
  }, [isFocused, insetValue, _inset]);

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

      const { contentOffset, targetContentOffset, direction } =
        args?.nativeEvent ?? {};

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
        headerHeight={0}
        scrollY={scrollY}
        listKey="memes"
        onEndReached={handleEndReached}
        isModal={isModal}
        insetValue={insetValue}
        inset={_inset}
        stickyHeader={isHeaderSticky}
        // removeClippedSubviews={isFocused}
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

export const CameraRollFilterList = ({
  query = "",
  isFocused,
  offset,
  scrollY,
  isModal,
  defaultAssetType = "all",
  ...otherProps
}) => {
  const ref = React.useRef<GalleryFilterListComponent>(null);
  const [assetType, setAssetType] = React.useState(defaultAssetType);
  const [album, setAlbum] = React.useState(null);

  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

  let columnCount = 3;
  let height = SQUARE_ITEM_HEIGHT;
  let width = SQUARE_ITEM_HEIGHT;

  if (assetType === "videos") {
    columnCount = 3;
    height = VERTICAL_ITEM_HEIGHT;
    width = VERTICAL_ITEM_WIDTH;
  }

  const photosQuery = useQuery(CAMERA_ROLL_QUERY, {
    skip:
      global.MediaPlayerViewManager?.photosAuthorizationStatus !==
      RESULTS.GRANTED,
    variables: {
      assetType,
      width,
      height,
      contentMode: "aspectFill",
      album: album ? album.id : undefined,

      first: getPaginatedLimit(columnCount, height) * 2
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only"
  });

  const handleChangeAlbum = React.useCallback(
    album => {
      setAlbum(album);
      setAssetType("all");
    },
    [
      setAlbum,
      setAssetType,
      photosQuery,
      width,
      height,
      columnCount,
      height,
      getPaginatedLimit
    ]
  );

  const isFirstLoad = React.useRef(false);

  // const onVisibleItemsChange = React.useCallback(
  //   items => {
  //     const oldestItem = maxBy(items, "image.timestamp");
  //     if (oldestItem) {
  //       const newDate = new Date(oldestItem.image.timestamp);
  //       const isDifferent = !_lastVisibleDate.current
  //         ? true
  //         : !isSameDay(_lastVisibleDate.current, newDate);
  //       if (isDifferent) {
  //         setVisibleDate(newDate);
  //         _lastVisibleDate.current = newDate;
  //       }
  //     } else if (_lastVisibleDate.current) {
  //       _lastVisibleDate.current = null;
  //       setVisibleDate(null);
  //     }
  //   },
  //   [maxBy, first, switcherRef, setVisibleDate, _lastVisibleDate]
  // );

  React.useEffect(() => {
    const sessionId = photosQuery?.data?.cameraRoll?.sessionId;

    if (sessionId) {
      return () => {
        global.MediaPlayerViewManager?.stopAlbumSession(
          photosQuery?.data?.cameraRoll?.sessionId
        );
      };
    }
  }, [photosQuery?.data?.cameraRoll?.sessionId]);

  const data: Array<GalleryValue> = React.useMemo(() => {
    const data = photosQuery?.data?.cameraRoll?.data ?? [];

    return buildValue(data);
  }, [
    photosQuery?.data?.cameraRoll?.id,
    photosQuery?.data?.cameraRoll?.data,
    photosQuery?.data?.cameraRoll?.sessionId
  ]);

  const handleEndReached = React.useCallback(
    args => {
      const { networkStatus, loading } = photosQuery;

      if (loading === true) {
        return;
      }

      const { direction } = args?.nativeEvent ?? {};

      if (
        !(
          (photosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false) &&
          networkStatus !== NetworkStatus.fetchMore &&
          typeof photosQuery?.fetchMore === "function"
        )
      ) {
        return;
      }

      if (
        direction === ScrollDirection.up ||
        direction === ScrollDirection.neutral
      ) {
        return;
      }

      let offset =
        photosQuery?.data?.cameraRoll?.page_info?.offset +
        photosQuery?.data?.cameraRoll?.page_info?.limit;

      return photosQuery.fetchMore({
        variables: {
          // after: photosQuery.data.cameraRoll.page_info.end_cursor,
          offset: offset,
          assetType,
          width,
          height,
          cache: true,
          first: getPaginatedLimit(columnCount, height)
        },

        updateQuery: (
          previousResult,
          { fetchMoreResult }: { fetchMoreResult }
        ) => {
          return {
            ...fetchMoreResult,
            cameraRoll: {
              ...fetchMoreResult.cameraRoll,
              data: uniqBy(
                previousResult.cameraRoll.data.concat(
                  fetchMoreResult.cameraRoll.data
                ),
                "id"
              )
            }
          };
        }
      });
    },
    [
      assetType,
      photosQuery?.networkStatus,
      photosQuery?.fetchMore,
      photosQuery?.data,
      width,
      height,
      columnCount,
      getPaginatedLimit,
      photosQuery?.data?.cameraRoll?.page_info?.has_next_page,
      photosQuery.data?.cameraRoll?.page_info?.end_cursor,
      photosQuery.data?.cameraRoll?.page_info?.offset
    ]
  );

  React.useEffect(() => {
    return () => {
      window.requestIdleCallback(() => MediaPlayer.stopCachingAll());
    };
  }, []);

  const _setAssetType = React.useCallback(
    assetType => {
      setAssetType(assetType);
    },
    [setAssetType]
  );

  return (
    <>
      <GalleryFilterListComponent
        {...otherProps}
        data={data}
        onRefresh={photosQuery?.refetch}
        isFocused={isFocused}
        ref={ref}
        listKey={assetType}
        offset={offset}
        scrollY={scrollY}
        paused
        // onVisibleItemsChange={onVisibleItemsChange}
        numColumns={columnCount}
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
        // visibleDate={visibleDate}
        assetType={assetType}
        onChangeAlbum={handleChangeAlbum}
        album={album}
        setAssetType={_setAssetType}
      />
    </>
  );
};
