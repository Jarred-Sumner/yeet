import memoizee from "memoizee";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  FlatList,
  TouchableOpacity,
  BaseButton,
  BorderlessButton
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useNavigation, useFocusState } from "react-navigation-hooks";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../config";
import {
  GalleryTabView,
  DEFAULT_TABS
} from "../components/Gallery/GalleryTabView";

import { YeetImageContainer } from "../lib/imageSearch";
import { sendLightFeedback } from "../lib/Vibration";
import { LIST_HEADER_HEIGHT } from "../components/NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import { SPACING, COLORS } from "../lib/styles";
import { isArray } from "lodash";
import { AnimatedKeyboardTracker } from "../components/AnimatedKeyboardTracker";
import Storage from "../lib/Storage";
import { cloneDeep } from "lodash";
import { GalleryHeader } from "../components/Gallery/GalleryHeader";
import { ImagePickerSearch } from "../components/Gallery/ImagePickerSearch";
import { GallerySectionItem } from "../components/NewPost/ImagePicker/GallerySectionItem";
import { BackButton, BackButtonBehavior } from "../components/Button";
import { MediumText, Text } from "../components/Text";
import { IconChevronRight, IconChevronDown } from "../components/Icon";

const TOP_HEADER = 48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flex: 0,
    paddingTop: TOP_Y,
    height: TOP_HEADER + TOP_Y,
    flexDirection: "row",
    position: "relative",
    zIndex: 999,
    top: 0,
    left: 0,
    right: 0,

    alignItems: "center",
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1
  },
  memeHeader: {
    height: LIST_HEADER_HEIGHT + TOP_HEADER,
    backgroundColor: COLORS.primaryDark,
    width: "100%"
  },

  input: {
    paddingVertical: SPACING.normal,
    flex: 1,
    alignItems: "center",
    flexDirection: "row"
  },
  headerSide: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  headerTitle: {
    fontSize: 16,
    color: COLORS.mutedLabel,
    textAlign: "center",
    marginLeft: -24
  },
  headerRight: {
    justifyContent: "flex-end"
  },
  headerLeft: {
    justifyContent: "flex-start",
    paddingHorizontal: SPACING.normal,
    width: 48
  },
  headerCenter: {
    justifyContent: "center"
  },
  headerTextButon: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal
  },
  headerButtonLabel: {
    color: COLORS.mutedLabel,
    marginRight: SPACING.half
  },
  sectionFilterButton: {
    flexDirection: "row",
    justifyContent: "center",
    flex: 1
  },
  sectionFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionFilterLabel: {
    fontSize: 17,
    marginRight: SPACING.half
  },
  footer: {
    height: LIST_HEADER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
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
  state = { photo: null, isSearching: false };
  controlsOpacityValue = new Animated.Value(0);

  constructor(props) {
    super(props);

    this.state = {
      blockId: props.navigation.getParam("blockId"),
      isKeyboardVisible: false,
      selectedImages: [],
      isSearching: false,
      selectMultiple: false
    };
  }

  keyboardVisibleValue = new Animated.Value(0);
  handleKeyboardShow = () => this.setState({ isKeyboardVisible: true });
  handleChangeFocusInput = isSearching => this.setState({ isSearching });
  handleKeyboardHide = () => this.setState({ isKeyboardVisible: false });
  position = new Animated.Value(0);

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

  handleOpenSearch = () => {
    this.props.navigation.navigate("ImagePickerSearch");
  };

  renderTabBar = props => (
    <View
      style={{
        position: "relative",
        zIndex: 998,
        height: LIST_HEADER_HEIGHT + TOP_HEADER + TOP_Y,
        backgroundColor: COLORS.background,
        justifyContent: "flex-end",
        marginTop: (LIST_HEADER_HEIGHT + TOP_Y) * -1
      }}
    >
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
        query={this.state.query}
        onChangeQuery={this.handleChangeQuery}
      ></GalleryHeader>
    </View>
  );

  renderHeader = props => {
    if (props.listKey === GallerySectionItem.memes) {
      return (
        <Animated.View
          style={[
            styles.memeHeader,
            {
              height: LIST_HEADER_HEIGHT
            }
          ]}
        >
          <View style={styles.input}>
            <ImagePickerSearch
              autoFocusSearch={false}
              onChangeInputFocus={this.handleChangeFocusInput}
              editable={false}
            />
          </View>

          <View style={styles.footer}>
            <BorderlessButton style={styles.sectionFilterButton}>
              <Animated.View style={styles.sectionFilter}>
                <MediumText style={styles.sectionFilterLabel}>
                  Trending
                </MediumText>
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
    } else {
      return null;
    }
  };
  headerHeight = props => {
    if (props.listKey === GallerySectionItem.memes) {
      return LIST_HEADER_HEIGHT;
    } else {
      return 0;
    }
  };

  scrollY = new Animated.Value<number>(0);

  render() {
    return (
      <View>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: this.scrollY.interpolate({
                inputRange: [0, TOP_Y],
                outputRange: [1, 0],
                extrapolate: Animated.Extrapolate.CLAMP
              }),
              transform: [
                {
                  translateY: this.scrollY.interpolate({
                    inputRange: [0, TOP_Y],
                    outputRange: [0, -TOP_Y],
                    extrapolate: Animated.Extrapolate.CLAMP
                  })
                }
              ]
            }
          ]}
        >
          <View style={[styles.headerSide, styles.headerLeft]}>
            <BackButton
              behavior={BackButtonBehavior.close}
              size={17}
              color={COLORS.mutedLabel}
            />
          </View>

          <View style={[styles.headerSide, styles.headerCenter]}>
            <Text style={styles.headerTitle}>Start from</Text>
          </View>

          <View style={[styles.headerSide, styles.headerRight]}>
            <BorderlessButton onPress={this.handleSkip}>
              <View style={styles.headerTextButon}>
                <MediumText style={styles.headerButtonLabel}>Skip</MediumText>
                <IconChevronRight size={12} color={COLORS.mutedLabel} />
              </View>
            </BorderlessButton>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: this.scrollY.interpolate({
                    inputRange: [0, TOP_Y],
                    outputRange: [0, -TOP_Y],
                    extrapolateRight: Animated.Extrapolate.CLAMP
                  })
                }
              ]
            }
          ]}
        >
          <GalleryTabView
            width={this.props.width}
            isKeyboardVisible={this.state.isKeyboardVisible}
            height={this.props.height}
            keyboardVisibleValue={this.keyboardVisibleValue}
            onPress={this.handlePickPhoto}
            show
            isModal={false}
            isFocused={this.props.isFocused}
            position={this.position}
            renderTabBar={this.renderTabBar}
            selectedIDs={getSelectedIDs(this.state.selectedImages)}
            headerHeight={this.headerHeight}
            renderHeader={this.renderHeader}
            tabBarPosition="top"
            tabs={DEFAULT_TABS}
            scrollY={this.scrollY}
            initialRoute={
              this.props.navigation.getParam("initialRoute") || "all"
            }
          />
        </Animated.View>
      </View>
    );
  }
}

export const ImagePickerPage = props => {
  const navigation = useNavigation();
  const { top, left, right } = React.useContext(SafeAreaContext);
  const { isFocused } = useFocusState();

  return (
    <RawImagePickerPage
      {...props}
      navigation={navigation}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
      isFocused={isFocused}
    />
  );
};

export default ImagePickerPage;
