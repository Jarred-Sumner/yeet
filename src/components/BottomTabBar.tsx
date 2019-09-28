import * as React from "react";
import { View, StyleSheet } from "react-native";

import Animated from "react-native-reanimated";
import { RectButton } from "react-native-gesture-handler";
import { IconHome, IconPlus, IconSearch, IconProfile } from "./Icon";
import { useNavigation } from "react-navigation-hooks";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../config";
import { SPACING } from "../lib/styles";
import LinearGradient from "react-native-linear-gradient";
import { BAR_HEIGHT } from "./ThreadList/Seekbar";

export const TAB_BAR_HEIGHT = 56.5;
export const TAB_BAR_OFFSET = TAB_BAR_HEIGHT + BOTTOM_Y;

const styles = StyleSheet.create({
  container: {
    marginTop: BAR_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.85)",
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
  }
});

const TabBarIcon = ({ Icon, focused, onPress, route }) => {
  const handlePress = React.useCallback(() => {
    onPress(route);
  }, [route, onPress]);

  return (
    <RectButton onPress={handlePress}>
      <Animated.View style={styles.buttonContainer}>
        <Icon size={24} color={focused ? "#fff" : "#aaa"} />
      </Animated.View>
    </RectButton>
  );
};

const ROUTES_ICONS_MAPPING = {
  FeedTab: IconHome,
  NewPostStack: IconPlus,
  SearchTab: IconSearch,
  ProfileTab: IconProfile
};

export const BottomTabBar = ({ style, currentRoute }) => {
  const navigation = useNavigation();

  const openRoute = React.useCallback(
    routeName => {
      navigation.navigate(routeName);
    },
    [navigation]
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
