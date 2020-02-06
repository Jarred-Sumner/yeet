import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  YeetImageContainer,
  imageContainerFromMediaSource
} from "../../lib/imageSearch";
import { NetworkStatus } from "apollo-client";
import { fromPairs, chunk } from "lodash";
import { FlatList } from "../FlatList";
import {
  GallerySectionItem,
  FILTERS,
  ICONS
} from "../NewPost/ImagePicker/GallerySectionItem";
import RECENT_IMAGES_QUERY from "../../lib/RecentImages.local.graphql";
import { GalleryHeader } from "./GalleryHeader";
import { SCREEN_DIMENSIONS } from "../../../config";
import { SPACING, COLORS } from "../../lib/styles";
import {
  GallerySection,
  GallerySectionComponent,
  GalleryValue
} from "./GallerySection";
import CAMERA_ROLL_QUERY from "../../lib/CameraRollQuery.local.graphql";
import GIFS_QUERY from "../../lib/GIFSearchQuery.local.graphql";
import GALLERY_QUERY from "../../lib/GalleryListQuery.local.graphql";
import { useApolloClient, useQuery, useLazyQuery } from "react-apollo";
import CameraRollGraphQL from "../../lib/CameraRollGraphQL";
import Pager from "react-native-tab-view/src/Pager";
import chroma from "chroma-js";
import {
  PostSearchQuery,
  PostSearchQueryVariables
} from "../../lib/graphql/PostSearchQuery";
import POST_SEARCH_QUERY from "../../lib/PostSearchQuery.graphql";
import ASSET_SEARCH_QUERY from "../../lib/AssetSearchQuery.graphql";
import {
  AssetSearchQuery,
  AssetSearchQueryVariables
} from "../../lib/graphql/AssetSearchQuery";
import {
  VERTICAL_ITEM_HEIGHT,
  SQUARE_ITEM_HEIGHT,
  VERTICAL_ITEM_WIDTH,
  SQUARE_ITEM_WIDTH,
  INSET_SQUARE_ITEM_WIDTH,
  INSET_SQUARE_ITEM_HEIGHT
} from "./sizes";
import Animated from "react-native-reanimated";
import { ClipboardContext } from "../Clipboard/ClipboardContext";
import { scaleRectToWidth } from "../../lib/Rect";
import {
  getInitialLimit,
  buildPostValue,
  buildValue,
  buildMediaValue,
  postToCell,
  _buildValue
} from "./GalleryFilterList";
import { RESULTS } from "react-native-permissions";
import FastList from "../FastList";
import memoize from "memoizee";
import { MediaPlayerPauser } from "../MediaPlayer/MediaPlayerContext";
import { GalleryRow } from "./GalleryItem";
import SectionHeader from "./SectionHeader";

const COLUMN_COUNT = 3;
const COLUMN_GAP = 2;

