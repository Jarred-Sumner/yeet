import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  PostFragment,
  PostFragment_profile
} from "../../lib/graphql/PostFragment";
import { Media } from "./ViewMedia";
import Animated from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { SPACING } from "../../lib/styles";
import { Avatar } from "../Avatar";
import { SemiBoldText } from "../Text";
import { LikeButton, LikeButtonSize } from "../LikeButton";

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    position: "relative"
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

const Gradient = ({ width, height }) => {
  return (
    <LinearGradient
      width={width}
      height={height}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.8179, 0.9586]}
      colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.12)"]}
    />
  );
};

const profileStyles = StyleSheet.create({
  container: {
    justifyContent: "flex-end",
    alignItems: "flex-start",

    paddingVertical: SPACING.normal,
    paddingHorizontal: SPACING.normal,
    flex: 1
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
const Profile = ({ profile }: { profile: PostFragment_profile }) => {
  return (
    <Animated.View style={profileStyles.container}>
      <View style={profileStyles.content}>
        <Avatar label={profile.username} size={32} url={profile.photoURL} />
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
    paddingHorizontal: SPACING.normal,
    flex: 1
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
const Sidebar = ({ post }: { post: PostFragment }) => {
  return (
    <Animated.View style={sidebarStyles.container}>
      <View style={sidebarStyles.content}>
        <LikeButton size={LikeButtonSize.default} count={post.likesCount} />
      </View>
    </Animated.View>
  );
};

export class Post extends React.Component<Props> {
  render() {
    const { media, profile } = this.props.post;
    const { width, height } = this.props;
    return (
      <Animated.View
        style={[styles.container, { width, height, backgroundColor: "white" }]}
      >
        <Layer zIndex={LayerLevel.media} width={width} height={height}>
          <Media width={width} height={height} media={media} />
        </Layer>
        <Layer
          pointerEvents="none"
          zIndex={LayerLevel.gradient}
          width={width}
          height={height}
        >
          <Gradient width={width} height={height} />
        </Layer>
        <Layer
          pointerEvents="box-none"
          zIndex={LayerLevel.overlay}
          width={width}
          height={height}
        >
          <Profile profile={profile} />
        </Layer>
        <Layer
          pointerEvents="box-none"
          zIndex={LayerLevel.overlay}
          width={width}
          height={height}
        >
          <Sidebar post={this.props.post} />
        </Layer>
      </Animated.View>
    );
  }
}
