import * as React from "react";
import { StyleSheet, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import chroma from "chroma-js";
import { SCREEN_DIMENSIONS } from "../../../../config";
import { COLORS } from "../../../lib/styles";
import { SemiBoldText } from "../../Text";

export enum GallerySectionItem {
  clipboardImage = "clipboardImage",
  clipboardURL = "clipboardURL",
  cameraRoll = "cameraRoll",
  search = "search",
  memes = "memes",
  recent = "recent",
  gifs = "gifs"
}

export const FILTER_LABELS = {
  [GallerySectionItem.search]: "SEARCH",
  [GallerySectionItem.clipboardImage]: "CLIPBOARD",
  [GallerySectionItem.recent]: "RECENT",

  [GallerySectionItem.clipboardURL]: "CLIPBOARD",
  [GallerySectionItem.memes]: "MEMES",
  [GallerySectionItem.gifs]: "GIFs",
  [GallerySectionItem.cameraRoll]: "CAMERA ROLL"
};

export const LIST_HEADER_HEIGHT = 35;

export const FILTERS = [
  {
    label: "SEARCH",
    value: "all"
  },
  {
    label: FILTER_LABELS[GallerySectionItem.memes],
    value: GallerySectionItem.memes
  },

  {
    label: FILTER_LABELS[GallerySectionItem.cameraRoll],
    value: GallerySectionItem.cameraRoll
  },

  {
    label: FILTER_LABELS[GallerySectionItem.gifs],
    value: GallerySectionItem.gifs
  }
];

const count = FILTERS.length;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: LIST_HEADER_HEIGHT,
    width: SCREEN_DIMENSIONS.width,
    shadowRadius: 1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: {
      width: 0,
      height: 1
    },
    overflow: "visible",
    borderRadius: 0,
    flexDirection: "row",
    justifyContent: "center",
    position: "relative"
  },
  lightContainer: {
    alignItems: "center",
    height: LIST_HEADER_HEIGHT,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible",
    shadowRadius: 1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: {
      width: 0,
      height: 1
    },
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    position: "relative"
  },
  headerText: {
    fontSize: 13,
    textAlign: "center"
  },
  activeRow: {
    opacity: 1,
    borderRightColor: "transparent"
  },
  row: {
    height: LIST_HEADER_HEIGHT,

    opacity: 0.65,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },

  rowWrapper: {
    justifyContent: "center",
    alignItems: "center"
  },
  indicator: {
    height: 3,
    borderRadius: 4,
    backgroundColor: "white",
    position: "absolute",
    left: 0,
    zIndex: 10
  },
  lightIndicator: {
    backgroundColor: COLORS.primary
  },
  bottomIndicator: {
    top: -4
  },
  topIndicator: {
    bottom: -3
  }
});

export const ListHeaderRow = ({
  isActive = true,
  children,
  onPress,
  value,
  size,
  inset
}) => {
  const handlePress = React.useCallback(() => {
    onPress(value);
  }, [onPress, value]);

  return (
    <RectButton
      onPress={handlePress}
      enabled={!isActive}
      style={
        isActive ? [styles.row, styles.activeRow, size] : [styles.row, size]
      }
      underlayColor={chroma(COLORS.primary)
        .alpha(0.5)
        .css()}
    >
      <View style={[size, styles.rowWrapper]}>
        <SemiBoldText
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.headerText, size]}
        >
          {children}
        </SemiBoldText>
      </View>
    </RectButton>
  );
};

export const FilterBar = ({
  position,
  onChange,
  value,
  light,
  tabs,
  scrollY,
  inset,
  tabBarPosition
}) => {
  const width = (SCREEN_DIMENSIONS.width - inset) / tabs.length;
  const count = tabs.length;
  const indicatorStyles = [
    styles.indicator,
    light && styles.lightIndicator,
    tabs.length === 3 ? { width } : { width },
    tabBarPosition === "bottom" && styles.bottomIndicator,
    tabBarPosition === "top" && styles.topIndicator,
    {
      transform: [
        {
          translateX: inset
        },
        {
          translateX: Animated.min(
            Animated.max(
              Animated.divide(
                Animated.multiply(position, SCREEN_DIMENSIONS.width - inset),
                count
              ),
              0
            ),
            SCREEN_DIMENSIONS.width - inset
          )
        }
      ]
    }
  ];

  const renderFilter = React.useCallback(
    filter => {
      return (
        <ListHeaderRow
          key={filter.value}
          onPress={onChange}
          isActive={value === filter.value}
          inset={inset}
          value={filter.value}
          size={{ width }}
        >
          {filter.label}
        </ListHeaderRow>
      );
    },
    [onChange, value, inset, tabs.length]
  );

  return (
    <Animated.View style={[light ? styles.lightContainer : styles.container]}>
      <View style={{ width: inset, height: 1 }} />
      {FILTERS.filter(({ value }) => tabs.includes(value)).map(renderFilter)}
      <Animated.View style={indicatorStyles} />
    </Animated.View>
  );
};

export default FilterBar;
