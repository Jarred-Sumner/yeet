import { subYears } from "date-fns/esm";
import hoistNonReactStatics from "hoist-non-react-statics";
import { capitalize } from "lodash";
import * as React from "react";
import { useMutation } from "react-apollo";
import { StyleSheet, View, InteractionManager } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import SafeAreaView from "react-native-safe-area-view";
import { useNavigation, useNavigationParam } from "react-navigation-hooks";
import { NavigationStackOptions } from "react-navigation-stack";
import { DatePicker } from "../components/DatePicker";
import { BoldText, Text, MediumText, SemiBoldText } from "../components/Text";
import { sendToast, ToastType } from "../components/Toast";
import {
  UpdateAvatar,
  UpdateAvatarVariables
} from "../lib/graphql/UpdateAvatar";
import { COLORS, SPACING } from "../lib/styles";
import UPDATE_AVATAR_MUTATION from "../lib/UpdateAvatarMutation.graphql";
import { COPY_BY_SIGN, getSign, ZodiacIcon } from "../lib/zodiac";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { EditableAvatar } from "../components/EditableAvatar";
import { UserContext } from "../components/UserContext";
import { SCREEN_DIMENSIONS } from "../../config";
import LinearGradient from "react-native-linear-gradient";
import { EmojiTextInput } from "../components/NewPost/Text/EmojiTextInput";
import { NavigationActions } from "react-navigation";
import { navigate, resetTo } from "../lib/NavigationService";

const AVATAR_SIZE = 196;

const styles = StyleSheet.create({
  sign: {
    paddingTop: SPACING.double,
    paddingBottom: SPACING.double,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  },
  avatarShadow: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE,
    shadowRadius: 1,
    shadowOffset: {
      width: 1,
      height: 0
    },
    shadowColor: "white",
    shadowOpacity: 0.25
  },
  avatarContainer: {
    borderWidth: 2,
    borderRadius: AVATAR_SIZE,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderColor: "white",
    backgroundColor: "#000"
  },
  datePicker: {
    backgroundColor: "#eee",
    position: "relative",
    zIndex: 100,
    width: "100%"
  },
  title: {
    marginTop: SPACING.normal,
    fontSize: 24,
    textAlign: "center",
    color: "#fff"
  },
  paragraph: {
    fontSize: 18,
    color: "#eee",
    paddingTop: SPACING.double,
    paddingBottom: SPACING.double,
    paddingHorizontal: SPACING.double
  },
  right: {
    color: "white",
    fontSize: 18
  },
  top: {
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.double,
    justifyContent: "center",
    alignItems: "center"
  },
  username: {
    fontSize: 24,
    color: "#eee",
    marginTop: SPACING.normal
  },
  emojiInputContainer: {
    position: "relative"
  },
  emojiTextInput: {
    opacity: 0
  },
  emojiInputLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    color: COLORS.secondary,
    textDecorationLine: "underline",
    textDecorationColor: "#ccc",
    fontSize: 16
  }
});

const Background = ({ width = SCREEN_DIMENSIONS.width, height = 300 }) => (
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

class RawAvatarScreen extends React.Component {
  static navigationOptions = ({ navigation }): NavigationStackOptions => ({
    title: "Upload your avatar",
    headerStyle: {
      backgroundColor: "#000"
    },
    headerRight: () => (
      <TouchableOpacity onPress={navigation.getParam("onPressNext")}>
        <View>
          <BoldText style={styles.right}>Finish</BoldText>
        </View>
      </TouchableOpacity>
    )
  });

  maxDate = subYears(new Date(), 13);
  minDate = subYears(new Date(), 100);

  render() {
    const { username, onChange, photoURL, mediaId } = this.props;

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",

          justifyContent: "space-between"
        }}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1, overflow: "visible" }}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Background height={SCREEN_DIMENSIONS.height} />

          <View style={styles.top}>
            <View style={styles.avatarShadow}>
              <View style={styles.avatarContainer}>
                <EditableAvatar
                  size={AVATAR_SIZE}
                  src={photoURL}
                  onChange={onChange}
                />
              </View>
            </View>
            <SemiBoldText style={styles.username}>@{username}</SemiBoldText>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}

const _AvatarScreen = props => {
  const [updateAvatar] = useMutation<UpdateAvatar, UpdateAvatarVariables>(
    UPDATE_AVATAR_MUTATION
  );
  const navigation = useNavigation();
  const userContext = React.useContext(UserContext);
  const [mediaId, setMediaId] = React.useState(null);

  const handleChangeAvatar = React.useCallback(
    mediaId => {
      setMediaId(mediaId);
      return updateAvatar({
        variables: {
          mediaId
        }
      });
    },
    [setMediaId]
  );

  const handleNext = React.useCallback(() => {
    if (!mediaId) {
      sendToast("Please upload an avatar", ToastType.error);
      return;
    }

    const onFinish = navigation.getParam("onFinish");

    if (typeof onFinish === "function") {
      navigation.dismiss();
      typeof onFinish === "function" && onFinish();
    } else {
      resetTo("ThreadList", {});
    }
    userContext.hideAuthModal();
  }, [updateAvatar, mediaId, sendToast, userContext]);

  React.useEffect(() => {
    navigation.setParams({ onPressNext: handleNext });
  }, [handleNext]);

  return (
    <RawAvatarScreen
      onChange={handleChangeAvatar}
      username={userContext?.currentUser?.username}
      mediaId={mediaId}
      photoURL={userContext?.currentUser?.photoURL}
    />
  );
};

export const AvatarScreen = hoistNonReactStatics(
  _AvatarScreen,
  RawAvatarScreen
);

export default AvatarScreen;
