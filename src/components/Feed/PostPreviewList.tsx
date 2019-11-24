import * as React from "react";
import { ScrollView } from "../ScrollView";
import { View, StyleSheet, ScrollViewProps } from "react-native";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { SPACING, COLORS } from "../../lib/styles";
import Image from "../Image";
import { PostListItemFragment } from "../../lib/graphql/PostListItemFragment";
import { BaseButton, TouchableHighlight } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { Avatar, CurrentUserAvatar } from "../Avatar";
import { AVATAR_SIZE } from "./ProfileFeed";
import { buildImgSrc } from "../../lib/imgUri";
import { scaleToWidth, DimensionsRect } from "../../lib/Rect";
import { LikeCountButton } from "../ThreadList/LikeCountButton";
import LinearGradient from "react-native-linear-gradient";
import { IconButton } from "../Button";
import { IconPlus } from "../Icon";
import { MediumText } from "../Text";
import { isVideo } from "../../lib/imageSearch";
import { postElementId } from "../../lib/ElementTransition";
import { SCREEN_DIMENSIONS } from "../../../config";
import { CommentCountButton } from "../ThreadList/CommentCountButton";

export const POST_LIST_HEIGHT = 320;
export const HORIZONTAL_POST_LIST_WIDTH =
  SCREEN_DIMENSIONS.width - SPACING.double * 2;
export const VERTICAL_POST_LIST_WIDTH = 204;
export const MAX_CONTENT_HEIGHT = SCREEN_DIMENSIONS.height * 0.6;

export const getPostPreviewWidth = (dimensions: DimensionsRect) => {
  const aspectRatio = dimensions.width / dimensions.height;
  if (aspectRatio > 1.2 || (aspectRatio > 0.95 && aspectRatio < 1.05)) {
    return HORIZONTAL_POST_LIST_WIDTH;
  } else {
    return VERTICAL_POST_LIST_WIDTH;
  }
};

export const getPostWidth = (post: PostListItemFragment) => {
  return getPostPreviewWidth(post.media);
};

export type PressPostFunction = (post: PostListItemFragment) => Void;

export const getContentSize = (
  post: PostListItemFragment,
  width: number,
  maxHeight = MAX_CONTENT_HEIGHT
) => {
  const size = scaleToWidth(width, post.media);

  return {
    ...size,
    height: maxHeight > 0 ? Math.min(size.height, maxHeight) : size.height
  };
};

export const postPreviewListHeight = (posts: Array<PostListItemFragment>) => {
  return Math.min(
    Math.max(
      Math.min(
        ...posts.map(post => getContentSize(post, getPostWidth(post)).height)
      ),
      100
    ),
    POST_LIST_HEIGHT
  );
};

type Props = Partial<ScrollViewProps> & {
  posts: Array<PostFragment>;
  onPressPost: PressPostFunction;
  height: number;
};

const styles = StyleSheet.create({
  scrollView: {
    overflow: "visible"
  },
  listItem: {
    position: "relative"
  },
  spacer: {
    width: 4,
    height: 1
  },
  imageContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 4
  },
  imageBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
    zIndex: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.15)"
  },
  overlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between"
  },

  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    borderColor: "rgba(255, 255, 255, 0.2)"
  },
  avatarFaded: {
    opacity: 0.55
  },
  newPostText: {
    marginTop: SPACING.normal,
    fontSize: 16
  },
  overlayContainer: {
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingBottom: SPACING.half,
    borderRadius: 4,
    paddingHorizontal: SPACING.half
  },
  overlaySide: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row"
  },
  newPostBackground: {
    position: "absolute",
    zIndex: 0,
    borderRadius: 4,
    overflow: "hidden"
  },
  newPost: {
    justifyContent: "center",
    alignItems: "center"
  },
  overlayRightSide: {
    justifyContent: "flex-end"
  }
});

type ListItemProps = {
  post: PostListItemFragment;
  height: number;
  width: number;
  onPress: PressPostFunction;
};

/* image 26 */

// position: absolute;
// width: 163.88px;
// height: 255px;
// left: 16px;
// top: 0px;

// background: linear-gradient(360deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 31.46%), url(image.png);
// border: 1px solid rgba(204, 204, 204, 0.1);
// box-sizing: border-box;
// border-radius: 4px;

const GradientOverlay = React.memo(({ width, height }) => (
  <LinearGradient
    width={width}
    height={height}
    colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.5)"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    locations={[1.0 - 0.3146, 1.0]}
  ></LinearGradient>
));

