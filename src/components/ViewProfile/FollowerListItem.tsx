import * as React from "react";
import { StyleSheet, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { SCREEN_DIMENSIONS } from "../../../config";
import { FollowerListItemFragment } from "../../lib/graphql/FollowerListItemFragment";
import { SPACING } from "../../lib/styles";
import { Avatar } from "../Avatar";
import { MediumText } from "../Text";

export const FOLLOWER_LIST_ITEM_HEIGHT = 64;

const styles = StyleSheet.create({
  section: {
    width: SCREEN_DIMENSIONS.width,
    height: FOLLOWER_LIST_ITEM_HEIGHT
  },
  container: {
    backgroundColor: "#111",
    position: "relative",
    paddingHorizontal: SPACING.normal,
    flexDirection: "row",
    alignItems: "center"
  },
  username: {
    fontSize: 20,
    marginLeft: SPACING.normal
  }
});

type Props = {
  onPress: (id: string) => void;
  profile: FollowerListItemFragment;
};

export const FollowerListItem = ({ profile, onPress }: Props) => {
  const handlePress = React.useCallback(() => {
    return onPress(profile.id);
  }, [profile.id, onPress]);

  return (
    <TouchableHighlight onPress={handlePress} style={styles.section}>
      <View style={[styles.section, styles.container]}>
        <Avatar size={48} url={profile.photoURL} username={profile.username} />

        <MediumText style={styles.username}>{profile.username}</MediumText>
      </View>
    </TouchableHighlight>
  );
};
