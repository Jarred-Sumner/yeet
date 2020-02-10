import {
  NetworkStatus,
  FetchMoreQueryOptions,
  FetchMoreOptions
} from "apollo-client";
import { sum, uniqBy, fromPairs } from "lodash";
import * as React from "react";
import { useQuery } from "react-apollo";
import * as Sentry from "@sentry/react-native";
import {
  StyleSheet,
  FlatListProps,
  FlatList as RNFlatList,
  ListRenderItem,
  ViewabilityConfig,
  View,
  RefreshControl,
  Platform
} from "react-native";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import {
  ViewThreads,
  ViewThreadsVariables,
  ViewThreads_postThreads,
  ViewThreads_postThreads_posts,
  ViewThreads_postThreads_data
} from "../../lib/graphql/ViewThreads";
import FlatList from "../FlatList";
import VIEW_THREADS_QUERY from "../../lib/ViewThreads.graphql";
import { FeedListItem, getItemHeight } from "./FeedListItem";
import { useIsFocused } from "@react-navigation/core";
import memoizee from "memoizee";
import Animated from "react-native-reanimated";
import { SPACING, COLORS } from "../../lib/styles";
import { scaleToWidth } from "../../lib/Rect";
import {
  MediaUploadContext,
  PostUploadTaskType,
  PostUploadTaskStatus
} from "../../lib/MediaUploadTask";
import { MediaUploadProgress } from "../MediaUploadProgress";
import { throttle } from "lodash";
import FastList from "../FastList";
import { useSafeArea } from "react-native-safe-area-context";
import { TAB_BAR_HEIGHT } from "../BottomTabBar";
import { FeedHeader, FEED_HEADER_HEIGHT } from "./FeedHeader";

const ITEM_SEPARATOR_HEIGHT = SPACING.half;

type Props = {
  threads: Array<ViewThreads_postThreads_data>;
  offset: number;
  hasMore: boolean;
  refreshing: boolean;
  loading: boolean;
  error?: Error;
  fetchMore: (
    opts: FetchMoreOptions<ViewThreads_postThreads, ViewThreadsVariables>
  ) => void;
};

const ITEM_WIDTH = SCREEN_DIMENSIONS.width;

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.height
  },
  contentContainer: { flex: 0 },

  separator: {
    height: 1,
    marginVertical: ITEM_SEPARATOR_HEIGHT / 2 - 1,
    width: SCREEN_DIMENSIONS.width,
    backgroundColor: "#111"
  }
});

const ItemSeparatorComponent = () => <View style={styles.separator} />;

type SectionedThread = {
  isVisible: Boolean;
  index: number;
  thread: ViewThreads_postThreads_data;
};

const _sectionThreads = (
  thread: ViewThreads_postThreads_data,
  index: number,
  isVisible: Boolean
): SectionedThread => {
  return {
    thread,
    index,
    isVisible
  };
};

const sectionedThread = memoizee(_sectionThreads);

const sectionThreads = (
  threads: Array<ViewThreads_postThreads_data>,
  visibleIDs: Object
) => {
  return threads.map((thread, index) => {
    return _sectionThreads(
      thread,
      index,
      visibleIDs ? !!visibleIDs[thread.id] : false
    );
    // return sectionedThread(thread, index, !!visibleIDs[thread.id]);
  });
};

