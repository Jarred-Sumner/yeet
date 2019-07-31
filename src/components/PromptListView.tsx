import PROMPTS_QUERY from "../lib/promptsQuery.graphql";
import { Query } from "react-apollo";
import * as React from "react";
import { FlatList, View, StyleSheet, Dimensions } from "react-native";
import {
  Text,
  BoldText,
  SemiBoldText,
  MediumText,
  fontStyleSheets
} from "./Text";
import { COLORS, SPACING } from "../lib/styles";
import { Image, AvatarImage } from "../components/Image";
import { LikeButtonSize, LikeButton } from "../components/LikeButton";
import { IconCrown } from "../components/Icon";
import LinearGradient from "react-native-linear-gradient";

const SCREEN_DIMENSIONS = Dimensions.get("window");
const THUMBNAIL_SIZE = Math.floor(SCREEN_DIMENSIONS.width / 3);
const AVATAR_THUMBNAIL_SIZE = 32;
const WINNER_AVATAR_SIZE = 48;

const styles = StyleSheet.create({
  promptListItemWrapper: {},
  promptContainer: {
    flexDirection: "column",
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.half,
    backgroundColor: COLORS.secondaryOpacity
  },
  winnerRank: {
    flexDirection: "row"
  },
  winnerLeftSide: {
    flexDirection: "row"
  },
  winnerPostTitle: {
    marginLeft: SPACING.half,
    textAlignVertical: "bottom"
  },
  winnerPostText: {
    fontSize: 20
  },
  winnerUser: {
    flexDirection: "row"
  },
  winnerRankLabel: {},
  crown: {
    marginRight: SPACING.half / 2,
    textAlignVertical: "bottom",
    position: "relative",
    top: 4
  },
  promptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  promptText: { fontSize: 20 },
  postPreview: {
    position: "relative"
  },
  fourthPlaceContainer: {
    position: "relative",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE
  },
  fourthPlacePostPreview: {
    position: "absolute",
    zIndex: -1
  },
  firstPlacePost: {
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.width
  },
  textShadow: {
    textShadowRadius: 1,
    textShadowColor: "#333"
  },
  divider: {
    width: 1,
    height: THUMBNAIL_SIZE,
    backgroundColor: "white"
  },
  postList: {
    flexDirection: "row",
    position: "relative",
    width: SCREEN_DIMENSIONS.width,
    height: THUMBNAIL_SIZE
  },
  thumbnailHeader: {
    flexDirection: "row"
  },
  postThumbnailHeaderRight: {
    justifyContent: "flex-end",
    flexDirection: "row"
  },
  postRankText: {
    textAlign: "right",
    alignSelf: "center"
  },
  thumbnailFooter: {
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  thumbnailAvatarContainer: {
    width: AVATAR_THUMBNAIL_SIZE,
    height: AVATAR_THUMBNAIL_SIZE,
    borderRadius: AVATAR_THUMBNAIL_SIZE / 2,
    marginRight: SPACING.half,

    shadowRadius: 1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowColor: "black",
    shadowOpacity: 0.25
  },
  winnerAvatarContainer: {
    width: WINNER_AVATAR_SIZE,
    height: WINNER_AVATAR_SIZE,
    borderRadius: WINNER_AVATAR_SIZE / 2,

    shadowRadius: 1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowColor: "black",
    shadowOpacity: 0.25
  },
  winnerPost: {
    width: SCREEN_DIMENSIONS.width,
    height: SCREEN_DIMENSIONS.width,
    padding: SPACING.normal,
    justifyContent: "space-between"
  },
  postThumbnailContent: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    paddingVertical: SPACING.half,
    paddingHorizontal: SPACING.normal,
    justifyContent: "space-between"
  }
});

const AvatarBadge = ({ url, size = AVATAR_THUMBNAIL_SIZE }) => (
  <View style={styles.thumbnailAvatarContainer}>
    <AvatarImage
      url={url}
      size={size}
      style={{ borderWidth: 1, borderColor: "white" }}
    />
  </View>
);

const WinnerAvatarBadge = ({ url, size = WINNER_AVATAR_SIZE }) => (
  <View style={styles.winnerAvatarContainer}>
    <AvatarImage
      url={url}
      size={size}
      style={{ borderWidth: 1, borderColor: "white" }}
    />
  </View>
);