const CLIPBOARD_IMAGE_WIDTH = SCREEN_DIMENSIONS.width / 2;
const CLIPBOARD_IMAGE_HEIGHT = 200;
const SECTION_HEADER_HEIGHT = 44;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    flex: 0,
    overflow: "visible",
    position: "relative"
  },
  footer: {
    overflow: "hidden"
  },

  modalContainer: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible"
  },
  wrapper: {
    width: SCREEN_DIMENSIONS.width,
    flex: 0,
    overflow: "visible"
  },
  modalWrapper: {
    flex: 1,
    flexShrink: 0,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible"
  },
  separator: {
    height: 0
  },
  item: {
    marginRight: COLUMN_GAP
  },
  fourItem: {
    marginLeft: COLUMN_GAP
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999
  }
});

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

  static getSections = memoize((data, numColumns) =>
    chunk(
      data.map((row, index) => index),
      numColumns
    )
  );

  get sections() {
    return this.props.sectionOrder.map(section =>
      GallerySectionListComponent.getSections(
        this.props.sections[section],
        this.props.numColumns
      )
    );
  }

  get sectionCounts() {
    return this.sections.map(section => section.length);
  }

  setFlatListRef = (flatList: FastList) => {
    this.flatListRef = flatList;

    const { flatListRef } = this.props;

    if (flatListRef && typeof flatListRef === "function") {
      flatListRef(flatList.scrollView.current);
    }

    if (this.flatListRef) {
      // this.handleScroll({
      //   nativeEvent: { visibleRows: this.flatListRef.visibleRows }
      // });
    }
  };

  handleChangeSection = () => {};

  renderSection = (sectionNumber: number) => {
    const section = this.props.sectionOrder[sectionNumber];
    const filter = FILTERS.find(filter => filter.value === section);
    return (
      <SectionHeader
        label={filter.label}
        Icon={ICONS[filter.value]}
        value={filter.value}
        onPress={this.handleChangeSection}
        showViewAll
      />
    );
  };

  handleRenderRow = (section: number, row: number) => {
    const { itemWidth, itemHeight, numColumns, padding } = this.props;
    const type = this.props.sectionOrder[section];
    const data = this.props.sections[type];
    const columns = this.sections[section][row] ?? [];

    if (columns.length > 0) {
      return (
        <GalleryRow
          first={data[columns[0]]}
          second={data[columns[1]]}
          third={data[columns[2]]}
          fourth={data[columns[3]]}
          width={itemWidth}
          numColumns={numColumns}
          selectedIDs={this.props.selectedIDs}
          height={itemHeight}
          onPress={this.handlePressColumn}
          transparent={this.props.isModal}
          resizeMode={this.props.resizeMode}
        />
      );
    } else {
      return null;
    }
  };

  render() {
    const {
      sections,
      section,
      isFocused,
      onEndReached,
      inset,
      isModal,
      sectionOrder,
      height
    } = this.props;

    return (
      <MediaPlayerPauser isHidden={!isFocused}>
        <View style={styles.wrapper}>
          <FastList
            ref={this.setFlatListRef}
            contentInsetAdjustmentBehavior="never"
            keyboardDismissMode="interactive"
            // contentInset={this.contentInset}
            // contentOffset={this.contentOffset}
            insetBottom={0}
            insetTop={0}
            scrollTopValue={this.props.scrollY}
            scrollIndicatorInsets={this.scrollIndicatorInsets}
            insetTopValue={this.props.insetValue}
            automaticallyAdjustContentInsets={false}
            keyboardShouldPersistTaps="always"
            isLoading={false}
            renderRow={this.handleRenderRow}
            maintainVisibleContentPosition
            containerHeight={height}
            scrollToOverflowEnabled
            overScrollMode="never"
            stickyHeaders={false}
            scrollTopValue={this.props.scrollY}
            footerHeight={0}
            headerHeight={0}
            style={this.listStyle}
            onScrollEnd={this.handleScrollEnd}
            isFastList
            alwaysBounceVertical
            // renderEmpty={ListEmptyComponent ? this.renderListEmpty : undefined}
            rowHeight={this.props.itemHeight + COLUMN_GAP * 2}
            // sectionHeight={this.getTotalHeight}
            sections={this.sectionCounts}
            uniform={false}
            style={styles.container}
          />
        </View>
      </MediaPlayerPauser>
    );
  }
}

const buildSection = (
  type: GallerySectionItem,
  data: Array<GalleryValue>
): GallerySection => {
  return {
    type,
    data
  };
};

const sectionWithContent = (section: GallerySection) => {
  return (
    section.data.length > 0 && section.type !== GallerySectionItem.clipboardURL
  );
};

