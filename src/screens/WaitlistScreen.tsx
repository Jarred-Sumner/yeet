import * as React from "react";
import { View, StatusBar, StyleSheet, Alert, AlertIOS } from "react-native";
import { useNavigation, useFocusEffect } from "react-navigation-hooks";
import { COLORS, SPACING } from "../lib/styles";
import { BoldText, Text, SemiBoldText } from "../components/Text";
import LinearGradient from "react-native-linear-gradient";
import {
  SCREEN_DIMENSIONS,
  TOP_Y,
  BOTTOM_Y,
  BASE_HOSTNAME
} from "../../config";
import {
  BitmapIconLogoWaitlist,
  BitmapIconTwitterDiscuss
} from "../components/BitmapIcon";
import { BorderlessButton } from "react-native-gesture-handler";
import { IconButton } from "../components/Button";
import { IconHelp, IconLock } from "../components/Icon";
import { useQuery, useMutation } from "react-apollo";
import WAITLIST_QUERY from "../lib/WaitlistQuery.graphql";
import REDEEM_CODE_MUTATION from "../lib/redeemInviteCodeMutation.graphql";
import { WaitlistQuery } from "../lib/graphql/WaitlistQuery";
import { NetworkStatus } from "apollo-client";
import {
  RedeemInviteCode,
  RedeemInviteCodeVariables
} from "../lib/graphql/RedeemInviteCode";
import { openLink } from "../components/Link";

const styles = StyleSheet.create({
  top: {
    marginTop: TOP_Y,
    paddingTop: SPACING.double,
    alignItems: "center"
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 16,
    marginTop: SPACING.normal
  },
  bigCount: {
    fontSize: 100,
    marginTop: SPACING.double * 3,
    lineHeight: 121
  },
  page: {
    flex: 1,
    backgroundColor: "#000"
  },
  label: {
    marginTop: SPACING.half,
    fontSize: 18
  },
  mutedLabel: {
    color: COLORS.muted
  },
  loginButton: {
    paddingBottom: SPACING.double
  },
  loginTextLabel: {
    fontSize: 18,
    color: COLORS.muted
  },
  helpButton: {},
  footer: {
    marginBottom: BOTTOM_Y,
    alignItems: "center"
  },

  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0
  },
  count: {
    fontSize: 40,
    lineHeight: 40
  },
  textShadow: {
    textAlign: "center",
    width: "100%",
    textShadowRadius: 1,
    textShadowOffset: {
      width: 1,
      height: 1
    },
    textShadowColor: "rgba(0, 0, 0, 0.25)"
  },
  center: {
    flex: 1
  },
  buttonSpacer: {
    height: SPACING.double,
    width: 1
  },
  questionMark: {
    position: "absolute",
    top: TOP_Y,
    right: 0,
    paddingRight: SPACING.double,
    paddingTop: 0,
    zIndex: 10
  },
  lockIcon: {
    position: "absolute",
    top: TOP_Y,
    left: 0,
    paddingLeft: SPACING.double,
    paddingTop: 0,
    zIndex: 10
  },
  countSpacer: {
    width: 1,
    height: SPACING.double * 2
  },

  content: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    zIndex: 2
  }
});

