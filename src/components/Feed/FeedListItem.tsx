// @flow
import { sum } from "lodash";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { BaseButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { PostListItemFragment } from "../../lib/graphql/PostListItemFragment";
import {
  ViewThreads_postThreads,
  ViewThreads_postThreads_data
} from "../../lib/graphql/ViewThreads";
import { scaleToWidth } from "../../lib/Rect";
import { SPACING, COLORS } from "../../lib/styles";
import MediaPlayer, { MediaPlayerComponent } from "../MediaPlayer";
import { MediumText } from "../Text";
import { ACTION_BAR_HEIGHT, ContentActionBar } from "./ContentActionBar";
import { PostPreviewList } from "./PostPreviewList";
import { ProfileFeedComponent, PROFILE_FEED_HEIGHT } from "./ProfileFeed";
import { SCREEN_DIMENSIONS } from "../../../config";

const MAX_CONTENT_HEIGHT = SCREEN_DIMENSIONS.height * 0.6;

const styles = StyleSheet.create({
  container: {},
  mediaPlayerWrapper: {
    maxHeight: MAX_CONTENT_HEIGHT,
    overflow: "hidden"
  },
  previewBar: {
    backgroundColor: "rgb(42, 42, 42)",
    width: 4,
    borderRadius: 8,
    marginRight: SPACING.normal
  },
  viewAllText: {
    color: COLORS.muted,
    fontSize: 16
  },
  viewAllTextContainer: {
    marginTop: SPACING.normal,
    marginLeft: SPACING.double + 4
  }
});

type Props = {
  thread: ViewThreads_postThreads_data;
  height: number;
  width: number;
  paused: Boolean;
  onPressPost: PressPostFunction;
};

const getContentSize = (
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

const POST_LIST_HEIGHT = 112; // disibiel by 16
const POST_SECTION_SPACING = SPACING.normal;
const VIEW_ALL_TEXT_HEIGHT = 20;

export const getItemHeight = (
  thread: ViewThreads_postThreads_data,
  width: number
) => {
  const post = thread.posts.data[0];

  if (thread.postsCount < 2) {
    return sum([
      PROFILE_FEED_HEIGHT,
      getContentSize(post, width).height,
      ACTION_BAR_HEIGHT
    ]);
  } else {
    return sum([
      PROFILE_FEED_HEIGHT,
      getContentSize(post, width).height,
      ACTION_BAR_HEIGHT,
      POST_SECTION_SPACING,
      POST_LIST_HEIGHT,
      POST_SECTION_SPACING,
      VIEW_ALL_TEXT_HEIGHT
    ]);
  }
};

class FeedListItemComponent extends React.Component<Props> {
  handlePressElipsis = () => {};
  handlePressViewAll = () => {};

  mediaPlayerRef = React.createRef<MediaPlayerComponent>();

  componentDidUpdate(prevProps) {
    if (prevProps.isVisible !== this.props.isVisible) {
      // if (this.props.isVisible) {
      //   this.mediaPlayerRef.current.play();
      // } else {
      //   this.mediaPlayerRef.current.pause();
      // }
    }
  }

  render() {
    const { height, width, paused, thread, isVisible } = this.props;
    const {
      posts: { data: posts },
      postsCount
    } = thread;

    const post = posts[0];
    const op = post.profile;
    const postSize = getContentSize(post, width, 0);

    const showPostPreviews = posts.length > 1;

    return (
      <View style={[{ height, width }, styles.container]}>
        <ProfileFeedComponent
          profile={op}
          onPressEllipsis={this.handlePressElipsis}
        />
        <View style={styles.mediaPlayerWrapper}>
          <MediaPlayer
            paused={!this.props.isVisible}
            id={thread.id + "-preview"}
            isActive={isVisible}
            ref={this.mediaPlayerRef}
            autoPlay={false}
            style={[
              { width: postSize.width, height: postSize.height },
              styles.content
            ]}
            sources={[post.media]}
          />
        </View>

        <ContentActionBar postId={post.id} remixCount={postsCount} />

        {showPostPreviews && (
          <View style={styles.postPreviewContainer}>
            <PostPreviewList
              posts={posts.slice(1)}
              height={POST_LIST_HEIGHT}
              width={width}
              onPressPost={this.handlePressPost}
              style={styles.postPreviewList}
              directionalLockEnabled
              contentOffset={{
                y: 0,
                x: SPACING.double * -1
              }}
              contentInset={{
                left: SPACING.double,
                top: 0,
                bottom: 0,
                right: SPACING.normal
              }}
            >
              <View style={styles.previewBar} />
            </PostPreviewList>

            <BaseButton onPress={this.handlePressViewAll}>
              <Animated.View style={styles.viewAllTextContainer}>
                <MediumText numberOfLines={1} style={styles.viewAllText}>
                  View all {postsCount} posts
                </MediumText>
              </Animated.View>
            </BaseButton>
          </View>
        )}
      </View>
    );
  }
}

export const FeedListItem = ({
  isVisible,
  thread,
  height,
  width,
  ...otherProps
}) => {
  return (
    <FeedListItemComponent
      {...otherProps}
      thread={thread}
      height={height}
      width={width}
      isVisible={isVisible}
    />
  );
};
