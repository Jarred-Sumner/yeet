import * as React from "react";
import { Avatar } from "../Avatar";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { PostListItemFragment_profile } from "../../lib/graphql/PostListItemFragment";
import { MediumText, Text } from "../Text";
import { IconButton } from "../Button";
import { IconEllipsis } from "../Icon";
import { SPACING, COLORS } from "../../lib/styles";
import { Timestamp } from "../Timestamp";

export const AVATAR_SIZE = 42;
export const PROFILE_FEED_HEIGHT = 42 + SPACING.normal * 2;

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
  timestamp: {
    color: "rgb(107, 107, 107)",
    fontSize: 14,
    lineHeight: 14,
    alignItems: "center"
  },
  username: {
    fontSize: 14,
    lineHeight: 14,
    color: "#999",
    alignItems: "center",
    textAlignVertical: "center"
  },
  textHeader: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center"
  },
  circle: {
    backgroundColor: "rgb(95, 95, 95)",
    width: 4,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    alignContent: "center",
    marginLeft: SPACING.half,
    marginRight: SPACING.half
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    textAlignVertical: "center",
    marginLeft: SPACING.normal * 0.75
  },
  bodyText: {
    fontSize: 16
  }
});

type Props = {
  profile: PostListItemFragment_profile;
  onPressEllipsis: () => void;
};

export const ProfileFeedComponent = ({
  profile,
  onPressEllipsis,
  createdAt,
  body
}: Props) => {
  return (
    <Animated.View style={styles.container}>
      <View style={styles.side}>
        <View style={styles.avatar}>
          <Avatar
            url={profile.photoURL}
            size={AVATAR_SIZE}
            label={profile.username}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.textHeader}>
            <Text numberOfLines={1} adjustsSizeToFit style={styles.username}>
              {profile.username}
            </Text>

            <View style={styles.circle} />

            <Timestamp time={createdAt} style={styles.timestamp} />
          </View>

          <View style={styles.bodyTextContainer}>
            <MediumText
              style={styles.bodyText}
              adjustsSizeToFit
              numberOfLines={1}
            >
              {body}
            </MediumText>
          </View>
        </View>
      </View>

      <View style={[styles.side, styles.right]}>
        <IconButton
          Icon={IconEllipsis}
          size={6}
          containerSize={23}
          type="shadow"
          color={"#999"}
          onPress={onPressEllipsis}
        />
      </View>
    </Animated.View>
  );
};
