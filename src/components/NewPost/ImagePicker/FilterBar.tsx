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
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
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
    position: "absolute",
    left: 0,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  indicatorCircle: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
    backgroundColor: "white"
  },
  lightIndicator: {
    bottom: 3
  },
  bottomIndicator: {
    top: 3
  },
  topIndicator: {
    bottom: 8
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
  const indicatorWidth = width;

  // const indicatorStyles = [
  //   styles.indicator,
  //   tabBarPosition === "bottom" && styles.bottomIndicator,
  //   tabBarPosition === "top" && styles.topIndicator,
  //   light && styles.lightIndicator,
  //   { width: indicatorWidth },

  //   {
  //     transform: [
  //       { translateX: inset },
  //       {
  //         translateX: Animated.min(
  //           Animated.max(
  //             Animated.divide(
  //               Animated.multiply(position, containerWidth - width + inset),
  //               count
  //             ),
  //             0
  //           ),
  //           containerWidth - inset
  //         )
  //       }
  //     ]
  //   }
  // ];

  const renderFilter = React.useCallback(
    (filter, index) => {
      return (
        <FilterBarRow
          key={`${filter.value}-${value === filter.value}`}
          onPress={onChange}
          iconOnly={icons}
          isActive={value === filter.value}
          inset={inset}
          value={filter.value}
          light={light}
          isLast={index === tabs.length - 1}
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
    <View style={styles.container}>
      {inset > 0 && <View style={{ width: inset, height: 1 }} />}
      {FILTERS.filter(({ value }) => tabs.includes(value)).map(renderFilter)}
      {/* <Animated.View style={indicatorStyles}>
        <View style={styles.indicatorCircle} />
      </Animated.View> */}
    </View>
  );
};

export default FilterBar;