const BackgroundGradient = ({
  width = SCREEN_DIMENSIONS.width,
  height = SCREEN_DIMENSIONS.height
}) => (
  <LinearGradient
    pointerEvents="none"
    width={width}
    height={height}
    style={styles.backgroundGradient}
    locations={[0, 0.332, 0.6859, 1.0]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    colors={[
      "rgba(0, 0, 0, 0.4)",
      "rgba(57, 28, 84, 0.4)",
      "rgba(57, 28, 84, 0.4)",
      "rgba(0, 0, 0, 0.4)"
    ]}
  />
);

export const WaitlistScreen = ({}) => {
  const navigation = useNavigation();
  const waitlistQuery = useQuery<WaitlistQuery>(WAITLIST_QUERY, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    pollInterval: 10000
  });

  const pollToggler = React.useCallback(() => {
    if (waitlistQuery.networkStatus !== NetworkStatus.poll) {
      waitlistQuery.startPolling(10000);
    }

    return () => {
      if (waitlistQuery.networkStatus === NetworkStatus.poll) {
        waitlistQuery.stopPolling();
      }
    };
  }, [waitlistQuery]);

  const [redeemCodeMutation] = useMutation<
    RedeemInviteCode,
    RedeemInviteCodeVariables
  >(REDEEM_CODE_MUTATION);

  useFocusEffect(pollToggler);

  const handleOpenLogin = React.useCallback(() => {
    navigation.navigate("Login", {
      isModal: true
    });
    waitlistQuery.stopPolling();
  }, [navigation, waitlistQuery]);

  const handleOpenTwitter = React.useCallback(() => {}, []);
  const handlePressHelp = React.useCallback(() => {
    openLink(BASE_HOSTNAME + "/waiting-list.html");
  }, [openLink, BASE_HOSTNAME]);
  const handlePressRedeem = React.useCallback(() => {
    Alert.prompt(
      "Enter invite code",
      "Paste your invite code here",
      (code: string | null) => {
        if (!!code && String(code).length > 0) {
          redeemCodeMutation({
            variables: {
              code
            }
          }).then(
            ({ data: { redeemInviteCode = false } = {} }) => {
              if (redeemInviteCode) {
                navigation.navigate("RootAuth", {
                  hideBack: true
                });
              } else {
                Alert.alert("Invite code didn't work.");
              }
            },
            () => {
              Alert.alert("Invite code didn't work.");
            }
          );
        }
      },
      "plain-text",
      "",
      "ascii-capable"
    );
  }, [redeemCodeMutation, navigation]);

  return (
    <View style={styles.page}>
      <StatusBar hidden />
      <BackgroundGradient />

      <View style={styles.lockIcon}>
        <IconButton
          onPress={handlePressRedeem}
          Icon={IconLock}
          size={24}
          color={COLORS.muted}
          type="shadow"
        />
      </View>

      <View style={styles.questionMark}>
        <IconButton
          onPress={handlePressHelp}
          Icon={IconHelp}
          size={24}
          color={COLORS.muted}
          type="shadow"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.top}>
          <BitmapIconLogoWaitlist />
          <Text style={[styles.subtitle, styles.textShadow]}>
            video mashup community
          </Text>
        </View>

        <View style={styles.center}>
          <BoldText style={[styles.count, styles.bigCount, styles.textShadow]}>
            {waitlistQuery.data?.waitlistAhead ?? "∞"}
          </BoldText>
          <Text style={[styles.label, styles.textShadow]}>
            people in front of you
          </Text>
          <View style={styles.countSpacer} />

          <BoldText
            style={[styles.count, styles.textShadow, styles.mutedLabel]}
          >
            {waitlistQuery.data?.waitlistBehind ?? "∞"}
          </BoldText>
          <Text style={[styles.label, styles.textShadow, styles.mutedLabel]}>
            people behind you
          </Text>
        </View>

        <View style={styles.footer}>
          {/* <BorderlessButton onPress={handleOpenTwitter} style={styles.discuss}>
            <BitmapIconTwitterDiscuss />
          </BorderlessButton> */}
          <View style={styles.buttonSpacer} />
          <BorderlessButton
            style={styles.loginButton}
            onPress={handleOpenLogin}
          >
            <SemiBoldText style={styles.loginTextLabel}>
              Already have an account?
            </SemiBoldText>
          </BorderlessButton>
        </View>
      </View>
    </View>
  );
};

WaitlistScreen.navigationOptions = ({
  navigation
}): NavigationStackOptions => ({
  headerMode: "none",
  headerShown: false
});

export default WaitlistScreen;