export const PostPreviewListItem = React.memo(
  ({
    onPress,
    width,
    height,
    source,
    isVisible,
    sharedId,
    id,
    paused,
    imageSize,
    photoURL,
    username,
    footerAction
  }) => {
    const sizeStyle = React.useMemo(() => ({ width, height }), [width, height]);
    const listItemStyle = React.useMemo(() => [styles.listItem, sizeStyle], [
      sizeStyle
    ]);

    const imageContainerStyle = React.useMemo(
      () => [styles.imageContainer, sizeStyle],
      [sizeStyle]
    );

    const imageStyle = React.useMemo(
      () => [
        styles.image,
        { width: imageSize.width, height: imageSize.height }
      ],
      [imageSize]
    );

    const imageBorderStyle = React.useMemo(
      () => [
        styles.imageBorder,
        { width: sizeStyle.width, height: sizeStyle.height }
      ],
      [imageSize]
    );

    const overlayContainerStyle = React.useMemo(
      () => [StyleSheet.absoluteFill, styles.overlayContainer, sizeStyle],
      [StyleSheet.absoluteFill, sizeStyle]
    );

    const overlaySideStyle = React.useMemo(
      () => [styles.overlaySide, styles.overlayRightSide],
      []
    );

    return (
      <TouchableHighlight onPress={onPress}>
        <Animated.View style={listItemStyle}>
          <View style={imageContainerStyle}>
            <Image
              source={source}
              isVisible={isVisible}
              sharedId={sharedId}
              paused={paused}
              id={id}
              borderRadius={4}
              style={imageStyle}
            />

            <View style={imageBorderStyle}>
              <GradientOverlay
                width={sizeStyle.width}
                height={sizeStyle.height}
              />
            </View>
          </View>

          <View style={overlayContainerStyle}>
            <View style={styles.overlay}>
              <View style={styles.overlaySide}>
                <View style={styles.avatar}>
                  <Avatar url={photoURL} label={username} size={AVATAR_SIZE} />
                </View>
              </View>

              <View style={overlaySideStyle}>{footerAction}</View>
            </View>
          </View>
        </Animated.View>
      </TouchableHighlight>
    );
  }
);

const ListItem = ({
  post,
  onPress,
  width,
  height,
  paused,
  isVisible
}: ListItemProps) => {
  const handlePress = React.useCallback(() => {
    onPress(post);
  }, [post, onPress]);

  const {
    profile,
    media: { previewUrl, width: rawWidth, height: rawHeight, coverUrl }
  } = post;

  const imageSize = scaleToWidth(width, post.media);

  let isVideoPost = isVideo(post.media.mimeType);

  const mimeType = isVideoPost ? "image/gif" : post.media.mimeType;
  const uri = isVideoPost
    ? buildImgSrc(previewUrl, imageSize.width, imageSize.height)
    : coverUrl;

  const source = React.useMemo(
    () => ({
      height: imageSize.height,
      width: imageSize.width,
      uri,
      mimeType
    }),
    [post.media, uri, mimeType]
  );

  return (
    <PostPreviewListItem
      sharedId={postElementId(post)}
      onPress={handlePress}
      source={source}
      id={`preview-${post.id}`}
      paused={paused}
      width={width}
      isVisible={isVisible}
      height={height}
      imageSize={imageSize}
      footerAction={<CommentCountButton id={post.id} size={22} />}
      photoURL={profile.photoURL}
      username={profile.username}
    />
  );
};

export const PlaceholderPost = ({ height, width, onPress, children }) => {
  return (
    <BaseButton onPress={onPress}>
      <Animated.View style={[styles.listItem, { width, height }]}>
        <View style={[styles.imageContainer, { width, height }]}>
          <View style={[styles.newPostBackground, { width, height }]}>
            <LinearGradient
              width={width}
              height={height}
              colors={["rgba(173, 85, 255, 0.15)", "rgba(194, 129, 255, 0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0, 0.3146]}
            />
          </View>

          <View style={[styles.newPost, { width, height }]}>
            <IconButton
              type="shadow"
              containerSize={48}
              size={24}
              color="#fff"
              backgroundColor={COLORS.secondary}
              Icon={IconPlus}
              onPress={onPress}
            />

            <MediumText style={styles.newPostText}>{children}</MediumText>
          </View>

          <View style={[styles.imageBorder, { width, height }]}></View>
        </View>

        {height > 200 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.overlayContainer,
              { width, height }
            ]}
          >
            <View style={styles.overlay}>
              <View style={styles.overlaySide}>
                <View style={[styles.avatar, styles.avatarFaded]}>
                  <CurrentUserAvatar size={AVATAR_SIZE} />
                </View>
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </BaseButton>
  );
};

export const PostPreviewList = React.forwardRef(
  (
    {
      posts,
      onPressPost,
      height,
      children,
      contentOffset,
      contentInset,
      waitFor,
      isVisible,
      onPressNewPost,
      paused,
      ...otherProps
    }: Props,
    ref
  ) => {
    const renderPost = React.useCallback(
      (post: PostListItemFragment, index: number) => {
        const isLast = index === posts.length - 1;

        const width = getPostWidth(post);

        if (isLast) {
          return (
            <ListItem
              height={height}
              width={width}
              onPress={onPressPost}
              isVisible={isVisible}
              post={post}
              key={post.id}
              paused={paused}
            />
          );
        } else {
          return (
            <React.Fragment key={post.id}>
              <ListItem
                onPress={onPressPost}
                post={post}
                height={height}
                width={width}
                isVisible={isVisible}
                paused={paused}
              />
              <View style={styles.spacer} collapsable={false} />
            </React.Fragment>
          );
        }
      },
      [onPressPost, height, paused]
    );

    return (
      <ScrollView
        {...otherProps}
        contentInset={contentInset}
        contentOffset={contentOffset}
        ref={ref}
        horizontal
        simultaneousHandlers={waitFor}
        style={[styles.scrollView, { height }]}
      >
        {children}
        {posts.slice(0, 4).map(renderPost)}
        <View style={styles.spacer} collapsable={false} />
        <PlaceholderPost
          width={VERTICAL_POST_LIST_WIDTH}
          height={height}
          onPress={onPressNewPost}
        >
          New post
        </PlaceholderPost>
      </ScrollView>
    );
  }
);
