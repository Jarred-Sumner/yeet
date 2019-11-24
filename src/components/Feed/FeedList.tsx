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
  RefreshControl
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
import { useIsFocused } from "react-navigation-hooks";
import memoizee from "memoizee";
import Animated from "react-native-reanimated";
import { SPACING, COLORS } from "../../lib/styles";
import { scaleToWidth } from "../../lib/Rect";
import { MediaUploadContext } from "../../lib/MediaUploadTask";
import { MediaUploadProgress } from "../MediaUploadProgress";

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
  list: {
    flex: 1
  },
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
    itemVisiblePercentThreshold: 33,
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
        isVisible={!!this.state.visibleIDs[thread.id]}
        height={height}
        width={ITEM_WIDTH}
        onPressPost={this.props.onPressPost}
        onPressThread={this.props.onPressThread}
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
        offset: this.props.offset
      },
      updateQuery: (
        previousResult: ViewThreads,
        { fetchMoreResult }: { fetchMoreResult: ViewThreads }
      ) => {
        const data = uniqBy(
          [
            ...previousResult.postThreads.data,
            ...fetchMoreResult.postThreads.data
          ],
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
    this.flatListRef.current.flashScrollIndicators();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.initialLoad !== this.props.initialLoad &&
      Object.keys(this.state.visibleIDs).length === 0
    ) {
      this.setVisibleIDs(this.props.threads.slice(0, 2));
    }
  }

  handleRefresh = () => {
    try {
      typeof this.props.refetch === "function" && this.props.refetch();
    } catch (exception) {
      Sentry.captureException(exception);
      console.error(exception);
    }
  };

  scrollToTop = () => {
    this.flatListRef.current.scrollToOffset({
      offset: TOP_Y * -1,
      animated: true,
      viewPosition: 0
    });
    // this.handleRefresh();
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
      initialLoad,
      showMediaUpload,
      ...otherProps
    } = this.props;

    return (
      <FlatList
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="automatic"
        removeClippedSubviews={false}
        directionalLockEnabled
        scrollToOverflowEnabled
        vertical
        viewabilityConfig={this.viewabilityConfig}
        {...otherProps}
        data={threads}
        extraData={this.state.visibleIDs}
        onRefresh={this.handleRefresh}
        renderItem={this.renderItem}
        ItemSeparatorComponent={ItemSeparatorComponent}
        ListHeaderComponent={showMediaUpload ? MediaUploadProgress : null}
        keyExtractor={this.keyExtractor}
        initialNumToRender={6}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={this.handleRefresh}
            tintColor="white"
          />
        }
        onViewableItemsChanged={this.onViewableItemsChanged}
        style={styles.list}
        refreshing={refreshing}
        ref={this.flatListRef}
        getItemLayout={this.getItemLayout}
        onEndReached={this.handleEndReached}
      />
    );
  }
}

export const FeedList = React.forwardRef((props: FlatListProps, ref) => {
  const threadsQuery = useQuery<ViewThreads, ViewThreadsVariables>(
    VIEW_THREADS_QUERY,
    {
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
      partialRefetch: true,
      variables: {
        limit: 20,
        postsCount: 4
      }
    }
  );

  const _threads = uniqBy(threadsQuery?.data?.postThreads.data ?? [], "id");
  const threads = _threads.filter(thread => thread.posts.data.length > 0);
  const isFocused = useIsFocused();
  const { postUploadTask } = React.useContext(MediaUploadContext);

  return (
    <FeedListComponent
      {...props}
      threads={[...threads]}
      ref={ref}
      offset={threadsQuery?.data?.postThreads.offset}
      initialLoad={threadsQuery.loading}
      hasMore={threadsQuery?.data?.postThreads.hasMore}
      refetch={threadsQuery.refetch}
      showMediaUpload={!!postUploadTask}
      refreshing={threadsQuery.networkStatus === NetworkStatus.refetch}
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
