import * as React from "react";
import { View, StyleSheet } from "react-native";
import ViewProfile from "./ViewProfile";
import { ViewProfile_profile } from "../../lib/graphql/ViewProfile";
import LinearGradient from "react-native-linear-gradient";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { Avatar } from "../Avatar";
import {
  SemiBoldText,
  MediumText,
  Text,
  LETTER_SPACING_MAPPING
} from "../Text";
import { Button, BackButton } from "../Button";
import { COLORS, SPACING } from "../../lib/styles";
import { TouchableHighlight } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { EditableAvatar, RawEditableAvatar } from "../EditableAvatar";

export enum ViewProfileSection {
  followers,
  remixes,
  posts
}

type Props = {
  profile: ViewProfile_profile;
  isFollowing: Boolean;
  isCurrentUser: Boolean;
  section: ViewProfileSection;
  onChangeSection: (section: ViewProfileSection) => void;
};

export const HEADER_HEIGHT = 320 + TOP_Y;
const AVATAR_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    height: HEADER_HEIGHT
  },
  muted: {
    color: COLORS.muted
  },
  backButtonContainer: {
    position: "absolute",
    top: TOP_Y,
    marginTop: SPACING.normal,
    left: SPACING.normal
  },
  avatarWrapper: {
    alignItems: "center"
  },
  background: {
    zIndex: 0,
    width: "100%",
    height: HEADER_HEIGHT
  },
  content: {
    paddingTop: TOP_Y + SPACING.normal,
    zIndex: 1,
    color: "#f0f0f0",
    width: "100%",
    height: HEADER_HEIGHT,
    flex: 1
  },
  top: {
    overflow: "visible",
    paddingVertical: SPACING.normal,
    alignSelf: "center",
    alignContent: "center",
    justifyContent: "center"
  },
  username: {
    marginTop: SPACING.half,
    textAlign: "center",
    fontSize: 24
  },
  followButton: {
    overflow: "visible",
    flex: 1,
    alignSelf: "center",
    width: 200,
    marginBottom: SPACING.normal,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2
  }
});

export const Background = ({
  width = SCREEN_DIMENSIONS.width,
  height = HEADER_HEIGHT
}) => (
  <LinearGradient
    width={width}
    height={height}
    useAngle
    pointerEvents="none"
    angle={141.38}
    angleCenter={{ x: 0.5, y: 0.5 }}
    colors={["#000", "#141414"].reverse()}
    start={{ x: 0, y: 0 }}
    locations={[0.2527, 0.7016]}
    style={[StyleSheet.absoluteFill, styles.background]}
  />
);

const FollowButton = ({ onPress }) => (
  <Button color={COLORS.primary} onPress={onPress}>
    Follow
  </Button>
);
const UnFollowButton = ({ onPress }) => (
  <Button color={COLORS.muted} onPress={onPress}>
    Unfollow
  </Button>
);

const SettingsButton = ({ onPress }) => (
  <Button color={COLORS.muted} onPress={onPress}>
    Edit avatar
  </Button>
);

const COUNTER_DISPLAYED = 3;
const COUNTER_WIDTH = SCREEN_DIMENSIONS.width / COUNTER_DISPLAYED;

export const COUNTER_HEIGHT = 64;
const countStyles = StyleSheet.create({
  rows: {
    flexDirection: "row",
    width: "100%",
    height: COUNTER_HEIGHT
  },

  row: {
    flex: 1,
    height: COUNTER_HEIGHT,
    // borderTopColor: "rgba(255, 255, 255, 0.1)",
    // borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    justifyContent: "center",
    alignItems: "center",
    width: COUNTER_WIDTH
  },
  rowButton: {
    flex: 1,
    width: COUNTER_WIDTH,
    height: COUNTER_HEIGHT,
    justifyContent: "center",
    alignItems: "center"
  },
  focusedRow: {
    backgroundColor: "#333",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    flexWrap: "nowrap"
  },
  label: {
    color: COLORS.muted,
    fontSize: 16,
    letterSpacing: LETTER_SPACING_MAPPING["16"],
    textAlign: "center",
    flex: 0
  },

  value: {
    color: "#f1f1f1",
    fontSize: 20,
    letterSpacing: LETTER_SPACING_MAPPING["20"],
    textAlign: "center",
    flex: 0
  }
});

