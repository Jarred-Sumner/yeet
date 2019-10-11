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

export const NotificationsPage = ({}) => {
  const navigation = useNavigation();

  const handlePressAvatar: NotificationPressAvatarFunction = React.useCallback(
    (profileId: string) => {
      navigation.navigate("ViewProfile", { profileId });
    },
    [navigation]
  );

  const handlePressNotification: NotificationPressFunction = React.useCallback(
    (id: string, type: NotificationObjectType) => {
      if (type === NotificationObjectType.post) {
        navigation.navigate("ViewPost", { postId: id });
      } else if (type === NotificationObjectType.profile) {
        navigation.navigate("ViewProfile", { profileId: id });
      }
    },
    [navigation]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#111" }}>
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
