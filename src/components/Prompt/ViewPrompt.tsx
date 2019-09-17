import numbro from "numbro";
import * as React from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { getInset } from "react-native-safe-area-view";
import { IconChevronRight, IconList, IconTrophy } from "../../components/Icon";
import { Avatar } from "../../components/Avatar";
import {
  VerticalIconButton,
  VerticalIconButtonSize
} from "../../components/VerticalIconButton";
import { SPACING } from "../../lib/styles";
import {
  BoldText,
  fontStyleSheets,
  MediumText,
  SemiBoldText,
  Text
} from "../Text";
// import { Media } from "../../components/Media";

const SAFE_AREA_TOP = getInset("top");

const SCREEN_DIMENSIONS = Dimensions.get("window");

const HEADER_Z_INDEX = 2;
const ACTION_BAR_Z_INDEX = 2;
const FOOTER_Z_INDEX = 2;

const AVATAR_THUMBNAIL_SIZE = 42;

const styles = StyleSheet.create({
  page: {
    width: SCREEN_DIMENSIONS.width,
    position: "relative",
    backgroundColor: "#111"
  },
  listIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowRadius: 4,
    textShadowOffset: {
      width: 0,
      height: 4
    }
  },

  headerContainer: {
    padding: SPACING.normal,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: HEADER_Z_INDEX,
    backgroundColor: "rgba(0,0,0, 0.6)"
  },
  footerContainer: {
    padding: SPACING.normal,
    paddingBottom: SPACING.normal,
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: FOOTER_Z_INDEX
  },
  avatar: {
    width: AVATAR_THUMBNAIL_SIZE,
    height: AVATAR_THUMBNAIL_SIZE,
    borderRadius: AVATAR_THUMBNAIL_SIZE / 2,
    marginRight: SPACING.normal,

    shadowRadius: 1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowColor: "black",
    shadowOpacity: 0.25
  },
  listButton: {
    marginRight: SPACING.normal,
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: HEADER_Z_INDEX + 1
  },
  footerTextStyle: {
    fontSize: 18,
    color: "white"
  },
  headerTextStyle: {
    fontSize: 18
  },
  headerAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    textAlignVertical: "center"
  },
  footerRank: {
    marginTop: SPACING.half / 2,
    flexDirection: "row",

    textAlignVertical: "center"
  },
  footerTrophyIcon: {
    marginRight: SPACING.half / 2
  },
  expandIcon: {
    color: "white"
  }
});

const CurrentAvatarBadge = ({ url, size = AVATAR_THUMBNAIL_SIZE }) => (
  <View style={styles.avatar}>
    <Avatar
      url={url}
      size={size}
      isLocal={false}
      style={{ borderWidth: 1, borderColor: "white" }}
    />
  </View>
);

const Header = ({ prompt, opacityValue, forceShowHeader, onShowList }) => {
  return (
    <>
      <Animated.View
        style={[
          styles.headerContainer,
          { paddingTop: SAFE_AREA_TOP + SPACING.normal, paddingRight: 52 },
          {
            opacity: forceShowHeader ? 1 : opacityValue
          }
        ]}
      >
        <View style={styles.headerAuthorRow}>
          <SemiBoldText style={[styles.headerTextStyle, fontStyleSheets.muted]}>
            CHALLENGE
          </SemiBoldText>
          <View style={{ width: SPACING.half, height: 1 }} />
          <Text style={[styles.headerTextStyle, fontStyleSheets.muted]}>
            14h left
          </Text>
        </View>

        <BoldText style={[styles.headerTextStyle]}>{prompt.body}</BoldText>
      </Animated.View>
      <TouchableOpacity onPress={onShowList} style={styles.listButton}>
        <Animated.View
          style={[
            {
              padding: SPACING.normal,
              marginTop: 9,
              paddingTop: SAFE_AREA_TOP + SPACING.normal
            }
          ]}
        >
          <IconList style={styles.listIcon} color="#fff" size={24} />
        </Animated.View>
      </TouchableOpacity>
    </>
  );
};

