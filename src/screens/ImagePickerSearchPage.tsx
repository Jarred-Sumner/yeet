import { cloneDeep, isArray } from "lodash";
import memoizee from "memoizee";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useFocusState, useNavigation } from "react-navigation-hooks";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../config";
import { GalleryHeader } from "../components/Gallery/GalleryHeader";
import { GallerySectionList } from "../components/Gallery/GallerySectionList";
import { DEFAULT_TABS } from "../components/Gallery/GalleryTabView";
import { ImagePickerSearch } from "../components/Gallery/ImagePickerSearch";
import { FilterBarRow } from "../components/NewPost/ImagePicker/FilterBarRow";
import {
  GallerySectionItem,
  ICONS
} from "../components/NewPost/ImagePicker/GallerySectionItem";
import { YeetImageContainer } from "../lib/imageSearch";
import Storage from "../lib/Storage";
import { sendLightFeedback } from "../lib/Vibration";
import { SearchTagList } from "../components/Search/SearchTagList";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  header: {
    paddingTop: TOP_Y,
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
    backgroundColor: "black",
    shadowColor: "#333",
    shadowOpacity: 0.25,
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowRadius: 1,
    overflow: "visible"
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: "center",
    flex: 1
  },
  listContainer: {
    marginTop: 50 + TOP_Y
  }
});

export const getSelectedIDs = memoizee((images: Array<YeetImageContainer>) => {
  return images.map(image => image.id);
});

class RawImagePickerSearchPage extends React.Component {
  state = { photo: null, isSearching: false };
  controlsOpacityValue = new Animated.Value(0);

  constructor(props) {
    super(props);

    this.state = {
      blockId: props.navigation.getParam("blockId"),
      isKeyboardVisible: false,
      selectedImages: [],
      query: "",
      isSearching: false,
      selectMultiple: false
    };
  }

  keyboardVisibleValue = new Animated.Value(0);
  handleKeyboardShow = () => this.setState({ isKeyboardVisible: true });
  handleChangeFocusInput = isSearching => this.setState({ isSearching });
  handleKeyboardHide = () => this.setState({ isKeyboardVisible: false });
  position = new Animated.Value(0);
  handleChangeQuery = query => {
    this.setState({ query });
  };

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

    const onChange = this.props.navigation.getParam("onChange");

    let photo = selectedImages[0];

    if (onChange) {
      onChange(this.props.navigation.getParam("blockId"), photo, post);
      this.goBack(true);
    } else {
      this.props.navigation.navigate("NewPost", {
        image: cloneDeep(photo),
        blockId: this.state.blockId,
        post: cloneDeep(post)
      });
    }

    let __photo = photo;
    let _post = cloneDeep(post);
    window.requestIdleCallback(() => {
      Storage.insertRecentlyUsed(__photo, _post).catch(console.error);
      __photo = null;
      _post = null;
    });
  };

  pressBack = () => this.goBack(false);
  animatedYOffset = new Animated.Value(0);

  goBack = (isDone: boolean = false) => {
    this.controlsOpacityValue.setValue(0);
    if (!isDone) {
      this.flatListRef && this.flatListRef.scrollToIndex(0);
    }
    this.props.navigation.pop();
  };
  flatListRef: FlatList | null = null;
  updateFlatListRef = flatListRef => {
    this.flatListRef = flatListRef;

    this.scrollRef = flatListRef?.getScrollableNode();
  };

  renderHeader = props => {
    if (props.listKey === GallerySectionItem.cameraRoll) {
      return null;
    }

    return (
      <ImagePickerSearch
        onChangeInputFocus={this.handleChangeFocusInput}
        isInputFocused={this.state.isSearching}
        editable
        onPressClose={this.handleClose}
        placeholder={
          {
            [GallerySectionItem.all]: "Search the internet",
            [GallerySectionItem.memes]: "Search yeet",
            [GallerySectionItem.gifs]: "Search Giphy"
          }[props.listKey] || "Search"
        }
        autoFocusSearch
      />
    );
  };
  renderTabBar = props => (
    <GalleryHeader
      navigationState={props.navigationState}
      filter={props.navigationState.routes[0].key}
      tabs={DEFAULT_TABS}
      scrollY={this.scrollY}
      showHeader
      onChangeInputFocus={this.handleChangeFocusInput}
      isInputFocused={this.state.isSearching}
      tabBarPosition="top"
      keyboardVisibleValue={this.keyboardVisibleValue}
      position={this.position}
    />
  );

  headerHeight = props => {
    if (props.listKey === GallerySectionItem.cameraRoll) {
      return 0;
    } else {
      return 65;
    }
  };

  scrollY = new Animated.Value<number>(0);
  handlePressTag = tag => {};

  render() {
    const tabs = [
      GallerySectionItem.all,
      GallerySectionItem.internet,
      GallerySectionItem.memes,
      GallerySectionItem.gifs
    ];

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ImagePickerSearch
            autoFocusSearch
            onChangeQuery={this.handleChangeQuery}
            isInputFocused
          />
        </View>

        <SearchTagList
          query={this.state.query}
          onPressTag={this.handlePressTag}
        />
      </View>
    );
  }
}

export const ImagePickerSearchPage = props => {
  const navigation = useNavigation();
  const { top, left, right } = React.useContext(SafeAreaContext);
  const { isFocused } = useFocusState();

  return (
    <RawImagePickerSearchPage
      {...props}
      navigation={navigation}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
      isFocused={isFocused}
    />
  );
};

export default ImagePickerSearchPage;
