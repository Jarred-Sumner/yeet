import { View, StyleSheet } from "react-native";
import * as React from "react";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { SPACING } from "../../lib/styles";
import ImageSearch from "../NewPost/ImagePicker/ImageSearch";
import FilterBar, {
  LIST_HEADER_HEIGHT
} from "../NewPost/ImagePicker/FilterBar";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-navigation";
import {
  BackButton,
  useBackButtonBehavior,
  BackButtonBehavior
} from "../Button";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useNavigation } from "react-navigation-hooks";
import { BlurView } from "@react-native-community/blur";
import { CAROUSEL_BACKGROUND } from "../NewPost/PostHeader";

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    flex: 0
  },
  header: {
    width: "100%",
    opacity: 0.75,
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal,

    top: 0,
    left: 0
  },

  spacer: {
    height: SPACING.half,
    width: 1
  },
  light: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    overflow: "hidden"
  },
  dark: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999

    // backgroundColor: CAROUSEL_BACKGROUND
    // overflow: "visible"
  },
  lightTop: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,

    paddingBottom: 3
  },
  lightBottom: {
    paddingTop: 4
  }
});

export const GalleryHeader = ({
  query,
  onChangeQuery,
  tabBarPosition,
  onDismiss,
  filter,
  position = new Animated.Value(0),
  jumpTo,
  filterBarInset = 50,
  showHeader,
  scrollY,
  navigationState: { index, routes },
  ...otherProps
}) => {
  const navigation = useNavigation();
  const behavior = useBackButtonBehavior();

  const { top, bottom } = React.useContext(SafeAreaContext);

  const content = (
    <>
      <FilterBar
        value={routes[index].key}
        onChange={jumpTo}
        light={!showHeader}
        scrollY={scrollY}
        inset={showHeader ? filterBarInset : 0}
        tabBarPosition={tabBarPosition}
        position={position}
      />
      {showHeader && (
        <View
          style={[
            styles.header,
            { paddingTop: SPACING.half + top, width: filterBarInset }
          ]}
        >
          <BackButton alwaysChevron size={14} behavior={behavior} />
        </View>
      )}
    </>
  );

  const containerStyles = [
    styles.container,
    showHeader ? styles.dark : styles.light,
    tabBarPosition === "top" &&
      showHeader && { paddingTop: top, height: top + LIST_HEADER_HEIGHT },
    tabBarPosition === "top" && styles.lightTop,
    tabBarPosition === "bottom" && {
      paddingBottom: bottom
    },
    tabBarPosition === "bottom" && styles.lightBottom
  ];

  if (showHeader) {
    return (
      <BlurView blurType="extraDark" blurAmount={25} style={containerStyles}>
        {content}
      </BlurView>
    );
  } else {
    return (
      <Animated.View pointerEvents="box-none" style={containerStyles}>
        {content}
      </Animated.View>
    );
  }
};