const Footer = ({ rank, username, url }) => {
  return (
    <View style={styles.footerContainer}>
      <CurrentAvatarBadge url={url} />

      <View style={styles.footerTextContainer}>
        <MediumText style={styles.footerTextStyle}>@{username}</MediumText>

        <View style={styles.footerRank}>
          <IconTrophy color="#666" size={16} style={styles.footerTrophyIcon} />
          <Text style={[styles.footerTextStyle, fontStyleSheets.muted]}>
            {numbro(rank).format({ output: "ordinal" })} place
          </Text>
        </View>
      </View>
    </View>
  );
};

const actionBarStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: ACTION_BAR_Z_INDEX,
    marginRight: SPACING.normal
  },
  button: {
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.normal,
    marginBottom: SPACING.normal,
    justifyContent: "center",
    alignItems: "center"
  },
  skipButton: {},
  icon: {
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowRadius: 4,
    textShadowOffset: {
      width: 0,
      height: 4
    }
  }
});

const ActionBar = ({ onLike, likesCount, onSkip }) => {
  return (
    <View style={actionBarStyles.container}>
      <TouchableOpacity onPress={onLike}>
        <View style={actionBarStyles.button}>
          <VerticalIconButton
            size={VerticalIconButtonSize.default}
            count={likesCount}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip}>
        <View style={[actionBarStyles.button, actionBarStyles.skipButton]}>
          <IconChevronRight
            color="#fff"
            size={32}
            style={actionBarStyles.icon}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const createFadeOutAnimation = value =>
  Animated.sequence([
    Animated.delay(10000),
    Animated.timing(value, {
      duration: 500,
      toValue: 0,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    })
  ]);

export class ViewPrompt extends React.Component {
  constructor(props) {
    super(props);

    const post = props.prompt ? props.prompt.topPosts[0] : null;

    this.showControlsValue = new Animated.Value(props.isVisible ? 1 : 0);
    this.showControlsAnimation = Animated.timing(this.showControlsValue, {
      duration: 1000,
      useNativeDriver: true,
      toValue: 1,
      easing: Easing.in(Easing.ease)
    });

    this.state = {
      post: post,
      postIndex: post ? 0 : -1
    };
  }

  componentDidMount() {
    if (this.props.isVisible) {
      createFadeOutAnimation(this.showControlsValue).start();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      (prevProps.prompt !== this.props.prompt ||
        prevProps.prompt.topPosts !== this.props.prompt.topPosts) &&
      !this.state.post
    ) {
      this.setState({
        post: this.props.prompt.topPosts[0],
        postIndex: 0
      });
    }

    if (this.props.isScrolling && !prevProps.isScrolling) {
      this.showControlsValue.setValue(1);
    } else if (
      (this.props.isVisible !== prevProps.isVisible && this.props.isVisible) ||
      (!this.props.isScrolling && prevProps.isScrolling && this.props.isVisible)
    ) {
      this.showControlsValue.setValue(1);
      createFadeOutAnimation(this.showControlsValue).start();
    } else if (this.props.isVisible) {
    }
  }

  handleSkip = () => {
    const nextIndex = this.state.postIndex + 1;
    const { topPosts: posts } = this.props.prompt;

    const post = posts[nextIndex];

    if (!post) {
      return;
    }

    this.setState({
      post,
      postIndex: nextIndex
    });
  };

  render() {
    const { prompt, isVisible, height } = this.props;
    const { post, postIndex } = this.state;

    if (!prompt || !post) {
      return <View />;
    }
    return (
      <View style={[styles.page, { height }]}>
        {/* <Media
          width={SCREEN_DIMENSIONS.width}
          media={post.media}
          paused={!isVisible}
          height={height}
        /> */}
        <Header
          prompt={prompt}
          forceShowHeader={this.props.forceShowHeader}
          opacityValue={this.showControlsValue}
        />
        <Footer
          rank={postIndex + 1}
          username={post.profile.username}
          url={post.profile.photoURL}
        />
        <ActionBar onSkip={this.handleSkip} likesCount={post.likesCount} />
      </View>
    );
  }
}