class FeedListComponent extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      visibleIDs: {}
    };
  }

  viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 20,
    waitForInteraction: false
  };

  static defaultProps = {
    contentInset: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },
    contentOffset: {
      x: 0,
      y: 0
    }
  };

  onViewableItemsChanged = ({ viewableItems = [], changed } = {}) => {
    this.setVisibleIDs(viewableItems.map(entry => entry.item));
  };

  setVisibleIDs = (items: Array<ViewThreads_postThreads_data>) => {
    const pairs = items.map(item => [item.id, true]);
    const visibleIDs = fromPairs(pairs);
    this.setState({ visibleIDs });

    // const [firstItem, secondItem] = items;
    // this.firstVisibleItem.setValue(firstItem ? firstItem.id.hashCode() : -1);
    // this.secondVisibleItem.setValue(secondItem ? secondItem.id.hashCode() : -1);
  };

  firstVisibleItem = new Animated.Value(-1);
  secondVisibleItem = new Animated.Value(-1);

  renderItem: ListRenderItem<ViewThreads_postThreads_data> = ({
    item: thread,
    index
  }) => {
    const height = getItemHeight(thread, ITEM_WIDTH);
    return (
      <FeedListItem
        thread={thread}
        hashId={thread.id.hashCode()}
        isVisible
        height={height}
        width={ITEM_WIDTH}
        onPressPost={this.props.onPressPost}
        onPressThread={this.props.onPressThread}
        onPressProfile={this.props.onPressProfile}
        waitFor={[this.flatListRef]}
        onPressNewPost={this.props.onPressNewPost}
        onLongPressThread={this.props.onLongPressThread}
      />
    );
  };

  getItemLayout = (_data, index) => {
    const offset = sum(
      _data.slice(0, index).map(row => getItemHeight(row, ITEM_WIDTH))
    );

    const thread = _data[index];

    const length = getItemHeight(thread, ITEM_WIDTH);

    return {
      length,
      offset: offset + ITEM_SEPARATOR_HEIGHT * index,
      index
    };
  };

  keyExtractor = item => item.id;

  handleEndReached = () => {
    if (
      this.props.loading ||
      this.props.threads.length === 0 ||
      typeof this.props.fetchMore !== "function"
    ) {
      return;
    }

    this.props.fetchMore({
      variables: {
        offset: this.props.threads.length
      },
      updateQuery: (
        previousResult: ViewThreads,
        { fetchMoreResult }: { fetchMoreResult: ViewThreads }
      ) => {
        const data = uniqBy(
          previousResult.postThreads.data.concat(
            fetchMoreResult.postThreads.data
          ),
          "id"
        );

        return {
          ...fetchMoreResult,
          postThreads: {
            ...fetchMoreResult.postThreads,
            data
          }
        };
      }
    });
  };

  flatListRef = React.createRef<RNFlatList>();

  componentDidMount() {
    // this.flatListRef.current.flashScrollIndicators();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.initialLoad !== this.props.initialLoad &&
      Object.keys(this.state.visibleIDs).length === 0
    ) {
      this.setVisibleIDs(this.props.threads.slice(0, 2));
    }

    if (
      this.props.postUploadStatus === PostUploadTaskStatus.complete &&
      prevProps.postUploadStatus !== PostUploadTaskStatus.complete
    ) {
      Promise.resolve(() => this.handleRefresh()).then(() => {
        this.props.clearPostUploadTask();
      });
    }
  }

  handleRefresh = () => {
    try {
      return (
        typeof this.props.refetch === "function" &&
        this.props.refetch({
          variables: {
            limit: 20,
            postsCount: 4
          }
        })
      );
    } catch (exception) {
      Sentry.captureException(exception);
      console.error(exception);
    }
  };

  scrollToTop = () => {
    this.flatListRef.current.scrollToLocation(0, 0, true);
    this.handleRefresh();
  };

  getTotalHeight = (section: number) => {
    if (section === 0) {
      return sum(
        this.props.threads
          .slice(0, this.props.threads.length)
          .map(row => getItemHeight(row, ITEM_WIDTH))
      );
    } else {
      return 0;
    }
  };

  handleRenderRow = (section: number, row: number) => {
    return this.renderItem({
      index: row,
      item: this.props.threads[row]
    });
  };

  renderHeader = () => {
    return <FeedHeader />;
  };

  getRowHeight = (section: number, row?: number) => {
    const thread = this.props.threads[section];

    return getItemHeight(thread, ITEM_WIDTH);
  };

  render() {
    const {
      threads,
      refreshing,
      fetchMore,
      onRefresh,
      loading,
      refetch,
      error,
      insetTop,
      contentInset,
      sections,

      contentOffset,
      initialLoad,
      showMediaUpload,
      onPressProfile,
      ...otherProps
    } = this.props;

    return (
      <FastList
        contentInset={contentInset}
        contentOffset={contentOffset}
        insetTop={insetTop}
        renderRow={this.handleRenderRow}
        renderHeader={this.renderHeader}
        listKey="feed"
        containerHeight={SCREEN_DIMENSIONS.height}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={this.handleRefresh}
            tintColor="white"
          />
        }
        headerHeight={FEED_HEADER_HEIGHT}
        uniform={false}
        insetBottom={ITEM_SEPARATOR_HEIGHT}
        onScrollEnd={this.handleEndReached}
        footerHeight={0}
        rowHeight={this.getRowHeight}
        // sectionHeight={this.getTotalHeight}
        sections={sections}
      />
    );

    // return (
    //   <FlatList
    //     {...otherProps}
    //     keyboardShouldPersistTaps="always"
    //     keyboardDismissMode="interactive"
    //     contentInsetAdjustmentBehavior="never"
    //     directionalLockEnabled
    //     scrollToOverflowEnabled
    //     removeClippedSubviews={Platform.select({
    //       ios: false,
    //       android: true
    //     })}
    //     vertical
    //     viewabilityConfig={this.viewabilityConfig}
    //     data={threads}
    //     extraData={this.state.visibleIDs}
    //     onRefresh={this.handleRefresh}
    //     renderItem={this.renderItem}
    //     ItemSeparatorComponent={ItemSeparatorComponent}
    //     ListHeaderComponent={showMediaUpload ? MediaUploadProgress : null}
    //     keyExtractor={this.keyExtractor}
    //     initialNumToRender={6}
    //     refreshControl={
    //       <RefreshControl
    //         refreshing={refreshing}
    //         onRefresh={this.handleRefresh}
    //         tintColor="white"
    //       />
    //     }
    //     onViewableItemsChanged={this.onViewableItemsChanged}
    //     style={styles.list}
    //     refreshing={refreshing}
    //     ref={this.flatListRef}
    //     getItemLayout={this.getItemLayout}
    //     onEndReached={this.handleEndReached}
    //   />
    // );
  }
}

