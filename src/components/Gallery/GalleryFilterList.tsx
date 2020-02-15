import { NetworkStatus } from "apollo-client";
import { chunk, flatMap } from "lodash";
import memoizee from "memoizee";
import * as React from "react";
import { useQuery } from "react-apollo";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { BOTTOM_Y, SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { PostSearchQuery_searchPosts_data } from "../../lib/graphql/PostSearchQuery";
import { YeetImageContainer } from "../../lib/imageSearch";
import IMAGE_SEARCH_QUERY from "../../lib/ImageSearchQuery.local.graphql";
import FastList from "../FastList";
import { registrations } from "../MediaPlayer/MediaPlayerComponent";
import { GallerySectionItem } from "../NewPost/ImagePicker/GallerySectionItem";
import { IMAGE_SEARCH_HEIGHT } from "../NewPost/ImagePicker/ImageSearch";
import { COLUMN_COUNT, COLUMN_GAP } from "./COLUMN_COUNT";
import { GalleryRow } from "./GalleryItem";
import { GalleryValue } from "./GallerySection";
import { SQUARE_ITEM_HEIGHT, SQUARE_ITEM_WIDTH } from "./sizes";
import { AssetSearchQuery_searchAssets_data } from "../../lib/graphql/AssetSearchQuery";
import KeyboardAvoidingView from "../KeyboardAvoidingView";
import { MediaPlayerPauser } from "../MediaPlayer/MediaPlayerContext";
import { COLORS } from "../../lib/styles";

const memoize = memoizee;
const SEPARATOR_HEIGHT = COLUMN_GAP * 2;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    flex: 0,
    overflow: "visible",
    position: "relative"
  },
  contentContainer: {
    // backgroundColor: COLORS.primaryDark,
    flexGrow: 1
  },
  modalContainer: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible"
  },
  wrapper: {
    width: SCREEN_DIMENSIONS.width,
    flex: 0,
    overflow: "visible"
    // backgroundColor: COLORS.primaryDark
  },
  modalWrapper: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible"
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

export const getPaginatedLimit = (columnCount: number, height: number) => {
  return Math.ceil((SCREEN_DIMENSIONS.height / height) * columnCount * 1.2);
};

export const getInitialLimit = (columnCount: number, height: number) => {
  return getPaginatedLimit(columnCount, height) * 4;
};

export class GalleryFilterListComponent extends React.PureComponent<Props> {
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

  setFlatListRef = (flatList: FastList) => {
    this.flatListRef = flatList;

    const { flatListRef } = this.props;

    if (flatListRef && typeof flatListRef === "function") {
      flatListRef(flatList.scrollView.current);
    } else if (
      typeof flatListRef === "object" &&
      flatListRef &&
      typeof flatList?.getScrollView === "function"
    ) {
      flatListRef.current = flatList.getScrollView();
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
    y: this.props.offset || 0,
    x: 0
  };
  contentInset = {
    top: this.props.inset || 0,
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
        transparent={this.props.isModal}
        resizeMode={this.props.resizeMode}
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
        transparent={this.props.isModal}
        resizeMode={this.props.resizeMode}
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
      children,
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
      listKey,
      ...otherProps
    } = this.props;
    const { showScrollView } = this.state;

    const ContainerComponent = View;
    const containerStyles = isModal
      ? [styles.modalWrapper, height]
      : [
          styles.wrapper,
          { height },
          {
            // transform: [
            //   {
            //     translateY: this.props.scrollY.interpolate({
            //       inputRange: [0, TOP_Y],
            //       outputRange: [0, TOP_Y],
            //       extrapolateRight: Animated.Extrapolate.CLAMP
            //     })
            //   }
            // ]
          }
          // {
          //   paddingTop: inset + TOP_Y,
          //   paddingBottom: bottomInset ?? BOTTOM_Y
          // }
        ];

    const { contentInset, contentOffset } = this;

    const isEmpty = this.sectionCounts[0] === 0;

    return (
      <MediaPlayerPauser isHidden={!isFocused}>
        <>
          <ContainerComponent height={height} style={containerStyles}>
            <FastList
              ref={this.setFlatListRef}
              contentInsetAdjustmentBehavior="never"
              keyboardDismissMode="on-drag"
              contentInset={this.contentInset}
              contentOffset={this.contentOffset}
              insetBottom={Math.abs(this.contentInset.bottom) * -1}
              insetTop={this.contentInset.top}
              scrollTopValue={this.props.scrollY}
              scrollIndicatorInsets={this.scrollIndicatorInsets}
              insetTopValue={this.props.insetValue}
              renderHeader={this.props.renderHeader}
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="always"
              isLoading={
                this.props.networkStatus === NetworkStatus.loading ||
                this.props.networkStatus === NetworkStatus.refetch ||
                this.props.networkStatus === NetworkStatus.fetchMore
              }
              renderRow={this.handleRenderRow}
              containerHeight={height}
              scrollToOverflowEnabled
              overScrollMode="automatic"
              footerHeight={0}
              headerHeight={headerHeight}
              style={this.listStyle}
              onScrollEnd={this.handleScrollEnd}
              isFastList
              listKey={listKey}
              renderEmpty={
                ListEmptyComponent ? this.renderListEmpty : undefined
              }
              rowHeight={this.props.itemHeight + SEPARATOR_HEIGHT}
              // sectionHeight={this.getTotalHeight}
              sections={this.sectionCounts}
            />
            {children}
          </ContainerComponent>
        </>
      </MediaPlayerPauser>
    );
  }
}

export const _buildValue = image => ({
  image,
  id: `${image.id}-cell`
});

export const buildValue = (data: Array<YeetImageContainer> = []) => {
  return (data || []).map(_buildValue);
};

export const postToCell = memoize(
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

const mediaToCell = memoize(
  media => {
    const {
      width,
      height,
      previewUrl,
      coverUrl,
      url,
      duration,
      mimeType,
      id
    } = media;

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
      id
    };
  },
  { max: 500 }
);

export const buildPostValue = (
  data: Array<PostSearchQuery_searchPosts_data> = []
) => {
  console.time("Create values");
  const values = (data || []).map(postToCell);
  console.timeEnd("Create values");
  return values;
};

export const buildMediaValue = (
  data: Array<AssetSearchQuery_searchAssets_data> = []
) => {
  console.time("Create values");
  const values = (data || []).map(mediaToCell);
  console.timeEnd("Create values");
  return values;
};
