import { View, StyleSheet } from "react-native";
import * as React from "react";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { SPACING } from "../../lib/styles";
import ImageSearch from "../NewPost/ImagePicker/ImageSearch";
import FilterBar from "../NewPost/ImagePicker/FilterBar";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-navigation";
import {
  BackButton,
  useBackButtonBehavior,
  BackButtonBehavior
} from "../Button";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useNavigation } from "react-navigation-hooks";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#131116",
    width: SCREEN_DIMENSIONS.width,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    flex: 0
  },
  header: {
    width: "100%",
    opacity: 0.75,
    flexDirection: "row",
    paddingVertical: SPACING.half,
    paddingHorizontal: SPACING.normal
  },

  spacer: {
    height: SPACING.half,
    width: 1
  },
  light: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingTop: 4,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden"
  }
});

export const GalleryHeader = ({
  query,
  onChangeQuery,
  filter,
  position = new Animated.Value(0),
  jumpTo,
  showHeader,
  scrollY,
  navigationState: { index, routes },
  ...otherProps
}) => {
  const navigation = useNavigation();
  const behavior = useBackButtonBehavior();

  const { top } = React.useContext(SafeAreaContext);
  return (
    <Animated.View
      style={[
        styles.container,
        showHeader ? { paddingTop: top } : styles.light
      ]}
    >
      {showHeader && (
        <View style={styles.header}>
          <BackButton size={18} behavior={behavior} />
        </View>
      )}
      <FilterBar
        value={routes[index].key}
        onChange={jumpTo}
        light={!showHeader}
        scrollY={scrollY}
        position={position}
      />
    </Animated.View>
  );
};