const WinnerImage = ({ size, url }) => (
  <>
    <Image
      style={{
        width: size,
        height: size,
        backgroundColor: "#000",
        position: "absolute",
        zIndex: -2
      }}
      source={{ uri: url }}
    />

    <LinearGradient
      colors={[
        "rgba(0, 0, 0, 0.4)",
        "rgba(0, 0, 0, 0.1)",
        "rgba(0, 0, 0, 0.0)",
        "rgba(0, 0, 0, 0.1)",
        "rgba(0, 0, 0, 0.0)",
        "rgba(0, 0, 0, 0.4)"
      ]}
      locations={[0, 0.2, 0.2865, 0.8281, 0.9, 1.0]}
      style={{ width: size, height: size, position: "absolute", zIndex: -1 }}
    />
  </>
);

class PostPreview extends React.Component {
  render() {
    const { post, rank } = this.props;

    return (
      <View style={[styles.postPreview]}>
        <WinnerImage size={THUMBNAIL_SIZE} url={post.media.url} />

        <View style={styles.postThumbnailContent}>
          <View style={styles.thumbnailHeader}>
            <AvatarBadge url={post.profile.photoURL} />
            <MediumText style={[fontStyleSheets.muted, styles.postRankText]}>
              {rank}
            </MediumText>
          </View>

          <View style={styles.thumbnailFooter}>
            <LikeButton size={LikeButtonSize.half} count={post.likesCount} />
          </View>
        </View>
      </View>
    );
  }
}

class WinnerPostPreview extends React.Component {
  render() {
    const { post } = this.props;

    return (
      <View style={[styles.firstPlacePost, styles.postPreview]}>
        <WinnerImage size={SCREEN_DIMENSIONS.width} url={post.media.url} />

        <View style={styles.winnerPost}>
          <View style={styles.thumbnailHeader}>
            <View style={[styles.winnerLeftSide]}>
              <WinnerAvatarBadge url={post.profile.photoURL} />
              <View style={styles.winnerPostTitle}>
                <View style={styles.winnerUser}>
                  <IconCrown
                    size={14}
                    color="white"
                    style={[styles.textShadow, styles.crown]}
                  />
                  <SemiBoldText style={styles.winnerPostText}>
                    {post.profile.username}
                  </SemiBoldText>
                </View>
                <View style={styles.winnerRank}>
                  <Text
                    style={[
                      styles.winnerRankLabel,
                      styles.winnerPostText,
                      styles.textShadow,
                      fontStyleSheets.muted
                    ]}
                  >
                    1st place
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.thumbnailFooter}>
            <LikeButton size={LikeButtonSize.default} count={post.likesCount} />
          </View>
        </View>
      </View>
    );
  }
}

class PromptListItem extends React.Component {
  render() {
    const { prompt } = this.props;
    const [
      winningPost,
      secondPlace = null,
      thirdPlace = null,
      fourthPlace = null
    ] = prompt.topPosts;

    return (
      <View style={styles.promptListItemWrapper}>
        <View style={styles.promptContainer}>
          <View style={styles.promptHeader}>
            <MediumText style={[styles.promptText]}>
              {prompt.profile.username}
            </MediumText>
            <Text style={[styles.promptText, fontStyleSheets.muted]}>
              14h left
            </Text>
          </View>

          <BoldText style={[styles.promptText]}>{prompt.body}</BoldText>
        </View>
        <WinnerPostPreview post={winningPost} />
        <View style={styles.postList}>
          <PostPreview post={secondPlace} rank="2nd" />
          <PostPreview post={thirdPlace} rank="3rd" />
          <View style={styles.fourthPlaceContainer}>
            <View style={styles.fourthPlacePostPreview}>
              <PostPreview post={fourthPlace} rank="4th" />
            </View>

            <View style={styles.viewMoreContainer} />
          </View>
        </View>
      </View>
    );
  }
}

export class PromptListView extends React.Component {
  renderListItem = ({ item, index }) => <PromptListItem prompt={item} />;

  getKey = item => item.id;

  render() {
    return (
      <FlatList
        renderItem={this.renderListItem}
        data={this.props.prompts || []}
        keyExtractor={this.getKey}
      />
    );
  }
}
