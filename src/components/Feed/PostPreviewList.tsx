import * as React from "react";
import { ScrollView } from "../ScrollView";
import { View, StyleSheet, ScrollViewProps } from "react-native";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { SPACING } from "../../lib/styles";
import Image from "../Image";
import { PostListItemFragment } from "../../lib/graphql/PostListItemFragment";
import { BaseButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { Avatar } from "../Avatar";
import { AVATAR_SIZE } from "./ProfileFeed";

const ASPECT_RATIO = 2 / 3;

export type PressPostFunction = (post: PostListItemFragment) => Void;

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
    position: "relative",
    borderRadius: 8,
    borderColor: "#111",
    borderWidth: StyleSheet.hairlineWidth
  },
  spacer: {
    width: SPACING.normal,
    height: 1
  },
  image: {},
  avatarWrapper: {
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    borderColor: "rgba(255, 255, 255, 0.2)"
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(25, 25, 25, 0.25)"
  },
  avatar: {}
});

type ListItemProps = {
  post: PostListItemFragment;
  height: number;
  width: number;
  onPress: PressPostFunction;
};

const _ListItem = ({ post, onPress, width, height }: ListItemProps) => {
  const handlePress = React.useCallback(() => {
    onPress(post);
  }, [post, onPress]);

  const {
    profile,
    media: { coverUrl: uri }
  } = post;

  const source = {
    height,
    width,
    uri
  };

  return (
    <BaseButton onPress={handlePress}>
      <Animated.View style={[styles.listItem, { width, height }]}>
        <Image
          source={source}
          style={[styles.image, { width, height }]}
          borderRadius={8}
          paused
        />

        <View
          shouldRasterizeIOS
          style={[
            StyleSheet.absoluteFill,
            styles.avatarContainer,
            { width, height }
          ]}
        >
          <View style={styles.avatarWrapper}>
            <Avatar
              url={profile.photoURL}
              label={profile.username}
              size={AVATAR_SIZE}
            />
          </View>
        </View>
      </Animated.View>
    </BaseButton>
  );
};

const ListItem = React.memo(_ListItem);

export const PostPreviewList = React.forwardRef(
  (
    {
      posts,
      onPressPost,
      height,
      children,
      contentOffset,
      contentInset,
      ...otherProps
    }: Props,
    ref
  ) => {
    const width = height * ASPECT_RATIO;

    const renderPost = React.useCallback(
      (post: PostListItemFragment, index: number) => {
        const isLast = index === posts.length - 1;

        if (isLast) {
          return (
            <ListItem
              height={height}
              onPress={onPressPost}
              post={post}
              width={width}
              key={post.id}
            />
          );
        } else {
          return (
            <React.Fragment key={post.id}>
              <ListItem
                height={height}
                onPress={onPressPost}
                post={post}
                width={width}
              />
              <View style={styles.spacer} collapsable={false} />
            </React.Fragment>
          );
        }
      },
      [onPressPost, height, width]
    );

    return (
      <ScrollView
        {...otherProps}
        contentInset={contentInset}
        contentOffset={contentOffset}
        ref={ref}
        horizontal
        style={styles.scrollView}
      >
        {children}
        {posts.map(renderPost)}
      </ScrollView>
    );
  }
);
