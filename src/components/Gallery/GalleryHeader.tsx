import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useNavigation } from "react-navigation-hooks";
import { SCREEN_DIMENSIONS } from "../../../config";
import { SPACING, COLORS } from "../../lib/styles";
import { BlurView } from "../BlurView";
import { BackButton, useBackButtonBehavior } from "../Button";
import FilterBar from "../NewPost/ImagePicker/FilterBar";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import chroma from "chroma-js";

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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal,
    flex: 1,
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1
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
    zIndex: 9,

    backgroundColor: chroma
      .blend(chroma(COLORS.primaryDark).alpha(0.98), "#333", "multiply")
      .alpha(0.95)
      .css(),
    overflow: "visible"
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
  tabViewRef,
  filter,
  position = new Animated.Value(0),
  jumpTo,
  filterBarInset = 50,
  tabs = [],
  scrollY,
  navigationState: { index, routes },
  ...otherProps
}) => {
  const navigation = useNavigation();
  const behavior = useBackButtonBehavior();

  const { top, bottom } = React.useContext(SafeAreaContext);

  const tabKeys = React.useMemo(() => routes.map(({ key }) => key), [routes]);

  const containerStyles = [
    styles.container,
    styles.dark,
    {
      paddingTop: top,
      height: top + LIST_HEADER_HEIGHT
    }
  ];

  return (
    <View style={containerStyles}>
      <View>
        <FilterBar
          value={routes[index].key}
          tabs={tabKeys}
          onChange={jumpTo}
          light={false}
          scrollY={scrollY}
          inset={filterBarInset}
          tabBarPosition={tabBarPosition}
          position={position}
        />
        <View style={[styles.header, { width: filterBarInset }]}>
          <BackButton
            color="white"
            alwaysChevron
            size={14}
            behavior={behavior}
          />
        </View>
      </View>
    </View>
  );
};
