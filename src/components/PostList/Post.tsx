import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  PostFragment,
  PostFragment_profile
} from "../../lib/graphql/PostFragment";
import { Media, resolveImageMediaSource } from "./ViewMedia";
import Animated from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { SPACING } from "../../lib/styles";
import { Avatar } from "../Avatar";
import { SemiBoldText } from "../Text";
import { range } from "lodash";
import {
  VerticalIconButton,
  VerticalIconButtonSize
} from "../VerticalIconButton";
import { getInset } from "react-native-safe-area-view";
import { IconSend, IconRemix } from "../Icon";
import {
  ViewThreads_postThreads,
  ViewThreads_postThreads_firstPost
} from "../../lib/graphql/ViewThreads";
import { ViewPosts, ViewPosts_posts } from "../../lib/graphql/ViewPosts";
import { Query } from "react-apollo";
import VIEW_POSTS_QUERY from "../../lib/ViewPosts.graphql";
import { PostProgressBar } from "./PostProgressBar";
import Image from "../Image";

import { uniqBy } from "lodash";
import { TOP_Y } from "../../../config";
import { SharedElement } from "react-navigation-shared-element";
const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    position: "relative",
    overflow: "hidden"
  }
});

type Props = {
  post: PostFragment;
};

enum LayerLevel {
  media = 1,
  gradient = 2,
  overlay = 3
}

const Layer = ({ zIndex, pointerEvents, children, width, height }) => {
  return (
    <View
      pointerEvents={pointerEvents}
      style={[StyleSheet.absoluteFill, styles.layer, { width, height, zIndex }]}
    >
      {children}
    </View>
  );
};

export const OverlayGradient = ({
  width,
  height,
  layoutDirection,
  topEndLocation = 0.1,
  bottomStartLocation = 0.7879
}) => {
  return (
    <LinearGradient
      width={width}
      height={height}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[bottomStartLocation, 1.0]}
      colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.15)"]}
    />
  );
};

const profileStyles = StyleSheet.create({
  container: {
    alignItems: "flex-start",

    paddingVertical: SPACING.normal,
    paddingHorizontal: SPACING.normal,
    flex: 1
  },
  containerBottom: {
    justifyContent: "flex-start"
  },
  containerTop: {
    justifyContent: "flex-end",
    marginBottom: getInset("bottom")
  },
  content: {
    flexDirection: "row",
    alignItems: "center"
  },
  username: {
    fontSize: 18,
    marginLeft: SPACING.half
  }
});
const Profile = ({
  profile,
  layoutDirection = "column"
}: {
  profile: PostFragment_profile;
}) => {
  const containerStyles = [
    profileStyles.container,
    layoutDirection === "column-reverse"
      ? profileStyles.containerTop
      : profileStyles.containerBottom
  ];

  return (
    <Animated.View style={containerStyles}>
      <View style={profileStyles.content}>
        <Avatar label={profile.username} size={48} url={profile.photoURL} />
        <SemiBoldText style={profileStyles.username}>
          @{profile.username}
        </SemiBoldText>
      </View>
    </Animated.View>
  );
};

const sidebarStyles = StyleSheet.create({
  container: {
    justifyContent: "flex-end",
    alignItems: "flex-end",

    paddingVertical: SPACING.normal,
    paddingHorizontal: SPACING.double,
    flex: 1
  },
  containerTop: {
    marginBottom: getInset("bottom")
  },
  containerBottom: {
    marginTop: TOP_Y
  },
  spacer: {
    height: SPACING.double
  },
  content: {
    alignItems: "center",
    alignSelf: "flex-end",
    justifyContent: "flex-end"
  },
  username: {
    fontSize: 18,
    marginLeft: SPACING.half
  }
});
const Sidebar = ({
  post,
  layoutDirection,
  onPressSend,
  onPressLike
}: {
  post: PostFragment;
}) => {
  const containerStyles = [
    sidebarStyles.container,
    layoutDirection === "column-reverse"
      ? sidebarStyles.containerTop
      : sidebarStyles.containerBottom
  ];

  return (
    <Animated.View style={containerStyles}>
      <View style={sidebarStyles.content}>
        <VerticalIconButton
          size={VerticalIconButtonSize.default}
          count={post.likesCount}
          onPress={onPressSend}
          Icon={IconRemix}
          iconSize={38}
        />

        <Animated.View style={sidebarStyles.spacer} />

        <VerticalIconButton
          size={VerticalIconButtonSize.default}
          count={post.likesCount}
          onPress={onPressLike}
        />
      </View>
    </Animated.View>
  );
};

