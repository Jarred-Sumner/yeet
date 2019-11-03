import {
  NetworkStatus,
  FetchMoreQueryOptions,
  FetchMoreOptions
} from "apollo-client";
import { sum, uniqBy } from "lodash";
import * as React from "react";
import { useQuery } from "react-apollo";
import { StyleSheet, FlatListProps } from "react-native";
import { SCREEN_DIMENSIONS } from "../../../config";
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
  }
});

class FeedListComponent extends React.Component<Props, State> {
  state = {
    visibleIndex: 0
  };
  viewabilityConfig = {
    waitForInteraction: false,
    viewAreaCoveragePercentThreshold: 10
  };

  onViewableItemsChanged = ({ viewableItems = [], changed } = {}) => {
    if (viewableItems.length > 0) {
      const [{ index: visibleIndex = -1 }] = viewableItems;
      this.setState({ visibleIndex });
    } else {
      this.setState({ visibleIndex: -1 });
    }
  };

  handlePressPost = (post: ViewThreads_postThreads_posts) => {};

  renderItem = ({
    item,
    index
  }: {
    item: ViewThreads_postThreads;
    index: number;
  }) => {
    const height = getItemHeight(item, ITEM_WIDTH);

    const isVisible = this.state.visibleIndex === index;

    return (
      <FeedListItem
        thread={item}
        height={height}
        width={ITEM_WIDTH}
        onPressPost={this.handlePressPost}
        isVisible={isVisible}
      />
    );
  };

  getItemLayout = (_data, index) => {
    const offset = sum(
      _data.slice(0, index).map(thread => getItemHeight(thread, ITEM_WIDTH))
    );

    const thread = _data[index];

    const length = getItemHeight(thread, ITEM_WIDTH);

    return {
      length,
      offset,
      index
    };
  };

  keyExtractor = item => item.id;

  handleEndReached = () => {
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

  render() {
    const {
      threads,
      refreshing,
      fetchMore,
      loading,
      error,
      ...otherProps
    } = this.props;

    return (
      <FlatList
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="automatic"
        removeClippedSubviews
        directionalLockEnabled
        viewabilityConfig={this.viewabilityConfig}
        {...otherProps}
        data={threads}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
        onViewableItemsChanged={this.onViewableItemsChanged}
        style={styles.list}
        extraData={this.state}
        refreshing={refreshing}
        getItemLayout={this.getItemLayout}
        onEndReached={this.handleEndReached}
      />
    );
  }
}

export const FeedList = (props: FlatListProps) => {
  const threadsQuery = useQuery<ViewThreads, ViewThreadsVariables>(
    VIEW_THREADS_QUERY,
    {
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
      variables: {
        limit: 20,
        postsCount: 4
      }
    }
  );

  const _threads = uniqBy(threadsQuery?.data?.postThreads.data ?? [], "id");
  const threads = _threads.filter(thread => thread.posts.data.length > 0);

  return (
    <FeedListComponent
      {...props}
      threads={threads}
      offset={threadsQuery?.data?.postThreads.offset}
      hasMore={threadsQuery?.data?.postThreads.hasMore}
      refreshing={threadsQuery.networkStatus === NetworkStatus.refetch}
      loading={[NetworkStatus.loading, NetworkStatus.setVariables].includes(
        threadsQuery.networkStatus
      )}
      error={threadsQuery.error}
      fetchMore={threadsQuery.fetchMore}
    />
  );
};
