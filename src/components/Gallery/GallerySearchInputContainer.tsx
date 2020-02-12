import memoizee from "memoizee";
import * as React from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { SCREEN_DIMENSIONS } from "../../../config";
import { YeetImageContainer } from "../../lib/imageSearch";
import { styles } from "./galleryContainerStyles";
import { GalleryTabBar } from "./GalleryTabBar";
import { ImagePickerSearch } from "./ImagePickerSearch";
import { SearchTagList } from "../Search/SearchTagList";

export const getSelectedIDs = memoizee((images: Array<YeetImageContainer>) => {
  return images.map(image => image.id);
});

class RawGallerySearchInputContainer extends React.Component {
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

  scrollY = new Animated.Value<number>(0);

  handleClose = () => this.search("");
  handlePressTag = tag => {
    this.search(tag);
  };

  handleSubmit = ({
    nativeEvent
  }: NativeSyntheticEvent<TextInputSubmitEditingEventData>) =>
    this.search(nativeEvent.text);

  search = query => {
    this.props.onSearch(query);
  };

  render() {
    return (
      <View style={styles.page}>
        <View style={styles.searchSpacer} />
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <Animated.View style={[styles.memeHeader, styles.searchHeader]}>
              <View style={styles.input}>
                <ImagePickerSearch
                  autoFocusSearch
                  openSearch={this.props.openSearch}
                  editable
                  isInputFocused
                  onChangeQuery={this.props.onChangeQuery}
                  onPressClose={this.props.onPressClose}
                  query={this.props.query}
                  onSubmit={this.handleSubmit}
                />
              </View>
            </Animated.View>

            <SearchTagList
              onPressTag={this.handlePressTag}
              onPressResult={this.props.onFinish}
              query={this.props.query}
            />
          </View>
        </View>
      </View>
    );
  }
}

export const GallerySearchInputContainer = props => {
  const { left, right } = React.useContext(SafeAreaContext);

  return (
    <RawGallerySearchInputContainer
      {...props}
      showStart={props.showStart || false}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
    />
  );
};

export default GallerySearchInputContainer;
