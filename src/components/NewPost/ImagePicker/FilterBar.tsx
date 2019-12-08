import * as React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import SafeAreaView, { getInset } from "react-native-safe-area-view";
import tinycolor from "tinycolor2";
import { COLORS } from "../../../lib/styles";
import { SemiBoldText, BoldText } from "../../Text";
import { RectButton } from "react-native-gesture-handler";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../../config";

export enum GallerySectionItem {
  memes = "memes",
  gifs = "gifs",
  photos = "photos",
  videos = "videos"
}

export const FILTER_LABELS = {
  [GallerySectionItem.memes]: "MEMES",
  [GallerySectionItem.gifs]: "GIFs",
  [GallerySectionItem.photos]: "PHOTOS",
  [GallerySectionItem.videos]: "VIDEOS"
};

export const LIST_HEADER_HEIGHT = 35;

export const FILTERS = [
  {
    label: "RECENT",
    value: "all"
  },
  // {
  //   label: FILTER_LABELS[GallerySectionItem.memes],
  //   value: GallerySectionItem.memes
  // },

  {
    label: FILTER_LABELS[GallerySectionItem.photos],
    value: GallerySectionItem.photos
  },
  {
    label: FILTER_LABELS[GallerySectionItem.videos],
    value: GallerySectionItem.videos
  },
  {
    label: FILTER_LABELS[GallerySectionItem.gifs],
    value: GallerySectionItem.gifs
  }
];

const count = FILTERS.length;

export const FILTER_WIDTH = SCREEN_DIMENSIONS.width / count;

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
    borderRadius: 0,
    flexDirection: "row",
    justifyContent: "center",
    position: "relative"
  },
  lightContainer: {
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

    width: FILTER_WIDTH,
    opacity: 0.65,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  indicator: {
    width: FILTER_WIDTH,
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
  inset
}) => {
  const handlePress = React.useCallback(() => {
    onPress(value);
  }, [onPress, value]);

  const width = { width: FILTER_WIDTH - inset / count };

  return (
    <RectButton
      onPress={handlePress}
      enabled={!isActive}
      style={
        isActive ? [styles.row, styles.activeRow, width] : [styles.row, width]
      }
      underlayColor={tinycolor(COLORS.primary)
        .setAlpha(0.5)
        .toString()}
    >
      <View>
        <SemiBoldText style={styles.headerText}>{children}</SemiBoldText>
      </View>
    </RectButton>
  );
};

export const FilterBar = ({
  position,
  onChange,
  value,
  light,
  scrollY,
  inset,
  tabBarPosition
}) => {
  const indicatorStyles = [
    styles.indicator,
    light && styles.lightIndicator,
    inset > 0 && { width: FILTER_WIDTH - inset / count },
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
        >
          {filter.label}
        </ListHeaderRow>
      );
    },
    [onChange, value, inset]
  );

  return (
    <Animated.View style={[light ? styles.lightContainer : styles.container]}>
      <View style={{ width: inset, heihgt: 1 }} />
      {FILTERS.map(renderFilter)}
      <Animated.View style={indicatorStyles} />
    </Animated.View>
  );
};

export default FilterBar;
