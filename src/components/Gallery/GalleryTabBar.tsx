import * as React from "react";
import Animated from "react-native-reanimated";
import { TOP_Y } from "../../../config";
import { COLORS } from "../../lib/styles";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import { GalleryHeader } from "./GalleryHeader";
import { DEFAULT_TABS } from "./GalleryTabView";
import { View } from "react-native";

export const GalleryTabBar = ({
  navigationState,
  onChangeInputFocus,
  onChangeQuery,
  scrollY,
  route,
  onChangeRoute,
  isInputFocused = false,
  position,
  query
}) => (
  <View
    style={{
      position: "relative",
      zIndex: 9999,
      backgroundColor: COLORS.background,
      height: LIST_HEADER_HEIGHT,
      justifyContent: "flex-end"
    }}
  >
    <GalleryHeader
      navigationState={navigationState}
      route={route}
      tabs={DEFAULT_TABS}
      scrollY={scrollY}
      showHeader
      onChangeInputFocus={onChangeInputFocus}
      isInputFocused={isInputFocused}
      tabBarPosition="top"
      position={position}
      query={query}
      onChangeRoute={onChangeRoute}
      onChangeQuery={onChangeQuery}
    ></GalleryHeader>
  </View>
);
