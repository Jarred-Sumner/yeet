import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  YeetImageContainer,
  imageContainerFromMediaSource
} from "../../lib/imageSearch";
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
} from "./sizes";
import Animated from "react-native-reanimated";
import { ClipboardContext } from "../Clipboard/ClipboardContext";
import { scaleRectToWidth } from "../../lib/Rect";

const COLUMN_COUNT = 3;
const COLUMN_GAP = 2;

const SECTION_SEPARATOR_HEIGHT = SPACING.double;

const CLIPBOARD_IMAGE_WIDTH = SCREEN_DIMENSIONS.width / 2;
const CLIPBOARD_IMAGE_HEIGHT = 200;

const styles = StyleSheet.create({
  wrapper: {
    flex: 0,
    width: SCREEN_DIMENSIONS.width
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
  handlePressColumn = (image: YeetImageContainer, post) => {
    this.props.onPressColumn(image, post);
  };

  renderSectionItem = (item: GallerySection, index: number) => {
    let height = SQUARE_ITEM_HEIGHT;
    let width = SQUARE_ITEM_WIDTH;
    let rowCount = 1;
    let columnCount = 3;

    if (item.type === GallerySectionItem.videos) {
      height = VERTICAL_ITEM_HEIGHT;
      width = VERTICAL_ITEM_WIDTH;
    } else if (item.type === GallerySectionItem.clipboardImage) {
      const image = item.data[0]?.image?.image;

      if (image !== null) {
        height = CLIPBOARD_IMAGE_HEIGHT;
        width = CLIPBOARD_IMAGE_WIDTH;

        if (image && (image.width < width || image.height < height)) {
          width = image.width;
          height = image.height;
        } else if (image && image.width > width) {
          const dimensions = scaleRectToWidth(width, image);
          width = dimensions.width;
          height = dimensions.height;
        }
      }

      columnCount = 2;
    } else if (item.type === GallerySectionItem.photos) {
      rowCount = 2;
    } else if (item.type === GallerySectionItem.recent) {
      rowCount = Math.ceil(item.data.length / columnCount);
    }

    return (
      <React.Fragment key={item.type}>
        <GallerySectionComponent
          section={item}
          rowCount={rowCount}
          columnCount={columnCount}
          onPressHeader={this.props.onChangeFilter}
          onPressColumn={this.handlePressColumn}
          selectedIDs={this.props.selectedIDs}
          paused={!this.props.isFocused}
          columnHeight={height}
          columnWidth={width}
        />
        <SectionSeparatorComponent />
      </React.Fragment>
    );
  };

  render() {
    const {
      sections,
      section,
      isFocused,
      onEndReached,
      inset,
      isModal
    } = this.props;

    return (
      <Animated.View style={styles.wrapper}>
        {sections.map(this.renderSectionItem)}
      </Animated.View>
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
    data: data.map(image => {
      return {
        id: image.id,
        image
      };
    }),
    networkStatus
  };
};

const ORDERED_ITEMS = [
  GallerySectionItem.clipboardURL,
  GallerySectionItem.clipboardImage,
  // GallerySectionItem.cameraRoll,
  GallerySectionItem.gifs,
  GallerySectionItem.recent
];

const sectionWithContent = (section: GallerySection) => {
  return (
    section.data.length > 0 && section.type !== GallerySectionItem.clipboardURL
  );
};

export const GallerySectionList = ({
  onPress,
  selectedIDs,
  insetValue,
  offset,
  isModal,
  simultaneousHandlers,
  inset,
  onChangeFilter,
  isFocused
}) => {
  const client = useApolloClient();
  const clipboardContext = React.useContext(ClipboardContext);
  client.addResolvers(CameraRollGraphQL);

  const galleryQuery = useQuery(GALLERY_QUERY, {
    variables: {
      columnCount: COLUMN_COUNT,
      photoColumnCount: COLUMN_COUNT * 2,
      videoColumnCount: COLUMN_COUNT
    },
    fetchPolicy: "network-only",
    returnPartialData: true,
    errorPolicy: "ignore",
    notifyOnNetworkStatusChange: true
  });

  const initiallyFocused = React.useRef(isFocused);
  React.useEffect(() => {
    if (
      isFocused &&
      !initiallyFocused.current &&
      galleryQuery?.networkStatus === NetworkStatus.ready
    ) {
      galleryQuery?.refetch();
    }
  }, [isFocused, galleryQuery]);

  const clipboardImageSection = React.useMemo(() => {
    const { mediaSource } = clipboardContext;

    if (mediaSource) {
      return buildSection(
        GallerySectionItem.clipboardImage,
        [imageContainerFromMediaSource(mediaSource, null)],
        NetworkStatus.ready
      );
    } else {
      return null;
    }
  }, [
    clipboardContext,
    clipboardContext.mediaSource,
    clipboardContext.clipboard.hasImages,
    buildSection,
    imageContainerFromMediaSource
  ]);

  const clipboardURLSection = React.useMemo(() => {
    const {
      clipboard: { urls }
    } = clipboardContext;

    if (!clipboardImageSection && urls.length > 0) {
      return buildSection(
        GallerySectionItem.clipboardURL,
        [],
        NetworkStatus.ready
      );
    } else {
      return null;
    }
  }, [
    clipboardImageSection,
    clipboardContext.clipboard.urls,
    buildSection,
    imageContainerFromMediaSource
  ]);

  const sections: Array<GallerySection> = React.useMemo(() => {
    if (typeof galleryQuery.data === "undefined") {
      return ORDERED_ITEMS.map(type => {
        if (type === GallerySectionItem.clipboardImage) {
          return clipboardImageSection;
        } else if (type === GallerySectionItem.clipboardURL) {
          return clipboardURLSection;
        } else {
          return buildSection(type, [], galleryQuery.networkStatus);
        }
      })
        .filter(Boolean)
        .filter(sectionWithContent);
    }

    const { videos = {}, gifs = {}, photos = {}, recentImages = {} } =
      galleryQuery?.data ?? {};

    return ORDERED_ITEMS.map(type => {
      if (type === GallerySectionItem.clipboardImage) {
        return clipboardImageSection;
      } else if (type === GallerySectionItem.clipboardURL) {
        return clipboardURLSection;
      }

      let data = [];
      if (type === GallerySectionItem.gifs) {
        data = gifs?.data;
      } else if (type === GallerySectionItem.recent) {
        return {
          type,
          data: galleryQuery.data.recentImages.data,
          networkStatus: galleryQuery?.networkStatus
        };
      }

      return buildSection(type, data || [], galleryQuery?.networkStatus);
    })
      .filter(Boolean)
      .filter(sectionWithContent);
  }, [
    clipboardImageSection,
    clipboardURLSection,
    galleryQuery?.data,
    galleryQuery?.networkStatus,
    galleryQuery,
    clipboardContext
  ]);

  return (
    <GallerySectionListComponent
      sections={sections}
      isFocused={isFocused}
      onChangeFilter={onChangeFilter}
      offset={offset}
      isModal={isModal}
      selectedIDs={selectedIDs}
      onPressColumn={onPress}
      simultaneousHandlers={simultaneousHandlers}
      inset={inset}
    />
  );
};
