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
    flex: 0,
    width: SCREEN_DIMENSIONS.width,
    height: LIST_HEADER_HEIGHT
    // shadowRadius: 1,
    // shadowOffset: {
    //   width: 0,
    //   height: StyleSheet.hairlineWidth
    // },
    // shadowOpacity: 0.9,
    // shadowColor: "black"
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
    flex: 1,
    overflow: "hidden",
    backgroundColor: chroma(COLORS.primaryDark).css(),
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    width: SCREEN_DIMENSIONS.width,
    height: LIST_HEADER_HEIGHT
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
  onChangeRoute,
  filterBarInset = 50,
  headerCutoff,
  isInputFocused,
  onChangeInputFocus,
  tabs = [],
  children,
  onPressSectionFilter,
  scrollY,
  route,

  ...otherProps
}) => {
  const { bottom } = React.useContext(SafeAreaContext);

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
          value={route}
          tabs={tabs}
          onChange={onChangeRoute}
          light={false}
          inset={0}
          tabBarPosition={tabBarPosition}
        />
      </View>
    </View>
  );
};
