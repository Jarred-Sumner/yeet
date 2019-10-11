import * as React from "react";
import { StyleSheet, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useNavigation } from "react-navigation-hooks";
import { BOTTOM_Y } from "../../config";
import { SPACING, COLORS } from "../lib/styles";
import { IconHome, IconNotification, IconPlus, IconProfile } from "./Icon";
import { BAR_HEIGHT } from "./ThreadList/Seekbar";
import { AuthState, UserContext } from "./UserContext";
import { SemiBoldText, BoldText } from "./Text";
import tinyColor from "tinycolor2";

export const TAB_BAR_HEIGHT = 56.5;
export const TAB_BAR_OFFSET = TAB_BAR_HEIGHT + BOTTOM_Y;

const styles = StyleSheet.create({
  container: {
    marginTop: BAR_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.95)",
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 1
  },
  wrapper: {
    position: "relative"
  },
  buttonContainer: {
    paddingHorizontal: SPACING.double,
    marginBottom: BOTTOM_Y,
    height: TAB_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center"
  },
  iconWrapper: {
    position: "relative"
  },
  badgeContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: tinyColor("#fa3e3e")
      .darken(25)
      .toRgbString(),
    position: "absolute",
    top: -9,
    right: -9,
    alignItems: "center",
    justifyContent: "center"
    // transform: [{ scale: 0.9 }]
  },
  bigBadgeContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    top: -11,
    right: -11
  },
  focusedBadgeContainer: {
    backgroundColor: "#fa3e3e"
    // transform: [{ scale: 1 }]
  },
  badgeText: {
    color: "#ccc",
    textAlign: "center"
  },
  focusedBadgeText: {
    color: "white"
  }
});

const TabBarIcon = ({ Icon, focused, onPress, route, badgeCount = 0 }) => {
  const handlePress = React.useCallback(() => {
    onPress(route);
  }, [route, onPress]);

  return (
    <RectButton onPress={handlePress}>
      <Animated.View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Icon size={24} color={focused ? "#fff" : "#999"} />
          {badgeCount > 0 && (
            <View
              style={[
                styles.badgeContainer,
                badgeCount > 9 && styles.bigBadgeContainer,
                focused && styles.focusedBadgeContainer
              ]}
            >
              <BoldText
                adjustsFontSizeToFit
                style={[styles.badgeText, focused && styles.focusedBadgeText]}
              >
                {Math.min(badgeCount, 99)}
              </BoldText>
            </View>
          )}
        </View>
      </Animated.View>
    </RectButton>
  );
};

const ROUTES_ICONS_MAPPING = {
  FeedTab: IconHome,
  NewPostStack: IconPlus,
  NotificationsTab: IconNotification,
  ProfileTab: IconProfile
};

const REQUIRES_AUTH = ["NotificationsTab", "ProfileTab"];

export const BottomTabBar = ({ style, currentRoute }) => {
  const navigation = useNavigation();

  const {
    authState,
    requireAuthentication,
    currentUser,
    badgeCount
  } = React.useContext(UserContext);

  const openRoute = React.useCallback(
    routeName => {
      if (
        REQUIRES_AUTH.includes(routeName) &&
        authState !== AuthState.loggedIn
      ) {
        requireAuthentication(() => openRoute(routeName));
        return;
      }

      if (routeName.includes("Stack")) {
        navigation.navigate(routeName);
      } else {
        navigation.navigate(routeName);
      }
    },
    [navigation, authState, requireAuthentication]
  );

  return (
    <Animated.View style={style}>
      <Animated.View style={styles.wrapper}>
        {/* <LinearGradient
          style={{
            position: "absolute",
            zIndex: 0,
            bottom: 0,
            left: 0,
            right: 0
          }}
          height={TAB_BAR_HEIGHT + BOTTOM_Y}
          width={SCREEN_DIMENSIONS.width}
          pointerEvents="none"
          colors={["rgba(0, 0, 0, 0.85)", "rgba(0, 0, 0, 0.45)"]}
        /> */}

        <Animated.View style={[styles.container]}>
          {Object.entries(ROUTES_ICONS_MAPPING).map(([route, Icon]) => (
            <TabBarIcon
              key={route}
              Icon={Icon}
              route={route}
              badgeCount={route === "NotificationsTab" ? badgeCount : 0}
              focused={
                currentRoute
                  ? route === currentRoute
                  : navigation.state.routeName === route
              }
              onPress={openRoute}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};
