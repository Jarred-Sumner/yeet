import * as React from "react";
import { View, StyleSheet } from "react-native";
import { LikeCountButton } from "../ThreadList/LikeCountButton";
import CountButton from "../ThreadList/CountButton";
import { BitmapIconNewPost } from "../BitmapIcon";
import { SPACING } from "../../lib/styles";

export const ACTION_BAR_HEIGHT = 54;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal,
    height: ACTION_BAR_HEIGHT
  },
  spacer: {
    width: SPACING.normal,
    height: 1
  }
});

export const ContentActionBar = ({
  onPressRemix,
  onPressLike,
  remixCount,
  postId
}) => {
  return (
    <View style={styles.container}>
      <LikeCountButton size={24} id={postId} onPress={onPressLike} />
      <View style={styles.spacer} />

      <CountButton
        iconNode={
          <View
            style={{
              width: 26,
              height: 31,
              overflow: "visible"
            }}
          >
            <BitmapIconNewPost
              style={{
                height: 31,
                width: 31,
                position: "absolute",
                top: 0,
                overflow: "visible"
              }}
            />
          </View>
        }
        size={26}
        count={remixCount}
        type="shadow"
        onPress={onPressRemix}
      />
    </View>
  );
};
