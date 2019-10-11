import * as React from "react";
import { View, StyleSheet } from "react-native";
import { NotificationsListItemFragment } from "../../lib/graphql/NotificationsListItemFragment";
import { SemiBoldText, MediumText, Text } from "../Text";
import { Avatar } from "../Avatar";
import { COLORS, SPACING } from "../../lib/styles";
import {
  LongPressGestureHandler,
  BaseButton,
  TouchableHighlight
} from "react-native-gesture-handler";
import { Timestamp } from "../Timestamp";

export enum NotificationKind {
  unknown = "unknown",
  liked_post = "liked_post",
  remixed_post = "remixed_post",
  new_post_in_thread = "new_post_in_thread",
  started_following_you = "started_following_you"
}

export enum NotificationObjectType {
  post = "post",
  profile = "profile"
}

export const getNotificationObjectType = (
  notification: NotificationsListItemFragment
) => {
  if (notification.notifiableType === "Post") {
    return NotificationObjectType.post;
  } else if (["Profile", "User"].includes(notification.notifiableType)) {
    return NotificationObjectType.profile;
  } else {
    return null;
  }
};

export const NOTIFICATION_HEIGHT = 72;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: SPACING.normal,

    alignItems: "center",
    overflow: "hidden",
    height: NOTIFICATION_HEIGHT
  },
  spacer: {
    width: SPACING.normal,
    height: 1
  },
  label: {
    color: "#f1f1f1",
    fontSize: 16,
    lineHeight: 24,
    flex: 1
  },
  username: {
    // color: COLORS.secondary
  },
  timestamp: {
    color: COLORS.muted
  }
});

export type NotificationPressFunction = (
  id: string,
  object: NotificationObjectType
) => void;

export type NotificationPressAvatarFunction = (userId: string) => void;

type Props = {
  notification: NotificationsListItemFragment;
  onPress: NotificationPressFunction;
};

const NotificationAvatar = React.forwardRef(
  (
    {
      notification,
      onPressAvatar,
      ...otheerProps
    }: {
      notification: NotificationsListItemFragment;
      onPressAvatar: NotificationPressAvatarFunction;
    },
    ref
  ) => {
    let profile = notification.participant;
    const handlePress = React.useCallback(() => {
      if (profile && profile.id) {
        onPressAvatar(profile.id);
      }
    }, [profile]);
    if (profile) {
      return (
        <BaseButton onPress={handlePress} ref={ref}>
          <Avatar
            {...otheerProps}
            size={48}
            label={profile.username}
            url={profile.photoURL}
            isLocal={false}
          />
        </BaseButton>
      );
    } else {
      return <CurrentUserAvatar {...otheerProps} size={48} />;
    }
  }
);

const Label = ({
  kind = null,
  notification
}: {
  kind: NotificationKind | null;
  notification: NotificationsListItemFragment;
}) => {
  const username =
    notification.participant && notification.participant.username;
  const nameText = username ? (
    <SemiBoldText style={styles.username}>@{username}</SemiBoldText>
  ) : (
    "Someone"
  );

  if (kind === NotificationKind.liked_post) {
    return (
      <Text numberOfLines={2} style={styles.label}>
        {nameText} liked your post.
      </Text>
    );
  } else if (kind === NotificationKind.new_post_in_thread) {
    return (
      <Text numberOfLines={2} style={styles.label}>
        {nameText} posted to a thread you're in.
      </Text>
    );
  } else if (kind === NotificationKind.remixed_post) {
    return (
      <Text numberOfLines={2} style={styles.label}>
        {nameText} remixed your post.
      </Text>
    );
  } else if (kind === NotificationKind.started_following_you) {
    return (
      <Text numberOfLines={2} style={styles.label}>
        {nameText} followed you.
      </Text>
    );
  } else {
    return (
      <Text numberOfLines={2} style={styles.label}>
        {notification.label}
      </Text>
    );
  }
};

const NotificationListItemComponent = ({
  kind,
  notification,
  onPress,
  onLongPress,
  onPressAvatar
}: Props & {
  kind: NotificationKind;
  onPressAvatar: NotificationPressAvatarFunction;
}) => {
  const avatarRef = React.createRef(null);

  const label = <Label kind={kind} notification={notification} />;
  const avatar = (
    <NotificationAvatar
      notification={notification}
      ref={avatarRef}
      onPressAvatar={onPressAvatar}
    />
  );

  return (
    <TouchableHighlight
      onLongPress={onLongPress}
      waitFor={avatarRef}
      onPress={onPress}
      underlayColor={"#333"}
    >
      <View style={styles.container}>
        {avatar}
        <View style={styles.spacer} />
        {label}

        <View style={styles.spacer} />
        <Timestamp time={notification.occurredAt} style={styles.timestamp} />
      </View>
    </TouchableHighlight>
  );
};

export const NotificationListItem = ({
  notification,
  onPress,
  onPressAvatar
}: Props) => {
  const kind = NotificationKind[notification.kind];
  const handlePress = React.useCallback(() => {
    onPress(notification.notifiableId, getNotificationObjectType(notification));
  }, [notification.id, getNotificationObjectType]);

  return (
    <NotificationListItemComponent
      onPressAvatar={onPressAvatar}
      onPress={handlePress}
      kind={kind}
      notification={notification}
    />
  );
};
