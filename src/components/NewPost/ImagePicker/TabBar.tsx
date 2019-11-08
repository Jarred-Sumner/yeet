import * as React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import SafeAreaView, { getInset } from "react-native-safe-area-view";
import tinycolor from "tinycolor2";
import { COLORS } from "../../../lib/styles";
import { SemiBoldText } from "../../Text";
import { RectButton } from "react-native-gesture-handler";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../../config";

export const LIST_HEADER_HEIGHT = 50;

const count = 2;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: LIST_HEADER_HEIGHT,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    position: "relative"
  },
  headerText: {
    fontSize: 24,
    textAlign: "center"
  },
  activeRow: {
    backgroundColor: tinycolor(COLORS.primary)
      .setAlpha(0.1)
      .toString(),
    opacity: 1
  },
  row: {
    height: LIST_HEADER_HEIGHT,
    width: SCREEN_DIMENSIONS.width / count,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.85
  },
  indicator: {
    width: SCREEN_DIMENSIONS.width / 2,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: "absolute",
    bottom: 0,
    left: 0
  }
});

export const ListHeaderRow = ({ isActive = true, children, jumpTo, route }) => {
  const onPress = React.useCallback(() => {
    jumpTo(route);
  }, [route, jumpTo]);

  return (
    <RectButton
      onPress={onPress}
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

export const TabBar = ({
  position,
  jumpTo,
  opacityValue,
  navigationState: { routes, index }
}) => {
  const indicatorStyles = [
    styles.indicator,
    {
      transform: [
        {
          translateX: Animated.interpolate(position, {
            inputRange: [0, routes.length - 1],
            outputRange: [0, SCREEN_DIMENSIONS.width / count]
          })
        }
      ]
    }
  ];

  indicatorStyles.push({ opacity: opacityValue || 0 });

  return (
    <View style={styles.container}>
      <ListHeaderRow
        route={routes[0].key}
        jumpTo={jumpTo}
        isActive={index === 0}
      >
        CAMERA ROLL
      </ListHeaderRow>
      <ListHeaderRow
        route={routes[1].key}
        jumpTo={jumpTo}
        isActive={index === 1}
      >
        THE INTERNET
      </ListHeaderRow>

      <Animated.View style={indicatorStyles} />
    </View>
  );
};

export default TabBar;
