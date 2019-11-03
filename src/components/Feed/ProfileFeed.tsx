import * as React from "react";
import { Avatar } from "../Avatar";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { PostListItemFragment_profile } from "../../lib/graphql/PostListItemFragment";
import { MediumText } from "../Text";
import { IconButton } from "../Button";
import { IconEllipsis } from "../Icon";
import { SPACING, COLORS } from "../../lib/styles";

export const AVATAR_SIZE = 36;
export const PROFILE_FEED_HEIGHT = 36 + SPACING.normal * 2;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: SPACING.normal,
    height: PROFILE_FEED_HEIGHT,
    justifyContent: "space-between",
    alignItems: "center"
  },
  side: {
    flexDirection: "row",
    alignItems: "center"
  },
  right: {
    alignItems: "center",
    justifyContent: "flex-end"
  },
  username: {
    marginLeft: SPACING.half,
    fontSize: 16,
    color: "white"
  }
});

type Props = {
  profile: PostListItemFragment_profile;
  onPressEllipsis: () => Void;
};

export const ProfileFeedComponent = ({ profile, onPressEllipsis }: Props) => {
  return (
    <Animated.View style={styles.container}>
      <View style={styles.side}>
        <Avatar
          url={profile.photoURL}
          size={AVATAR_SIZE}
          label={profile.username}
        />

        <MediumText numberOfLines={1} adjustsSizeToFit style={styles.username}>
          {profile.username}
        </MediumText>
      </View>

      <View style={[styles.side, styles.right]}>
        <IconButton
          Icon={IconEllipsis}
          size={23}
          color={"#ccc"}
          onPress={onPressEllipsis}
        />
      </View>
    </Animated.View>
  );
};
