import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../../config";
import { FilterBarRow } from "./FilterBarRow";
import { FILTERS, ICONS } from "./GallerySectionItem";
import {
  LIGHT_LIST_HEADER_HEIGHT,
  LIST_HEADER_HEIGHT
} from "./LIGHT_LIST_HEADER_HEIGHT";

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
    justifyContent: "center"
  },
  lightContainer: {
    alignItems: "center",
    height: LIGHT_LIST_HEADER_HEIGHT,
    width: SCREEN_DIMENSIONS.width,
    paddingBottom: 4,
    overflow: "visible",
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
  icon: {
    textAlign: "center",
    alignSelf: "center"
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
  lightRow: { height: LIGHT_LIST_HEADER_HEIGHT },

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
    bottom: 6
  },
  bottomIndicator: {
    top: 0
  },
  topIndicator: {
    bottom: 0
  }
});

export const FilterBar = ({
  position,
  onChange,
  value,
  light,
  hidden = false,
  rightInset = 0,
  tabs,
  icons = false,
  inset,
  indicatorWidth: _indicatorWidth,
  containerWidth = SCREEN_DIMENSIONS.width,
  tabBarPosition
}) => {
  const width = (containerWidth - inset) / tabs.length;
  const count = tabs.length;
  const _inset = light ? 8 : 0;
  const indicatorWidth = _indicatorWidth ?? width - _inset - rightInset;

  const indicatorStyles = [
    styles.indicator,
    tabBarPosition === "bottom" && styles.bottomIndicator,
    tabBarPosition === "top" && styles.topIndicator,
    light && styles.lightIndicator,
    { width: indicatorWidth },

    {
      transform: [
        {
          translateX: light ? (width - indicatorWidth) / 2 : inset
        },
        {
          translateX: Animated.min(
            Animated.max(
              Animated.divide(
                Animated.multiply(
                  position,
                  containerWidth -
                    (light ? (width - indicatorWidth) / 2 : inset)
                ),
                count
              ),
              light ? (width - indicatorWidth) / -2 + inset : 0
            ),
            containerWidth - inset - (light ? rightInset - indicatorWidth : 0)
          )
        }
      ]
    }
  ];

  const renderFilter = React.useCallback(
    filter => {
      return (
        <FilterBarRow
          key={filter.value}
          onPress={onChange}
          iconOnly={icons}
          isActive={value === filter.value}
          inset={inset}
          value={filter.value}
          light={light}
          size={{ width }}
          Icon={icons ? ICONS[filter.value] : undefined}
        >
          {filter.label}
        </FilterBarRow>
      );
    },
    [onChange, value, inset, tabs.length, icons, light]
  );

  return (
    <Animated.View
      display={hidden ? "none" : undefined}
      style={[
        light
          ? [styles.lightContainer, { width: containerWidth }]
          : styles.container
      ]}
    >
      <View style={{ width: inset, height: 1 }} />
      {FILTERS.filter(({ value }) => tabs.includes(value)).map(renderFilter)}
      <Animated.View style={indicatorStyles} />
    </Animated.View>
  );
};

export default FilterBar;