export const FeedList = React.forwardRef((props: FlatListProps, ref) => {
  const { top, bottom } = useSafeArea();
  const threadsQuery = useQuery<ViewThreads, ViewThreadsVariables>(
    VIEW_THREADS_QUERY,
    {
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
      variables: {
        limit: 10,
        postsCount: 4
      }
    }
  );

  const _threads = uniqBy(threadsQuery?.data?.postThreads.data ?? [], "id");
  const threads = _threads.filter(thread => thread.posts.data.length > 0);
  const isFocused = useIsFocused();
  const { postUploadTask, status, setPostUploadTask } = React.useContext(
    MediaUploadContext
  );
  const showMediaUpload = postUploadTask?.type === PostUploadTaskType.newThread;
  const clearPostUploadTask = React.useCallback(() => {
    setPostUploadTask(null);
  }, [setPostUploadTask]);

  const sections = React.useMemo(() => {
    return [threads.length];
  }, [threads, threads.length]);

  const contentInset = React.useMemo(
    () => ({ top, bottom: bottom + TAB_BAR_HEIGHT, left: 0, right: 0 }),
    [top, bottom, TAB_BAR_HEIGHT]
  );
  const contentOffset = React.useMemo(() => ({ y: top * -1, x: 0 }), [top]);
  return (
    <FeedListComponent
      {...props}
      threads={threads}
      ref={ref}
      offset={threadsQuery?.data?.postThreads.offset ?? 0}
      contentInset={contentInset}
      contentOffset={contentOffset}
      insetTop={0}
      initialLoad={threadsQuery.loading}
      hasMore={threadsQuery?.data?.postThreads.hasMore}
      refetch={threadsQuery?.refetch}
      showMediaUpload={showMediaUpload}
      refreshing={threadsQuery?.networkStatus === NetworkStatus.refetch}
      isFocused={isFocused}
      clearPostUploadTask={clearPostUploadTask}
      postUploadStatus={showMediaUpload ? status : undefined}
      sections={sections}
      loading={[
        NetworkStatus.loading,
        NetworkStatus.setVariables,
        NetworkStatus.fetchMore
      ].includes(threadsQuery.networkStatus)}
      error={threadsQuery.error}
      fetchMore={threadsQuery.fetchMore}
    />
  );
});
