import * as React from "react";
import { StyleSheet, View } from "react-native";
import { BaseButton } from "react-native-gesture-handler";
import { COLORS, SPACING } from "../../lib/styles";
import { SemiBoldText, Text } from "../Text";
import { IconChevronRight } from "../Icon";
import { GallerySectionItem } from "../NewPost/ImagePicker/GallerySectionItem";
import chroma from "chroma-js";
import { COLUMN_GAP } from "./COLUMN_COUNT";

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.half,
    height: 44,
    paddingHorizontal: SPACING.half,
    marginHorizontal: SPACING.half,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: "hidden"
  },
  left: {
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row"
  },
  title: {
    color: "#fff",
    fontSize: 14
  },
  chevron: {
    fontSize: 10,
    color: "#666",
    alignSelf: "center",
    alignItems: "center"
  },
  right: {
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row"
  },
  icon: {
    marginRight: SPACING.half
  },
  viewAll: {
    color: COLORS.muted,
    fontSize: 14,
    alignItems: "center",
    marginRight: SPACING.half
  }
});

const ICON_SIZES = {
  [GallerySectionItem.recent]: 22,
  [GallerySectionItem.all]: 22,
  [GallerySectionItem.internet]: 22,
  [GallerySectionItem.search]: 22,
  [GallerySectionItem.memes]: 22,
  [GallerySectionItem.assets]: 22,

  [GallerySectionItem.sticker]: 20,
  [GallerySectionItem.cameraRoll]: 16,
  [GallerySectionItem.gifs]: 16
};

export const SectionHeader = ({ label, onPress, showViewAll, value, Icon }) => {
  const press = React.useCallback(() => {
    onPress && onPress(value);
  }, [value, onPress]);

  return (
    <BaseButton
      exclusive
      enabled={!!(!!onPress && showViewAll)}
      onPress={press}
    >
      <View style={styles.container}>
        <View style={styles.left}>
          {/* <Icon style={styles.icon} size={ICON_SIZES[value]} color="white" /> */}
          <SemiBoldText style={styles.title}>{label}</SemiBoldText>
        </View>

        <View style={styles.right}>
          {showViewAll && (
            <>
              <Text style={styles.viewAll}>View all</Text>
              <IconChevronRight style={styles.chevron} color="#ccc" />
            </>
          )}
        </View>
      </View>
    </BaseButton>
  );
};
export default SectionHeader;
