import { NetworkStatus } from "apollo-client";
import { StyleSheet, View } from "react-native";
import { YeetImageContainer } from "../../lib/imageSearch";
import {
  GallerySectionItem,
  FILTER_LABELS
} from "../NewPost/ImagePicker/GallerySectionItem";
import SectionHeader from "./SectionHeader";
import * as React from "react";
import GalleryItem from "./GalleryItem";
import { SPACING } from "../../lib/styles";
import { range, get } from "lodash";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { MediaSource } from "../MediaPlayer/MediaPlayerComponent";

export type GalleryValue = {
  image: YeetImageContainer;
  mediaSource?: Partial<MediaSource>;
  post?: Partial<PostFragment>;
  id: string;
};

export type GallerySection = {
  type: GallerySectionItem;
  data: Array<GalleryValue>;
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
  columnCount = 0,
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
    (index: number) => {
      const column = section.data[index];
      const isSelected = selectedIDs.includes(column?.image?.id);

      return (
        <View
          key={column?.id ?? `placeholder-${index}`}
          style={[styles.column, { width: columnWidth }]}
        >
          {column && (
            <GalleryItem
              image={column.image}
              mediaSource={
                column.post?.media
                  ? {
                      ...column.post?.media,
                      id: `${column.post?.id}-cell`,
                      url:
                        column.post?.media.coverUrl ??
                        column.post?.media.previewUrl ??
                        column.post?.media.url
                    }
                  : null
              }
              id={column.id}
              paused={paused}
              post={column.post}
              username={get(column, "post.profile.username")}
              width={columnWidth}
              height={columnHeight}
              onPress={onPressColumn}
              isSelected={isSelected}
            />
          )}
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
        showViewAll={
          ![
            GallerySectionItem.clipboardImage,
            GallerySectionItem.clipboardURL,
            GallerySectionItem.recent
          ].includes(section.type)
        }
      />

      <View style={styles.columns}>
        {range(0, columnCount * rowCount).map(renderColumn)}
      </View>
    </View>
  );
};
