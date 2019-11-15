import * as React from "react";
import { View, StyleSheet, PixelRatio } from "react-native";
import { PostListItemFragment } from "../../lib/graphql/PostListItemFragment";
import Image from "../Image";
import { SCREEN_DIMENSIONS } from "../../../config";
import { SPACING, COLORS } from "../../lib/styles";
import { TouchableHighlight } from "react-native-gesture-handler";
import { buildImgSrc } from "../../lib/imgUri";
import { IconHeart, IconComment } from "../Icon";
import { MediumText } from "../Text";
import { Avatar } from "../Avatar";
import LinearGradient from "react-native-linear-gradient";
import { scaleToWidth, pxBoundsToPoint } from "../../lib/Rect";
import { MAX_POST_HEIGHT } from "../NewPost/NewPostFormat";

export const POST_LIST_ITEM_COLUMN_COUNT = 3;
const INSTRINSIC_WIDTH =
  SCREEN_DIMENSIONS.width / POST_LIST_ITEM_COLUMN_COUNT -
  SPACING.normal / POST_LIST_ITEM_COLUMN_COUNT;

const {
  width: POST_LIST_ITEM_WIDTH,
  height: _POST_LIST_ITEM_HEIGHT
} = scaleToWidth(INSTRINSIC_WIDTH, {
  width: SCREEN_DIMENSIONS.width,
  height: MAX_POST_HEIGHT
});

export const POST_LIST_ITEM_HEIGHT = _POST_LIST_ITEM_HEIGHT - SPACING.normal;
export { POST_LIST_ITEM_WIDTH };

const styles = StyleSheet.create({
  section: {
    width: POST_LIST_ITEM_WIDTH,
    height: POST_LIST_ITEM_HEIGHT
  },
  extraSpacing: {
    marginRight: POST_LIST_ITEM_WIDTH
  },
  container: {
    backgroundColor: "#111",
    position: "relative",
    overflow: "hidden"
  },
  likeCountContainer: {
    position: "absolute",
    bottom: 0,
    right: SPACING.half,
    zIndex: 2,
    paddingBottom: SPACING.normal,
    color: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end"
  },
  likeCount: {
    marginTop: SPACING.half
  },
  profile: {
    position: "absolute",
    flexDirection: "row",
    zIndex: 2,
    bottom: 0,
    paddingBottom: SPACING.normal,
    left: SPACING.half,
    color: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end"
  },
  username: {
    fontSize: 18,
    marginLeft: SPACING.half
  },
  image: {},
  gradient: {
    zIndex: 1
  }
});

const Gradient = () => (
  <LinearGradient
    colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.25)"]}
    width={POST_LIST_ITEM_WIDTH}
    height={POST_LIST_ITEM_HEIGHT}
    locations={[0, 0.85, 1.0]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    pointerEvents="none"
    style={[StyleSheet.absoluteFill, styles.gradient]}
  />
);

type Props = {
  onPress: (post: PostListItemFragment) => void;
  isVisible: Boolean;
  post: PostListItemFragment;
  showProfile: Boolean;
};

export const PostListItem = ({
  post,
  onPress,
  isVisible,
  includeExtraSpacing,
  showName = POST_LIST_ITEM_COLUMN_COUNT < 3,
  showProfile = false
}: Props) => {
  const { y, width, height: _height } = scaleToWidth(
    POST_LIST_ITEM_WIDTH,
    post.bounds
  );
  const { height: __height } = scaleToWidth(POST_LIST_ITEM_WIDTH, {
    width: post.media.width,
    height: post.media.height
  });

  const height = _height > __height ? __height : _height;

  const source = React.useMemo(() => {
    const uri = buildImgSrc(post.media.previewUrl, width, height);

    return {
      uri,
      width,
      height
    };
  }, [post.media]);
  const handlePress = React.useCallback(() => {
    return onPress(post);
  }, [post.id, onPress]);

  return (
    <TouchableHighlight onPress={handlePress} style={styles.section}>
      <View
        style={[
          styles.section,
          styles.container,
          includeExtraSpacing && styles.extraSpacing
        ]}
      >
        <Image
          source={source}
          style={{
            width,
            height,
            transform: [{ translateY: y }]
          }}
          resizeMode="cover"
          animated={isVisible}
        />

        <Gradient />

        {showProfile && (
          <View style={styles.profile}>
            <Avatar
              size={32}
              url={post.profile.photoURL}
              username={post.profile.username}
            />
            {showName && (
              <MediumText style={styles.username}>
                {post.profile.username}
              </MediumText>
            )}
          </View>
        )}

        <View style={styles.likeCountContainer}>
          <IconComment size={16} color="#f1f1f1" />
          <MediumText style={styles.likeCount}>
            {post.commentsCount || 0}
          </MediumText>
        </View>
      </View>
    </TouchableHighlight>
  );
};