const PostComponent = ({
  width,
  height,
  layoutDirection,
  onPressLike,
  onPressSend,
  onLoad,
  stopped = false,
  post,
  children,
  delay
}: Props) => {
  const { media, profile, colors } = post;
  console.log("INNER", post.id);
  return (
    <Animated.View
      style={[
        styles.container,
        { width, height, backgroundColor: colors.secondary || "white" }
      ]}
    >
      <Layer zIndex={LayerLevel.media} width={width} height={height}>
        <SharedElement id={`post.${post.id}.media`}>
          <Media
            width={post.bounds.width}
            height={post.bounds.height}
            containerWidth={width}
            containerHeight={height}
            key={media.id}
            paused={stopped}
            media={media}
            onLoad={onLoad}
            hideContent={delay}
            priority={delay ? Image.priority.low : Image.priority.high}
          />
        </SharedElement>
      </Layer>
      <Layer
        pointerEvents="none"
        zIndex={LayerLevel.gradient}
        width={width}
        height={height}
      >
        <OverlayGradient
          width={width}
          height={height}
          layoutDirection={layoutDirection}
        />
      </Layer>
      <Layer
        pointerEvents="box-none"
        zIndex={LayerLevel.overlay}
        width={width}
        height={height}
      >
        <Profile profile={profile} layoutDirection={layoutDirection} />
      </Layer>
      <Layer
        pointerEvents="box-none"
        zIndex={LayerLevel.overlay}
        width={width}
        height={height}
      >
        <Sidebar
          post={post}
          layoutDirection={layoutDirection}
          onPressLike={onPressLike}
          onPressSend={onPressSend}
        />
      </Layer>

      <Layer
        pointerEvents="box-none"
        zIndex={LayerLevel.overlay}
        width={width}
        height={height}
      >
        {children}
      </Layer>
    </Animated.View>
  );
};

type PostContainerProps = {
  fetchMore: Function;
  posts: Array<ViewPosts_posts>;
  thread: ViewThreads_postThreads;
};

const BAR_SPACING = 3;
export const ProgressBarList = ({
  postsCount = 1,
  width,
  currentPostIndex = 0,
  height,
  stopped = false,
  onFinish,
  loopIndex = null,
  barSpacing = BAR_SPACING
}) => {
  const barWidth = width / postsCount - barSpacing * 2 * postsCount;
  const _loopIndex = loopIndex || postsCount - 1;
  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        justifyContent: "center",
        flex: 0,
        width,
        height,
        flexDirection: "row"
      }}
    >
      {range(0, postsCount).map(postIndex => {
        return (
          <Animated.View
            key={`${postIndex}-${barWidth}`}
            style={{
              width: barWidth + barSpacing * 2,
              paddingHorizontal: barSpacing,
              overflow: "hidden"
            }}
          >
            <PostProgressBar
              width={barWidth}
              duration={5000}
              height={height}
              play={postIndex === currentPostIndex && !stopped}
              onFinish={onFinish}
              finished={currentPostIndex > postIndex}
              loop={_loopIndex === postIndex}
            />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

class RawPostContainer extends React.Component<PostContainerProps> {
  constructor(props) {
    super(props);

    this.state = {
      postIndex: 0,
      posts: [props.thread.firstPost, ...props.posts],
      hasLoaded: false
    };
  }

  componentDidMount() {
    this.prefetchBatch();
  }

  prefetchBatch = () => {
    const sources = this.state.posts
      .slice(this.state.currentPostIndex, 2)
      .map(post => {
        if (post.media.mimeType.includes("image")) {
          return resolveImageMediaSource({
            media: post.media,
            width: this.props.width,
            height: this.props.height
          });
        } else {
          return null;
        }
      })
      .filter(Boolean);
    Image.preload(sources);
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.posts !== this.state.posts) {
      this.prefetchBatch();
    }
  }

  static getDerivedStateFromProps(props) {
    const posts = uniqBy([props.thread.firstPost, ...props.posts], "id");

    return { posts };
  }

  goNext = () => {
    const postIndex = this.state.postIndex + 1;
    const hasNextPost = !!this.state.posts[postIndex];

    if (hasNextPost) {
      this.setState({
        postIndex,
        hasLoaded: false
      });
    }
  };

  handleLoad = () => {
    this.setState({ hasLoaded: true });
    this.props.onLoad && this.props.onLoad();
  };

  handleSend = () => {
    this.props.onPressSend(this.state.posts[this.state.postIndex]);
  };

  render() {
    const {
      width,
      height,
      layoutDirection,
      onPressLike,
      onPressSend,
      delay,
      isFocused
    } = this.props;
    const { posts, postIndex } = this.state;
    const postsCount = posts.length;

    const showProgressBar = postsCount > 1;
    const post = posts[postIndex];

    return (
      <PostComponent
        width={width}
        height={height}
        layoutDirection={layoutDirection}
        onPressSend={this.handleSend}
        onLoad={this.handleLoad}
        key={post.id}
        stopped={!isFocused}
        onPressLike={onPressLike}
        delay={delay}
        postIndex={this.state.postIndex}
        post={post}
      >
        {showProgressBar && (
          <ProgressBarList
            postsCount={postsCount}
            width={width}
            onFinish={this.goNext}
            stopped={this.props.delay || !this.state.hasLoaded || !isFocused}
            currentPostIndex={this.state.postIndex}
          />
        )}
      </PostComponent>
    );
  }
}

export const Post = props => (
  <Query
    query={VIEW_POSTS_QUERY}
    skip={props.delay}
    notifyOnNetworkStatusChange
    variables={{
      threadId: props.thread.id,
      limit: 10,
      offset: 0
    }}
  >
    {({ data: { posts = [] } = {}, fetchMore, ...apollo }: ViewPosts) => (
      <RawPostContainer
        {...props}
        posts={posts}
        fetchMore={fetchMore}
        apollo={apollo}
      />
    )}
  </Query>
);
