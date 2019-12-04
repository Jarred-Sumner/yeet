import * as React from "react";
import { StyleSheet, View } from "react-native";
import { RectButton, TouchableOpacity } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useNavigation } from "react-navigation-hooks";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../config";
import { SPACING, COLORS } from "../lib/styles";
import {
  IconHome,
  IconNotification,
  IconPlus,
  IconProfile,
  IconHomeAlt,
  IconNotificationAlt,
  IconProfileAlt,
  IconCircleAdd
} from "./Icon";
import { BAR_HEIGHT } from "./ThreadList/Seekbar";
import { AuthState, UserContext } from "./UserContext";
import { SemiBoldText, BoldText, MediumText, Text } from "./Text";
import tinyColor from "tinycolor2";
import { BlurView } from "@react-native-community/blur";

export const TAB_BAR_HEIGHT = 56.5;
export const TAB_BAR_OFFSET = TAB_BAR_HEIGHT + BOTTOM_Y;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 1
  },
  blur: {
    position: "absolute",
    left: 0,
    height: TAB_BAR_OFFSET,
    width: "100%",
    opacity: 0.95,
    backgroundColor: "black",
    bottom: 0,
    right: 0,
    zIndex: 0
  },
  wrapper: {
    position: "relative"
  },
  buttonContainer: {
    width: SCREEN_DIMENSIONS.width / 4,
    paddingHorizontal: SPACING.double,
    marginBottom: BOTTOM_Y,
    paddingTop: 8,
    height: TAB_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center"
  },
  iconWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center"
  },

  badgeContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: tinyColor("#fa3e3e")
      .darken(25)
      .toRgbString(),
    position: "absolute",
    top: -6,
    right: -6,
    alignItems: "center",
    justifyContent: "center"
    // transform: [{ scale: 0.9 }]
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",

    height: 28,
    textAlign: "center",
    alignSelf: "center"
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

const TabBarIcon = ({
  Icon,
  focused,
  label,
  FocusedIcon,
  onPress,
  disabled,
  route,
  badgeCount = 0
}) => {
  const handlePress = React.useCallback(() => {
    onPress(route);
  }, [route, onPress]);

  const IconComponent = focused ? FocusedIcon : Icon;

  return (
    <TouchableOpacity disabled={disabled} onPressIn={handlePress}>
      <Animated.View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <IconComponent
            style={styles.icon}
            size={26}
            color={focused ? "#fff" : "#999"}
          />
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
    </TouchableOpacity>
  );
};

const ROUTE_LABELS = {
  FeedTab: "Home",
  NewPostStack: "Thread",
  NotificationsTab: "Notifications",
  ProfileTab: "Profile"
};

const ROUTES_ICONS_MAPPING = {
  FeedTab: [IconHomeAlt, IconHome],

  NotificationsTab: [IconNotification, IconNotification],
  ProfileTab: [IconProfileAlt, IconProfile]
};

const REQUIRES_AUTH = ["NotificationsTab", "ProfileTab", "NewPostStack"];

export const BottomTabBar = ({ style, currentRoute, onPressCurrentRoute }) => {
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

  const ref = React.useRef();

  const renderTab = React.useCallback(
    ([route, [Icon, FocusedIcon]]) => {
      const isFocused = route === currentRoute;

      const handlePress = React.useCallback(() => {
        if (isFocused) {
          typeof onPressCurrentRoute === "function" && onPressCurrentRoute();
        } else {
          openRoute(route);
        }
      }, [onPressCurrentRoute, isFocused, route, openRoute]);

      return (
        <TabBarIcon
          key={route}
          Icon={Icon}
          FocusedIcon={FocusedIcon}
          route={route}
          label={ROUTE_LABELS[route]}
          disabled={isFocused && !onPressCurrentRoute}
          badgeCount={route === "NotificationsTab" ? badgeCount : 0}
          focused={isFocused}
          onPress={handlePress}
        />
      );
    },
    [openRoute, currentRoute, badgeCount, onPressCurrentRoute]
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

        {/* <BlurView
          viewRef={ref}
          blurType="dark"
          blurAmount={100}
          style={[styles.blur]}
        /> */}
        <View ref={ref} style={styles.container}>
          {Object.entries(ROUTES_ICONS_MAPPING).map(renderTab)}
        </View>
      </Animated.View>
    </Animated.View>
  );
};
