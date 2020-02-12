import * as React from "react";
import Animated from "react-native-reanimated";
import { TOP_Y } from "../../../config";
import { COLORS } from "../../lib/styles";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import { GalleryHeader } from "./GalleryHeader";
import { DEFAULT_TABS } from "./GalleryTabView";

export const GalleryTabBar = ({
  navigationState,
  onChangeInputFocus,
  onChangeQuery,
  scrollY,
  isInputFocused = false,
  position,
  query
}) => (
  <Animated.View
    style={{
      position: "relative",
      zIndex: 9999,
      backgroundColor: COLORS.background,
      height: LIST_HEADER_HEIGHT,
      justifyContent: "flex-end",
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange: [0, TOP_Y],
            outputRange: [0, -TOP_Y],
            extrapolateRight: Animated.Extrapolate.CLAMP
          })
        }
      ]
    }}
  >
    <GalleryHeader
      navigationState={navigationState}
      filter={navigationState.routes[0].key}
      tabs={DEFAULT_TABS}
      scrollY={scrollY}
      showHeader
      onChangeInputFocus={onChangeInputFocus}
      isInputFocused={isInputFocused}
      tabBarPosition="top"
      position={position}
      query={query}
      onChangeQuery={onChangeQuery}
    ></GalleryHeader>
  </Animated.View>
);
