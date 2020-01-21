import * as React from "react";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "../Text";
import { BaseButton } from "react-native-gesture-handler";
import { Avatar, CurrentUserAvatar } from "../Avatar";
import { AVATAR_SIZE } from "../Feed/ProfileFeed";
import { UserContext } from "../UserContext";
export const textCommentStyles = StyleSheet.create({
  textContainer: {
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    overflow: "hidden"
  },
  container: {
    position: "relative",
    overflow: "visible"
  },
  avatar: {},
  text: {
    fontSize: 14,
    maxWidth: 200,
    maxHeight: 66
  },
  shadowContainer: {
    shadowRadius: 1,
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowOpacity: 0.25,
    shadowColor: "black"
  },
  touchable: {
    overflow: "visible"
  },
  avatarContainer: {
    position: "absolute",
    top: AVATAR_SIZE / -2,
    left: AVATAR_SIZE / -2,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    height: AVATAR_SIZE
  },
  username: {
    marginLeft: 4,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    fontSize: 12,
    alignSelf: "center",
    opacity: 0.65,
    textAlignVertical: "center",
    height: AVATAR_SIZE,
    color: "#fff",
    textShadowOffset: {
      width: 1,
      height: 1
    },
    textShadowRadius: 1
  }
});

export const TextCommentAvatar = React.memo(({ username, photoURL, onTap }) => {
  return (
    <View style={textCommentStyles.avatarContainer}>
      <BaseButton
        disallowInterruption
        style={textCommentStyles.touchable}
        onPress={onTap}
      >
        <Animated.View>
          <Avatar
            label={username}
            url={photoURL}
            size={AVATAR_SIZE}
            style={textCommentStyles.avatar}
          />
        </Animated.View>
      </BaseButton>

      <BaseButton
        disallowInterruption
        style={textCommentStyles.touchable}
        onPress={onTap}
      >
        <Animated.View>
          <Text style={textCommentStyles.username}>{username}</Text>
        </Animated.View>
      </BaseButton>
    </View>
  );
});

export const CurrentUserCommentAvatar = () => {
  const { currentUser: { username } = {} } = React.useContext(UserContext);

  return (
    <View style={textCommentStyles.avatarContainer}>
      <CurrentUserAvatar size={AVATAR_SIZE} style={textCommentStyles.avatar} />
      <Text style={textCommentStyles.username}>{username}</Text>
    </View>
  );
};
