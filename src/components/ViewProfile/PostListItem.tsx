import * as React from "react";
import { View, StyleSheet } from "react-native";
import { PostListItemFragment } from "../../lib/graphql/PostListItemFragment";
import Image from "../Image";
import { SCREEN_DIMENSIONS } from "../../../config";
import { SPACING } from "../../lib/styles";
import { TouchableHighlight } from "react-native-gesture-handler";
import { buildImgSrc } from "../../lib/imgUri";

export const POST_LIST_ITEM_COLUMN_COUNT = 2;
const INSTRINSIC_WIDTH = SCREEN_DIMENSIONS.width / POST_LIST_ITEM_COLUMN_COUNT;

export const POST_LIST_ITEM_WIDTH =
  INSTRINSIC_WIDTH -
  (SPACING.half / POST_LIST_ITEM_COLUMN_COUNT) * POST_LIST_ITEM_COLUMN_COUNT;

export const POST_LIST_ITEM_HEIGHT =
  (SCREEN_DIMENSIONS.height / SCREEN_DIMENSIONS.width) * INSTRINSIC_WIDTH;

const styles = StyleSheet.create({
  section: {
    width: POST_LIST_ITEM_WIDTH,
    height: POST_LIST_ITEM_HEIGHT
  },
  container: {
    backgroundColor: "#111"
  },
  image: {}
});

type Props = {
  onPress: (id: string) => void;
  post: PostListItemFragment;
};

export const PostListItem = ({ post, onPress }: Props) => {
  const source = React.useMemo(() => {
    const uri = buildImgSrc(
      post.media.previewUrl,
      POST_LIST_ITEM_WIDTH,
      POST_LIST_ITEM_HEIGHT
    );

    return {
      uri,
      width: POST_LIST_ITEM_WIDTH,
      height: POST_LIST_ITEM_HEIGHT
    };
  }, [post.media]);
  const handlePress = React.useCallback(() => {
    return onPress(post.id);
  }, [post.id, onPress]);

  return (
    <TouchableHighlight onPress={handlePress} style={styles.section}>
      <View style={[styles.section, styles.container]}>
        <Image source={source} style={styles.section} resizeMode="cover" />
      </View>
    </TouchableHighlight>
  );
};
