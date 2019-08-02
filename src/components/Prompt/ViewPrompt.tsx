import * as React from "react";
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Easing,
  Animated
} from "react-native";
import { SafeAreaView } from "react-navigation";
import numbro from "numbro";
import {
  Text,
  BoldText,
  SemiBoldText,
  ThinText,
  MediumText,
  fontStyleSheets
} from "../Text";
import { COLORS, SPACING } from "../../lib/styles";
import { Image, AvatarImage } from "../../components/Image";
import { LikeButtonSize, LikeButton } from "../../components/LikeButton";
import { IconTrophy, IconChevronRight, IconList } from "../../components/Icon";
import LinearGradient from "react-native-linear-gradient";
import Video from "react-native-video";
import DeviceInfo from "react-native-device-info";
import { getInset } from "react-native-safe-area-view";
import { Transition, Transitioning } from "react-native-reanimated";

const SAFE_AREA_TOP = getInset("top");
const IS_SIMULATOR = DeviceInfo.isEmulator();

const SCREEN_DIMENSIONS = Dimensions.get("window");
const MEDIA_Z_INDEX = 0;
const MEDIA_OVERLAY_Z_INDEX = 1;
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
  mediaStyle: {
    width: SCREEN_DIMENSIONS.width
  },
  mediaContainerStyle: {
    position: "absolute",
    width: SCREEN_DIMENSIONS.width,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: MEDIA_Z_INDEX
  },
  listIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowRadius: 4,
    textShadowOffset: {
      width: 0,
      height: 4
    }
  },
  mediaGradientStyle: {
    width: "100%",
    height: 240,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: MEDIA_OVERLAY_Z_INDEX
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
    left: 0,
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
    <AvatarImage
      url={url}
      size={size}
      style={{ borderWidth: 1, borderColor: "white" }}
    />
  </View>
);

const ImageMedia = ({ media, height }) => (
  <Image
    resizeMode="contain"
    source={{
      uri: media.url,
      width: media.width ? media.width : undefined,
      height: media.height ? media.height : undefined
    }}
    style={[styles.mediaStyle, { height }]}
  />
);

const VideoMedia = ({ media, paused, height }) => {
  return (
    <Video
      style={[styles.mediaStyle, { height }]}
      resizeMode="contain"
      muted={IS_SIMULATOR}
      controls={false}
      loop
      paused={paused}
      fullscreen={false}
      source={{
        uri: media.url,
        width: media.width ? media.width : undefined,
        height: media.height ? media.height : undefined
      }}
    />
  );
};

const Media = ({ media, paused, height }) => {
  let MediaComponent = media.mimeType.includes("image")
    ? ImageMedia
    : VideoMedia;

  const transition = (
    <Transition.Sequence>
      <Transition.In
        propagation="bottom"
        durationMs={1000}
        type="fade"
        interpolation="easeIn"
      />

      <Transition.Change interpolation="easeInOut" />

      <Transition.Out
        propagation="bottom"
        durationMs={1000}
        type="fade"
        interpolation="easeOut"
      />
    </Transition.Sequence>
  );

  console.log("test");
  const ref = React.useRef();

  React.useEffect(() => {
    console.log("animate next");
    ref.current.animateNextTransition();
  }, [media.id, ref]);

  return (
    <>
      <Transitioning.View ref={ref} transition={transition}>
        <View key={media.id} style={[styles.mediaContainerStyle, { height }]}>
          <MediaComponent media={media} paused={paused} height={height} />
        </View>
      </Transitioning.View>

      <LinearGradient
        style={styles.mediaGradientStyle}
        colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.24)"]}
        locations={[0.0276, 0.3509]}
      />
    </>
  );
};

const Header = ({ prompt, opacityValue, forceShowHeader }) => {
  return (
    <>
      <Animated.View
        style={[
          styles.headerContainer,
          { paddingTop: SAFE_AREA_TOP + SPACING.normal, paddingLeft: 52 },
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
      <TouchableOpacity style={styles.listButton}>
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
          <LikeButton size={LikeButtonSize.default} count={likesCount} />
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
        <Media media={post.media} paused={!isVisible} height={height} />
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
