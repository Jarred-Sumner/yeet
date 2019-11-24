import { FetchMoreOptions, NetworkStatus } from "apollo-client";
import { uniqBy } from "lodash";
import * as React from "react";
import { useQuery, useMutation, MutationFunction } from "react-apollo";
import { StyleSheet, InteractionManager } from "react-native";
import { useFocusEffect } from "react-navigation-hooks";
import { NotificationsListItemFragment } from "../../lib/graphql/NotificationsListItemFragment";
import {
  NotificationsListQuery,
  NotificationsListQueryVariables
} from "../../lib/graphql/NotificationsListQuery";
import NOTIFICATIONS_LIST_QUERY from "../../lib/NotificationsListQuery.graphql";
import FlatList from "../FlatList";
import { isActivelyRefetching } from "../../lib/graphql";
import {
  NOTIFICATION_HEIGHT,
  NotificationListItem,
  NotificationPressFunction,
  NotificationPressAvatarFunction
} from "./NotificationListItem";
import ItemSeparatorComponent from "../ItemSeparatorComponent";
import READ_ALL_NOTIFICATIONS_MUTATION from "../../lib/ReadAllNotificationsMutation.graphql";
import { ReadAllNotificationsMutation } from "../../lib/graphql/ReadAllNotificationsMutation";
import { useInteractionManager } from "react-native-hooks";
import { RefreshControl as RefreshControlComponent } from "react-native";
import CURRENT_USER_QUERY from "../../lib/currentUserQuery.graphql";

const RefreshControl = ({ title, tintColor = "#FCFCFC", ...otherProps }) => (
  <RefreshControlComponent
    {...otherProps}
    tintColor={tintColor}
    title={title}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1 }
});

type Props = {
  data: Array<NotificationsListItemFragment>;
  networkStatus: NetworkStatus;
  fetchMore: (
    opts: FetchMoreOptions<
      NotificationsListQuery,
      NotificationsListQueryVariables
    >
  ) => void;
  loading: Boolean;
  hasMore: Boolean;
  clearAllNotifications: MutationFunction<ReadAllNotificationsMutation>;
  onRefresh: () => void;
  onPressItem: NotificationPressFunction;
  onPressAvatar: NotificationPressAvatarFunction;
};

class NotificationsListComponent extends React.Component<Props> {
  renderItem = ({ item, index }) => {
    return (
      <NotificationListItem
        notification={item}
        onPress={this.props.onPressItem}
        onPressAvatar={this.props.onPressAvatar}
      />
    );
  };

  componentDidMount() {
    if (this.props.data.length > 0) {
      this.clearAllNotifications();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data.length === 0 && this.props.data.length > 0) {
      this.clearAllNotifications();
    }
  }

  clearAllNotifications = () => {
    InteractionManager.runAfterInteractions(() => {
      this.props.clearAllNotifications && this.props.clearAllNotifications();
    });
  };

  getItemLayout = (_data, index) => ({
    length: NOTIFICATION_HEIGHT,
    offset: NOTIFICATION_HEIGHT * index + StyleSheet.hairlineWidth * index,
    index
  });

  handleEndReached = () => {
    if (!this.props.hasMore) {
      return;
    }

    this.props.fetchMore({
      variables: {
        offset: this.props.data.length,
        limit: 20
      },
      updateQuery: (
        previousResult: NotificationsListQuery,
        { fetchMoreResult }: { fetchMoreResult: NotificationsListQuery }
      ) => {
        return {
          ...fetchMoreResult,
          notifications: {
            ...fetchMoreResult.notifications,
            data: uniqBy(
              [
                ...previousResult.notifications.data,
                ...fetchMoreResult.notifications.data
              ],
              "id"
            )
          }
        };
      }
    });
  };

  keyExtractor = ({ id }) => id;

  render() {
    const {
      data,
      loading,
      hasMore,
      onRefresh,
      networkStatus,
      fetchMore,
      clearAllNotifications,
      ...otherProps
    } = this.props;

    const isRefreshing = isActivelyRefetching(networkStatus);

    return (
      <FlatList
        {...otherProps}
        renderItem={this.renderItem}
        data={data}
        onRefresh={onRefresh}
        refreshControl={
          <RefreshControlComponent
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            tintColor="#F1F1F1"
          />
        }
        directionalLockEnabled
        getItemLayout={this.getItemLayout}
        keyExtractor={this.keyExtractor}
        contentInsetAdjustmentBehavior="automatic"
        refreshing={isRefreshing}
        ItemSeparatorComponent={ItemSeparatorComponent}
        style={styles.container}
        onEndReached={this.handleEndReached}
      ></FlatList>
    );
  }
}

export const NotificationsList = ({
  onPressItem,
  onPressAvatar,
  ...otherProps
}: {
  onPressItem: NotificationPressFunction;
  onPressAvatar: NotificationPressAvatarFunction;
}) => {
  const {
    loading,
    data: { notifications: { data = [], hasMore = false } = {} } = {
      notifications: { data: [], hasMore: false }
    },
    fetchMore,
    refetch = () => {},
    networkStatus
  } = useQuery<NotificationsListQuery, NotificationsListQueryVariables>(
    NOTIFICATIONS_LIST_QUERY,
    {
      variables: {
        offset: 0,
        limit: 20
      }
    }
  ) || { refetch: () => {} };

  const [clearAllNotifications] = useMutation(READ_ALL_NOTIFICATIONS_MUTATION, {
    update(cache) {
      const { notifications } = cache.readQuery<
        NotificationsListQuery,
        NotificationsListQueryVariables
      >({
        query: NOTIFICATIONS_LIST_QUERY,
        variables: {
          offset: 0,
          limit: 20
        }
      });
      cache.writeQuery({
        query: NOTIFICATIONS_LIST_QUERY,
        variables: {
          offset: 0,
          limit: 20
        },
        data: {
          notifications: {
            ...notifications,
            data: notifications.data.map(notif => {
              return {
                ...notif,
                status: "read"
              };
            })
          }
        }
      });
    },
    refetchQueries: [
      {
        query: CURRENT_USER_QUERY
      }
    ]
  });

  const reloadData = React.useCallback(() => {
    if (!loading) {
      refetch({
        offset: 0,
        limit: 20
      });
    }
  }, [refetch, loading]);

  const handleRefresh = React.useCallback(() => {
    reloadData();
  }, [reloadData]);

  useFocusEffect(reloadData);

  return (
    <NotificationsListComponent
      {...otherProps}
      data={data}
      onRefresh={handleRefresh}
      loading={loading}
      hasMore={hasMore}
      fetchMore={fetchMore}
      clearAllNotifications={clearAllNotifications}
      onPressAvatar={onPressAvatar}
      networkStatus={networkStatus}
      onPressItem={onPressItem}
    />
  );
};