export const GallerySectionList = ({
  onPress,
  selectedIDs,
  offset,
  isModal,
  simultaneousHandlers,
  inset,
  query = "",
  onChangeFilter,
  isFocused,
  ...otherProps
}) => {
  const clipboardContext = React.useContext(ClipboardContext);
  const sectionOrder = React.useRef([]);

  const columnCount = 3;
  const rowCount = 2;
  let width = SQUARE_ITEM_HEIGHT;
  let height = SQUARE_ITEM_WIDTH;

  const limit = columnCount * rowCount * 4;
  const latest = false;

  const assetsQuery = useQuery<AssetSearchQuery, AssetSearchQueryVariables>(
    ASSET_SEARCH_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: !isModal,
      variables: {
        query,
        limit,
        offset: 0,
        latest
      },
      notifyOnNetworkStatusChange: true
    }
  );

  const recentImagesQuery = useQuery(RECENT_IMAGES_QUERY, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    variables: {
      query: String(query).trim()
    },
    notifyOnNetworkStatusChange: true
  });

  const gifsQuery = useLazyQuery(GIFS_QUERY, {
    variables: {
      query,
      limit
    },
    notifyOnNetworkStatusChange: true
  });

  const memesQuery = useQuery<PostSearchQuery, PostSearchQueryVariables>(
    POST_SEARCH_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: isModal,
      variables: {
        query,
        limit,
        offset: 0,
        latest
      },
      notifyOnNetworkStatusChange: true
    }
  );

  const photosQuery = useQuery(CAMERA_ROLL_QUERY, {
    skip:
      global.MediaPlayerViewManager?.photosAuthorizationStatus !==
      RESULTS.GRANTED,
    variables: {
      assetType: "all",
      width,
      height,
      contentMode: "aspectFill",
      album: null,
      cache: false,

      first: limit
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only"
  });

  const clipboardImageSection = React.useMemo(() => {
    const { mediaSource } = clipboardContext;
    if (
      mediaSource &&
      !sectionOrder.current.includes(GallerySectionItem.clipboardImage)
    ) {
      sectionOrder.current.push(GallerySectionItem.clipboardImage);
    }

    if (mediaSource) {
      return buildSection(GallerySectionItem.clipboardImage, [
        buildMediaValue([{ mediaSource }])
      ]);
    } else {
      return null;
    }
  }, [
    clipboardContext,
    sectionOrder,
    clipboardContext.mediaSource,
    clipboardContext.clipboard.hasImages,
    buildSection,
    imageContainerFromMediaSource
  ]);

  const recentImagesSection = React.useMemo(() => {
    const images = recentImagesQuery?.data?.recentImages?.data || [];

    const data = images.slice(0, limit).map(row => {
      if (row.post) {
        return postToCell(row.post);
      } else {
        return _buildValue(row.image);
      }
    });

    if (
      data.length > 0 &&
      !sectionOrder.current.includes(GallerySectionItem.recent)
    ) {
      sectionOrder.current.push(GallerySectionItem.recent);
    }

    return {
      type: GallerySectionItem.recent,
      data
    };
  }, [recentImagesQuery?.data, sectionOrder, limit]);

  const clipboardURLSection = React.useMemo(() => {
    const {
      clipboard: { urls }
    } = clipboardContext;

    if (!clipboardImageSection && urls.length > 0) {
      return buildSection(GallerySectionItem.clipboardURL, []);
    } else {
      return null;
    }
  }, [
    clipboardImageSection,
    clipboardContext.clipboard.urls,
    buildSection,
    imageContainerFromMediaSource
  ]);

  const memesSection = React.useMemo<GallerySection>(() => {
    const data = buildPostValue(memesQuery?.data?.searchPosts?.data || []);
    if (
      data.length > 0 &&
      !sectionOrder.current.includes(GallerySectionItem.memes)
    ) {
      sectionOrder.current.push(GallerySectionItem.memes);
    }
    return {
      type: GallerySectionItem.memes,
      data
    };
  }, [
    memesQuery,
    buildPostValue,
    memesQuery?.data?.searchPosts?.data,
    sectionOrder
  ]);

  const assetsSection = React.useMemo<GallerySection>(() => {
    const data = buildMediaValue(assetsQuery?.data?.searchAssets?.data || []);
    if (
      data.length > 0 &&
      !sectionOrder.current.includes(GallerySectionItem.assets)
    ) {
      sectionOrder.current.push(GallerySectionItem.assets);
    }

    return {
      type: GallerySectionItem.assets,
      data
    };
  }, [
    assetsQuery,
    buildMediaValue,
    assetsQuery?.data?.searchPosts?.data,
    sectionOrder
  ]);

  const cameraRollSection = React.useMemo<GallerySection>(() => {
    const data = buildValue(photosQuery?.data?.cameraRoll?.data || []);
    if (
      data.length > 0 &&
      !sectionOrder.current.includes(GallerySectionItem.cameraRoll)
    ) {
      sectionOrder.current.push(GallerySectionItem.cameraRoll);
    }

    return {
      type: GallerySectionItem.cameraRoll,
      data
    };
  }, [
    photosQuery?.data?.cameraRoll?.id,
    photosQuery?.data?.cameraRoll?.data,
    buildValue,
    sectionOrder
  ]);

  const gifsSection = React.useMemo<GallerySection>(() => {
    const data = buildValue(gifsQuery?.data?.gifs?.data || []);
    if (
      data.length > 0 &&
      !sectionOrder.current.includes(GallerySectionItem.gifs)
    ) {
      sectionOrder.current.push(GallerySectionItem.gifs);
    }

    return {
      type: GallerySectionItem.gifs,
      data
    };
  }, [gifsQuery?.data, sectionOrder, buildValue]);

  const sections = React.useMemo(() => {
    const seenIds = {};

    return fromPairs(
      [
        clipboardImageSection,
        recentImagesQuery,
        recentImagesSection,
        gifsSection,
        cameraRollSection,
        assetsSection,
        memesSection
      ]
        .filter(section => section?.data?.length ?? 0 > 0)
        .map(section => {
          const rows = [];
          for (const row of section.data) {
            if (!seenIds[row.id]) {
              rows.push(row);
              seenIds[row.id] = true;
            }
          }

          return [section.type, rows];
        })
    );
  }, [
    recentImagesSection,
    clipboardImageSection,
    gifsSection,
    cameraRollSection,
    assetsSection,
    memesSection
  ]);

  return (
    <GallerySectionListComponent
      {...otherProps}
      sectionOrder={sectionOrder.current}
      sections={sections}
      isFocused={isFocused}
      onChangeFilter={onChangeFilter}
      offset={offset}
      isModal={isModal}
      numColumns={columnCount}
      rowCount={rowCount}
      itemHeight={height}
      itemWidth={width}
      selectedIDs={selectedIDs}
      onPressColumn={onPress}
      simultaneousHandlers={simultaneousHandlers}
      inset={inset}
    />
  );
};
