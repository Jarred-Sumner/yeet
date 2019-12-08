import { NetworkStatus } from "apollo-client";
import { StyleSheet, View } from "react-native";
import { YeetImageContainer } from "../../lib/imageSearch";
import {
  GallerySectionItem,
  FILTER_LABELS
} from "../NewPost/ImagePicker/FilterBar";
import SectionHeader from "./SectionHeader";
import * as React from "react";
import GalleryItem from "./GalleryItem";
import { SPACING } from "../../lib/styles";

export type GalleryValue = {
  image: YeetImageContainer;
  id: string;
};

export type GallerySection = {
  type: GallerySectionItem;
  data: Array<GalleryValue>;
  networkStatus: NetworkStatus;
};

const styles = StyleSheet.create({
  container: {},
  columns: {
    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent: "space-evenly"
  },
  column: {
    marginBottom: 4
  }
});

export const GallerySectionComponent = ({
  section,
  onPressHeader,
  onPressColumn,
  selectedIDs = [],
  paused,
  rowCount,
  columnWidth,
  columnHeight
}: {
  section: GallerySection;
}) => {
  const handlePressHeader = React.useCallback(() => {
    onPressHeader(section.type);
  }, [section.type, onPressHeader]);

  const renderColumn =
    // React.useCallback(
    (column: GalleryValue, index: number) => {
      const isSelected = selectedIDs.includes(column.image.id);
      return (
        <View key={column.id} style={styles.column}>
          <GalleryItem
            image={column.image}
            id={column.id}
            paused={paused}
            width={columnWidth}
            height={columnHeight}
            onPress={onPressColumn}
            isSelected={isSelected}
          />
        </View>
      );
    };
  // [columnWidth, columnHeight, onPressColumn, selectedIDs]
  // );

  return (
    <View style={styles.container}>
      <SectionHeader
        label={FILTER_LABELS[section.type]}
        onPress={handlePressHeader}
      />

      <View style={styles.columns}>{section.data.map(renderColumn)}</View>
    </View>
  );
};
