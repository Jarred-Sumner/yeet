import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useNavigation } from "react-navigation-hooks";
import { SCREEN_DIMENSIONS } from "../../../config";
import { SPACING } from "../../lib/styles";
import { BlurView } from "../BlurView";
import { BackButton, useBackButtonBehavior } from "../Button";
import FilterBar, {
  LIST_HEADER_HEIGHT
} from "../NewPost/ImagePicker/FilterBar";

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    flex: 0,
    position: "relative"
  },
  header: {
    width: "100%",
    opacity: 0.75,
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal,
    flex: 1,
    height: "100%",
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
  tabs = [],
  scrollY,
  navigationState: { index, routes },
  ...otherProps
}) => {
  const navigation = useNavigation();
  const behavior = useBackButtonBehavior();
  const viewRef = React.useRef(null);

  const { top, bottom } = React.useContext(SafeAreaContext);

  const tabKeys = React.useMemo(() => tabs.map(({ key }) => key), [tabs]);

  const content = (
    <View ref={viewRef}>
      <FilterBar
        value={routes[index].key}
        tabs={tabKeys}
        onChange={jumpTo}
        light={!showHeader}
        scrollY={scrollY}
        inset={showHeader ? filterBarInset : 0}
        tabBarPosition={tabBarPosition}
        position={position}
      />
      {showHeader && (
        <View style={[styles.header, { width: filterBarInset }]}>
          <BackButton
            color="white"
            alwaysChevron
            size={14}
            behavior={behavior}
          />
        </View>
      )}
    </View>
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
      <BlurView
        viewRef={viewRef}
        blurType="dark"
        blurAmount={25}
        blurStyle={{
          height: top + LIST_HEADER_HEIGHT,
          width: SCREEN_DIMENSIONS.width,
          top: 0,
          left: 0,
          right: 0
        }}
        style={containerStyles}
      >
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
