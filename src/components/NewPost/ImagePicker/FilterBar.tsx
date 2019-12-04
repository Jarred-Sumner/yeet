import * as React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import SafeAreaView, { getInset } from "react-native-safe-area-view";
import tinycolor from "tinycolor2";
import { COLORS } from "../../../lib/styles";
import { SemiBoldText } from "../../Text";
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
  headerText: {
    fontSize: 12,
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
    backgroundColor: COLORS.primary,
    position: "absolute",
    bottom: 0,
    left: 0
  }
});

export const ListHeaderRow = ({
  isActive = true,
  children,
  onPress,
  value
}) => {
  const handlePress = React.useCallback(() => {
    onPress(value);
  }, [onPress, value]);

  return (
    <RectButton
      onPress={handlePress}
      enabled={!isActive}
      style={isActive ? [styles.row, styles.activeRow] : styles.row}
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

export const FilterBar = ({ position, onChange, value }) => {
  const indicatorStyles = [
    styles.indicator,
    {
      transform: [
        {
          translateX: Animated.min(
            Animated.max(
              Animated.divide(
                Animated.multiply(position, SCREEN_DIMENSIONS.width),
                count
              ),
              0
            ),
            SCREEN_DIMENSIONS.width
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
          value={filter.value}
        >
          {filter.label}
        </ListHeaderRow>
      );
    },
    [onChange, value]
  );

  return (
    <View style={styles.container}>
      {FILTERS.map(renderFilter)}
      <Animated.View style={indicatorStyles} />
    </View>
  );
};

export default FilterBar;
