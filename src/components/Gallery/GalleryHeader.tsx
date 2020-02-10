import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/core";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { SPACING, COLORS } from "../../lib/styles";
import { BlurView } from "../BlurView";
import { BackButton, useBackButtonBehavior } from "../Button";
import FilterBar from "../NewPost/ImagePicker/FilterBar";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import chroma from "chroma-js";
import { ImagePickerSearch } from "./ImagePickerSearch";
import { BorderlessButton } from "react-native-gesture-handler";
import { MediumText } from "../Text";
import { IconChevronDown } from "../Icon";

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    alignItems: "flex-end",
    height: LIST_HEADER_HEIGHT,
    justifyContent: "flex-end",
    overflow: "hidden",
    flex: 0,
    backgroundColor: chroma(COLORS.primaryDark)
      .alpha(0.98)
      .css(),
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32
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
  filter: {
    flexDirection: "row",
    flex: 0,
    alignItems: "center",
    paddingBottom: 8
  },

  dark: {
    zIndex: 9,

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
  headerCutoff,
  isInputFocused,
  onChangeInputFocus,
  tabs = [],
  children,
  onPressSectionFilter,
  scrollY,
  navigationState: { index, routes },
  ...otherProps
}) => {
  const navigation = useNavigation();
  const behavior = useBackButtonBehavior();

  const { bottom } = React.useContext(SafeAreaContext);

  const tabKeys = React.useMemo(() => routes.map(({ key }) => key), [routes]);

  const containerStyles = [
    styles.container,
    styles.dark,
    {
      height: LIST_HEADER_HEIGHT
    }
  ];

  return (
    <View style={containerStyles}>
      <View style={styles.filter}>
        <FilterBar
          value={routes[index].key}
          tabs={tabKeys}
          onChange={jumpTo}
          light={false}
          scrollY={scrollY}
          inset={0}
          tabBarPosition={tabBarPosition}
          position={position}
        />
      </View>
    </View>
  );
};
