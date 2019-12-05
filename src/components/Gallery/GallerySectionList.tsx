import * as React from "react";
import { View, StyleSheet } from "react-native";
import { YeetImageContainer } from "../../lib/imageSearch";
import { NetworkStatus } from "apollo-client";
import { FlatList } from "../FlatList";
import { GallerySectionItem } from "../NewPost/ImagePicker/FilterBar";
import { GalleryHeader } from "./GalleryHeader";
import { SCREEN_DIMENSIONS } from "../../../config";
import { SPACING } from "../../lib/styles";
import { GallerySection, GallerySectionComponent } from "./GallerySection";
import CAMERA_ROLL_QUERY from "../../lib/CameraRollQuery.local.graphql";
import GIFS_QUERY from "../../lib/GIFSearchQuery.local.graphql";
import GALLERY_QUERY from "../../lib/GalleryListQuery.local.graphql";
import { useApolloClient, useQuery, useLazyQuery } from "react-apollo";
import CameraRollGraphQL from "../../lib/CameraRollGraphQL";
import Pager from "react-native-tab-view/src/Pager";
import {
  VERTICAL_ITEM_HEIGHT,
  SQUARE_ITEM_HEIGHT,
  VERTICAL_ITEM_WIDTH,
  SQUARE_ITEM_WIDTH
} from "./GalleryFilterList";

const COLUMN_COUNT = 3;
const COLUMN_GAP = 2;

const SECTION_SEPARATOR_HEIGHT = SPACING.double;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  wrapper: {
    flex: 1,
    width: SCREEN_DIMENSIONS.width,
    overflow: "hidden"
  },
  column: {},
  sectionSeparator: {
    width: 1,
    height: SECTION_SEPARATOR_HEIGHT
  }
});

const SectionSeparatorComponent = () => (
  <View style={styles.sectionSeparator} />
);

type GalleryFilter = GallerySectionItem | null;

type Props = {
  query: string;
  sections: Array<GallerySection>;
  section: GallerySection | null;
  onChangeQuery: (value: string) => void;
  onChangeFilter: (filter: GalleryFilter) => void;
};

class GallerySectionListComponent extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  setFlatListRef = (flatList: FlatList) => {
    this.flatListRef = flatList;

    const { flatListRef } = this.props;

    if (flatListRef && typeof flatListRef === "function") {
      flatListRef(flatList);
    }
  };

  sectionKeyExtractor = item => {
    return item.type;
  };

  handlePressColumn = (image: YeetImageContainer) => {
    this.props.onPressColumn(image);
  };

  renderSectionItem = ({
    item,
    index
  }: {
    item: GallerySection;
    index: number;
  }) => {
    return (
      <GallerySectionComponent
        section={item}
        rowCount={item.type === GallerySectionItem.photos ? 2 : 1}
        onPressHeader={this.props.onChangeFilter}
        onPressColumn={this.handlePressColumn}
        paused={!this.props.isFocused}
        columnHeight={
          item.type === GallerySectionItem.videos
            ? VERTICAL_ITEM_HEIGHT
            : SQUARE_ITEM_HEIGHT
        }
        columnWidth={
          item.type === GallerySectionItem.videos
            ? VERTICAL_ITEM_WIDTH
            : SQUARE_ITEM_WIDTH
        }
      />
    );
  };

  contentInset = {
    top: SPACING.normal,
    bottom: 0,
    left: 0,
    right: 0
  };

  render() {
    const { sections, section, isFocused, onEndReached } = this.props;

    return (
      <View style={styles.wrapper}>
        <FlatList
          ref={this.setFlatListRef}
          data={sections}
          directionalLockEnabled
          contentInset={this.contentInset}
          extraData={isFocused}
          style={styles.container}
          keyExtractor={this.sectionKeyExtractor}
          renderItem={this.renderSectionItem}
          ItemSeparatorComponent={SectionSeparatorComponent}
          contentInsetAdjustmentBehavior="automatic"
        />
      </View>
    );
  }
}

const buildSection = (
  type: GallerySectionItem,
  data: Array<YeetImageContainer>,
  networkStatus: NetworkStatus
): GallerySection => {
  return {
    type,
    data: data.map(image => ({
      id: image.id,
      image: image
    })),
    networkStatus
  };
};

const ORDERED_ITEMS = [
  GallerySectionItem.photos,
  GallerySectionItem.videos,
  GallerySectionItem.gifs
];

export const GallerySectionList = ({
  onPress,
  flatListRef,
  onChangeFilter,
  isFocused
}) => {
  const client = useApolloClient();
  client.addResolvers(CameraRollGraphQL);

  const galleryQuery = useQuery(GALLERY_QUERY, {
    variables: {
      columnCount: COLUMN_COUNT,
      photoColumnCount: COLUMN_COUNT * 2
    },
    returnPartialData: true,
    notifyOnNetworkStatusChange: true
  });

  const sections: Array<GallerySection> = React.useMemo(() => {
    if (typeof galleryQuery.data === "undefined") {
      return ORDERED_ITEMS.map(type =>
        buildSection(type, [], galleryQuery.networkStatus)
      );
    }

    const { videos = {}, gifs = {}, photos = {} } = galleryQuery?.data ?? {};

    return ORDERED_ITEMS.map(type => {
      let data = [];
      if (type === GallerySectionItem.videos) {
        data = videos?.data;
      } else if (type === GallerySectionItem.gifs) {
        data = gifs?.data;
      } else if (type === GallerySectionItem.photos) {
        data = photos?.data;
      }

      return buildSection(type, data || [], galleryQuery?.networkStatus);
    });
  }, [galleryQuery?.data, galleryQuery?.networkStatus, galleryQuery]);

  return (
    <GallerySectionListComponent
      sections={sections}
      isFocused={isFocused}
      onChangeFilter={onChangeFilter}
      flatListRef={flatListRef}
      onPressColumn={onPress}
    />
  );
};
