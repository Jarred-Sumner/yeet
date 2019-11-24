import * as React from "react";
import { View } from "react-native";
import { BottomTabBar, TAB_BAR_HEIGHT } from "../components/BottomTabBar";
import { NotificationsList } from "../components/Notifications/NotificationList";
import { useNavigation } from "react-navigation-hooks";
import {
  NotificationPressAvatarFunction,
  NotificationPressFunction,
  NotificationObjectType
} from "../components/Notifications/NotificationListItem";
import { useLazyQuery, useApolloClient } from "react-apollo";
import VIEW_POST_QUERY from "../lib/ViewPostQuery.graphql";
import { ViewPost, ViewPostVariables } from "../lib/graphql/ViewPost";

export const NotificationsPage = ({}) => {
  const navigation = useNavigation();
  const client = useApolloClient();

  const handlePressAvatar: NotificationPressAvatarFunction = React.useCallback(
    (profileId: string) => {
      navigation.navigate("ViewProfile", { profileId });
    },
    [navigation]
  );

  const handlePressNotification: NotificationPressFunction = React.useCallback(
    (id: string, type: NotificationObjectType) => {
      if (type === NotificationObjectType.post) {
        client
          .query<ViewPost, ViewPostVariables>({
            query: VIEW_POST_QUERY,
            variables: {
              id: id
            }
          })
          .then(result => {
            const post = result?.data?.post;

            if (post) {
              navigation.navigate("ViewThread", {
                threadId: post.threadId,
                post,
                postId: post.id
              });
            }
          });
      } else if (type === NotificationObjectType.profile) {
        navigation.navigate("ViewProfile", { profileId: id });
      }
    },
    [navigation, client]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <NotificationsList
        contentOffset={{
          y: 0,
          x: 0
        }}
        contentInset={{
          bottom: TAB_BAR_HEIGHT,
          top: 0
        }}
        onPressAvatar={handlePressAvatar}
        onPressItem={handlePressNotification}
      />
      <BottomTabBar currentRoute="NotificationsTab" />
    </View>
  );
};

export default NotificationsPage;