const CountItem = ({ count, label, isFocused, section, onPress }) => {
  const handlePress = React.useCallback(() => {
    onPress(section);
  }, [section, onPress]);

  return (
    <TouchableHighlight
      disabled={isFocused}
      onPress={handlePress}
      style={countStyles.rowButton}
    >
      <View
        style={[countStyles.row, isFocused && countStyles.focusedRow].filter(
          Boolean
        )}
      >
        <MediumText style={countStyles.value}>{count}</MediumText>
        <Text style={countStyles.label}>{label}</Text>
      </View>
    </TouchableHighlight>
  );
};

const CountRows = ({
  remixCount,
  postsCount,
  section,
  followersCount,
  onPressSection
}) => {
  return (
    <View style={countStyles.rows}>
      <CountItem
        isFocused={section === ViewProfileSection.remixes}
        count={remixCount}
        label="remixes"
        onPress={onPressSection}
        section={ViewProfileSection.remixes}
      />
      <CountItem
        isFocused={section === ViewProfileSection.posts}
        count={postsCount}
        onPress={onPressSection}
        label="posts"
        section={ViewProfileSection.posts}
      />
      <CountItem
        isFocused={section === ViewProfileSection.followers}
        count={followersCount}
        onPress={onPressSection}
        label="followers"
        section={ViewProfileSection.followers}
      />
    </View>
  );
};

const ViewProfileHeaderComponent = ({
  remixesCount,
  postsCount,
  followersCount,
  username,
  photoURL,
  backButtonBehavior,
  isCurrentUser,
  isFollowing,
  translateY,
  editAvatar,
  avatarRef,
  onFollow,
  onUnfollow,
  onChangeAvatar,
  onBlurAvatar = () => {},
  section,
  onChangeSection
}) => {
  const ButtonComponent = isCurrentUser
    ? SettingsButton
    : isFollowing
    ? UnFollowButton
    : FollowButton;

  const onPressButton = isCurrentUser
    ? editAvatar
    : isFollowing
    ? onUnfollow
    : onFollow;

  const AvatarComponent = isCurrentUser ? EditableAvatar : Avatar;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: translateY
            }
          ]
        }
      ]}
    >
      <Background />

      <View style={[StyleSheet.absoluteFill, styles.content]}>
        <View pointerEvents="box-none" style={styles.backButtonContainer}>
          <BackButton behavior={backButtonBehavior} />
        </View>

        <View style={styles.top}>
          <View style={styles.avatarWrapper}>
            <AvatarComponent
              size={AVATAR_SIZE}
              url={photoURL}
              src={photoURL}
              ref={avatarRef}
              onChange={onChangeAvatar}
              onBlur={onBlurAvatar}
              label={username}
            />
          </View>
          <SemiBoldText style={styles.username}>
            <Text style={styles.muted}>@</Text>
            {username}
          </SemiBoldText>
        </View>

        <View style={styles.followButton}>
          <ButtonComponent onPress={onPressButton} />
        </View>

        <CountRows
          remixCount={remixesCount}
          postsCount={postsCount}
          followersCount={followersCount}
          section={section}
          onPressSection={onChangeSection}
        />
      </View>
    </Animated.View>
  );
};

export class ViewProfileHeader extends React.Component<Props> {
  handleFollow = () => {};

  handleUnfollow = () => {};

  handleEditPhoto = () => {};
  handlePressAvatar = () => {
    if (!this.props.isCurrentUser) {
      return;
    }

    this.avatarRef.current.tapAvatar();
  };

  handleOpenSettings = () => {};

  handleUpdateAvatar = (mediaId: string | null) => {
    if (!this.props.isCurrentUser) {
      return;
    }

    return this.props.updateAvatar({
      variables: { mediaId }
    });
  };

  avatarRef = React.createRef<RawEditableAvatar>();

  render() {
    const {
      profile,
      isFollowing,
      isCurrentUser,
      onChangeSection,
      backButtonBehavior,
      onFollow,
      onUnfollow,
      section,
      translateY
    } = this.props;

    return (
      <ViewProfileHeaderComponent
        remixesCount={profile.remixesCount}
        followersCount={profile.followersCount}
        photoURL={profile.photoURL}
        avatarRef={this.avatarRef}
        username={profile.username}
        postsCount={profile.postsCount}
        isFollowing={isFollowing}
        onUnfollow={onUnfollow}
        translateY={translateY}
        onFollow={onFollow}
        onChangeAvatar={this.handleUpdateAvatar}
        onChangeSection={onChangeSection}
        section={section}
        isCurrentUser={isCurrentUser}
        editAvatar={this.handlePressAvatar}
        backButtonBehavior={backButtonBehavior}
      />
    );
  }
}
