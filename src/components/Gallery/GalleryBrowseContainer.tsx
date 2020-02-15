import { isArray } from "lodash";
import memoizee from "memoizee";
import * as React from "react";
import { View } from "react-native";
import { BorderlessButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { YeetImageContainer } from "../../lib/imageSearch";
import { COLORS } from "../../lib/styles";
import { sendLightFeedback } from "../../lib/Vibration";
import { DEFAULT_TABS, GalleryTabView } from "../Gallery/GalleryTabView";
import { ImagePickerSearch } from "../Gallery/ImagePickerSearch";
import { IconChevronDown } from "../Icon";
import { GallerySectionItem } from "../NewPost/ImagePicker/GallerySectionItem";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import { MediumText } from "../Text";
import { MEME_HEADER_HEIGHT, styles } from "./galleryContainerStyles";
import { GalleryTabBar } from "./GalleryTabBar";
import { StartFromHeader, TOP_HEADER } from "./StartFromHeader";
import { PanSheetContext } from "./PanSheetView";
import { PanSheetViewSize } from "../../lib/Yeet";

export const getSelectedIDs = memoizee((images: Array<YeetImageContainer>) => {
  return images.map(image => image.id);
});

class RawGalleryBrowseContainer extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      selectedImages: [],
      selectMultiple: false
    };
  }

  handlePickPhoto = (photo: YeetImageContainer, post) => {
    const { selectedImages, selectMultiple } = this.state;
    sendLightFeedback();

    const index = selectedImages.findIndex(image => photo.id === image.id);

    const _selectedImages = [...selectedImages];
    if (typeof index === "number" && index > -1) {
      _selectedImages.splice(index, 1);
    } else {
      _selectedImages.push(photo);
    }

    if (selectMultiple) {
      this.setState({ selectedImages: _selectedImages });
    } else {
      console.log(_selectedImages);
      this.handleFinish(_selectedImages, post);
    }
  };

  handleFinish = (_selectedImages, post) => {
    const selectedImages = isArray(_selectedImages)
      ? _selectedImages
      : this.state.selectedImages;

    const { onChange } = this.props;

    let photo = selectedImages[0];

    onChange(photo, post);
  };

  handleChangeRoute = (route: GallerySectionItem) => {};

  position = new Animated.Value<number>(0);

  renderTabBar = props => (
    <GalleryTabBar
      route={props.route}
      navigationState={props.navigationState}
      onChangeInputFocus={this.props.onChangeInputFocus}
      onChangeQuery={this.props.onChangeQuery}
      onChangeRoute={props.onChangeRoute}
      scrollY={this.scrollY}
      position={this.position}
      query={this.props.query}
    />
  );

  renderSearchHeader = isSearch => (
    <Animated.View style={styles.memeHeader}>
      <View style={styles.input}>
        <ImagePickerSearch
          autoFocusSearch={false}
          openSearch={this.props.openSearch}
          editable={false}
          onChangeInputFocus={this.props.onChangeInputFocus}
          isInputFocused={this.props.isInputFocused}
          onPressClose={this.props.clearSearch}
          query={this.props.query}
        />
      </View>

      <View style={styles.footer}>
        <BorderlessButton style={styles.sectionFilterButton}>
          <Animated.View style={styles.sectionFilter}>
            <MediumText style={styles.sectionFilterLabel}>Trending</MediumText>
            <IconChevronDown
              size={8}
              color={COLORS.mutedLabel}
              style={styles.sectionFilterChevron}
            />
          </Animated.View>
        </BorderlessButton>
      </View>
    </Animated.View>
  );

  renderHeader = props => {
    if (
      props.listKey === GallerySectionItem.memes ||
      props.listKey === GallerySectionItem.search
    ) {
      return this.renderSearchHeader(
        props.listKey === GallerySectionItem.search
      );
    } else {
      return null;
    }
  };
  headerHeight = props => {
    if (
      props.listKey === GallerySectionItem.memes ||
      props.listKey === GallerySectionItem.search
    ) {
      return MEME_HEADER_HEIGHT;
    } else {
      return 0;
    }
  };

  scrollY = this.props.scrollY;

  render() {
    return (
      <View style={{ width: "100%", height: "100%", position: "relative" }}>
        <View style={styles.page}>
          <View key="container" style={styles.container}>
            <GalleryTabView
              width={this.props.width}
              height={this.props.height - TOP_Y - LIST_HEADER_HEIGHT}
              onPress={this.handlePickPhoto}
              show
              isModal={false}
              offset={this.props.offset}
              isFocused={this.props.isFocused}
              ref={this.galleryTabViewRef}
              position={this.position}
              waitFor={this.props.waitFor}
              simultaneousHandlers={this.props.simultaneousHandlers}
              renderTabBar={this.renderTabBar}
              selectedIDs={getSelectedIDs(this.state.selectedImages)}
              headerHeight={this.headerHeight}
              renderHeader={this.renderHeader}
              tabBarPosition="top"
              tabs={DEFAULT_TABS}
              scrollY={this.scrollY}
              initialRoute={this.props.initialRoute || "all"}
            />
          </View>
        </View>
      </View>
    );
  }
}

export const GalleryBrowseContainer = props => {
  const { left, right } = React.useContext(SafeAreaContext);
  const { setSize } = React.useContext(PanSheetContext);

  React.useEffect(() => {
    setSize(PanSheetViewSize.short);
  }, [setSize]);

  return (
    <RawGalleryBrowseContainer
      {...props}
      showStart={props.showStart || false}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
    />
  );
};

export default GalleryBrowseContainer;
