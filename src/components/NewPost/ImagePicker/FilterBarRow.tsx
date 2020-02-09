import {
  LIST_HEADER_HEIGHT,
  LIGHT_LIST_HEADER_HEIGHT
} from "./LIGHT_LIST_HEADER_HEIGHT";
import * as React from "react";
import { View, StyleSheet } from "react-native";
import { RectButton, BorderlessButton } from "react-native-gesture-handler";
import { COLORS } from "../../../lib/styles";
import chroma from "chroma-js";
import { SemiBoldText } from "../../Text";
import { IconGlobe } from "../../Icon";
import { GallerySectionItem } from "./GallerySectionItem";

const styles = StyleSheet.create({
  icon: {
    textAlign: "center"
  },
  headerText: {
    fontSize: 17,
    textAlign: "center"
  },
  activeRow: {
    borderRightColor: "transparent"
  },
  row: {
    height: 22,
    marginTop: 20,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },

  rowWrapper: {
    justifyContent: "center",
    alignItems: "center"
  }
});

const ICON_SIZES = {
  [GallerySectionItem.recent]: 28,
  [GallerySectionItem.all]: 28,
  [GallerySectionItem.internet]: 28,
  [GallerySectionItem.search]: 28,
  [GallerySectionItem.memes]: 28,
  [GallerySectionItem.assets]: 28,

  [GallerySectionItem.sticker]: 23,
  [GallerySectionItem.cameraRoll]: 20,
  [GallerySectionItem.gifs]: 18
};

export const FilterBarRow = ({
  isActive = true,
  children,
  onPress,
  value,
  size,
  Icon,
  light,
  iconOnly,
  inset
}) => {
  const handlePress = React.useCallback(() => {
    onPress && onPress(value);
  }, [onPress, value]);

  const ButtonComponent = light ? BorderlessButton : RectButton;

  return (
    <ButtonComponent
      onPress={handlePress}
      enabled={!isActive}
      style={[styles.row, light && styles.lightRow, size]}
      underlayColor={chroma(COLORS.primary)
        .alpha(0.5)
        .css()}
    >
      <View style={[size, { opacity: isActive ? 1 : 0.65 }, styles.rowWrapper]}>
        {Icon ? (
          <Icon
            size={ICON_SIZES[value] ?? 20}
            color="white"
            resizeMode="contain"
            numberOfLines={1}
            style={styles.icon}
          />
        ) : (
          <SemiBoldText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.headerText, size]}
          >
            {children}
          </SemiBoldText>
        )}
      </View>
    </ButtonComponent>
  );
};
