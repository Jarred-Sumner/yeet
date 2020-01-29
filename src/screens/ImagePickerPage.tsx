import memoizee from "memoizee";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useNavigation, useFocusState } from "react-navigation-hooks";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../config";
import { GalleryTabView } from "../components/Gallery/GalleryTabView";

import { YeetImageContainer } from "../lib/imageSearch";
import { sendLightFeedback } from "../lib/Vibration";
import { LIST_HEADER_HEIGHT } from "../components/NewPost/ImagePicker/FilterBar";
import { SPACING } from "../lib/styles";
import { isArray } from "lodash";
import { AnimatedKeyboardTracker } from "../components/AnimatedKeyboardTracker";
import Storage from "../lib/Storage";
import { cloneDeep } from "lodash";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  }
});

export const getSelectedIDs = memoizee((images: Array<YeetImageContainer>) => {
  return images.map(image => image.id);
});

class RawImagePickerPage extends React.Component {
  static sharedElements = (navigation, otherNavigation, showing) => {
    // Transition element `item.${item.id}.photo` when either
    // showing or hiding this screen (coming from any route)
    const blockId = navigation.getParam("blockId");
    const shouldAnimate = navigation.getParam("shouldAnimate") || true;

    if (!shouldAnimate) {
      return [];
    }

    const id = `block.imagePicker.${blockId}`;

    return [
      {
        id,
        animation: showing ? "move" : "fade-out",
        resize: showing ? "stretch" : "clip",
        align: showing ? "bottom-left" : "top-left"
      }
    ];
  };
  static navigationOptions = ({ navigation }) => ({
    header: null,
    gestureEnabled: true,
    gestureDirection: "vertical",
    cardTransparent: false
  });
  state = { photo: null };
  controlsOpacityValue = new Animated.Value(0);

  constructor(props) {
    super(props);

    this.state = {
      blockId: props.navigation.getParam("blockId"),
      isKeyboardVisible: false,
      selectedImages: [],
      selectMultiple: false
    };
  }

  keyboardVisibleValue = new Animated.Value(0);
  handleKeyboardShow = () => this.setState({ isKeyboardVisible: true });
  handleKeyboardHide = () => this.setState({ isKeyboardVisible: false });

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
      console.log(photo);
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

  scrollY = new Animated.Value<number>(0);

  render() {
    return (
      <View style={styles.container}>
        <AnimatedKeyboardTracker
          keyboardVisibleValue={this.keyboardVisibleValue}
          // keyboardHeightValue={this.keyboardHeightValue}
        />

        <GalleryTabView
          width={this.props.width}
          isKeyboardVisible={this.state.isKeyboardVisible}
          height={this.props.height}
          keyboardVisibleValue={this.keyboardVisibleValue}
          onPress={this.handlePickPhoto}
          show
          inset={LIST_HEADER_HEIGHT + SPACING.normal}
          isModal={false}
          offset={(LIST_HEADER_HEIGHT + SPACING.normal) * -1}
          selectedIDs={getSelectedIDs(this.state.selectedImages)}
          tabBarPosition="top"
          showHeader
          scrollY={this.scrollY}
          initialRoute={this.props.navigation.getParam("initialRoute") || "all"}
        />
      </View>
    );
  }
}

export const ImagePickerPage = props => {
  const navigation = useNavigation();
  const { top, left, right } = React.useContext(SafeAreaContext);

  return (
    <RawImagePickerPage
      navigation={navigation}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
      {...props}
    />
  );
};

export default ImagePickerPage;
