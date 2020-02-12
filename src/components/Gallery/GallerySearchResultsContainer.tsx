import memoizee from "memoizee";
import * as React from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { YeetImageContainer } from "../../lib/imageSearch";
import { sendLightFeedback } from "../../lib/Vibration";
import { GallerySearchList } from "./GallerySearchList";
import { ImagePickerSearch } from "./ImagePickerSearch";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import { styles } from "./galleryContainerStyles";
import { GalleryTabBar } from "./GalleryTabBar";

export const getSelectedIDs = memoizee((images: Array<YeetImageContainer>) => {
  return images.map(image => image.id);
});

class RawGallerySearchResultsContainer extends React.Component {
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
      this.props.onChange(_selectedImages[0], post);
    }
  };

  renderTabBar = props => (
    <GalleryTabBar
      navigationState={props.navigationState}
      onChangeInputFocus={this.props.onChangeInputFocus}
      onChangeQuery={this.props.onChangeQuery}
      scrollY={this.scrollY}
      position={this.position}
      query={this.props.query}
    />
  );

  renderSearchHeader = isSearch => (
    <Animated.View
      style={
        isSearch ? [styles.memeHeader, styles.searchHeader] : styles.memeHeader
      }
    >
      <View style={styles.input}>
        <ImagePickerSearch
          autoFocusSearch={false}
          openSearch={this.props.openSearch}
          editable={false}
          onPressClose={this.props.onPressClose}
          query={this.props.query}
        />
      </View>
    </Animated.View>
  );

  scrollY = new Animated.Value<number>(0);

  render() {
    return (
      <View style={styles.page}>
        <View style={styles.searchSpacer} />
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            {this.renderSearchHeader(true)}
            <GallerySearchList
              query={this.props.query}
              isFocused={this.props.isFocused}
              isModal={false}
              onPress={this.handlePickPhoto}
              scrollY={this.scrollY}
              height={this.props.height - TOP_Y - LIST_HEADER_HEIGHT}
            />
          </View>
        </View>
      </View>
    );
  }
}

export const GallerySearchResultsContainer = props => {
  const { left, right } = React.useContext(SafeAreaContext);

  return (
    <RawGallerySearchResultsContainer
      {...props}
      showStart={props.showStart || false}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
    />
  );
};

export default GallerySearchResultsContainer;
