import memoizee from "memoizee";
import * as React from "react";
import {
  StyleSheet,
  View,
  LayoutAnimation,
  InteractionManager
} from "react-native";
import {
  FlatList,
  TouchableOpacity,
  BaseButton,
  BorderlessButton
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/core";
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
import { NavigationParams } from "react-navigation";
import { StackNavigationOptions } from "react-navigation-stack/lib/typescript/src/vendor/types";
import { GallerySearchList } from "../components/Gallery/GallerySearchList";

const TOP_HEADER = 48;

const MEME_HEADER_HEIGHT = TOP_HEADER + TOP_Y;

const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: COLORS.primaryDark,

    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden"
  },
  container: {
    // backgroundColor: COLORS.primaryDark
  },
  page: {
    flex: 1
  },
  hiddenContainer: {
    backgroundColor: COLORS.primaryDark,
    display: "none"
  },
  header: {
    flex: 0,
    paddingTop: TOP_Y,
    height: TOP_HEADER + TOP_Y,
    flexDirection: "row",
    position: "absolute",
    width: "100%",

    alignItems: "center",
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1
  },
  memeHeader: {
    height: MEME_HEADER_HEIGHT,
    backgroundColor: COLORS.primaryDark,
    width: "100%",
    position: "relative",
    zIndex: 10
  },
  searchHeader: {
    shadowRadius: 2,
    overflow: "visible",
    paddingTop: SPACING.half,
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowOpacity: 0.25,
    shadowColor: "black"
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
  searchSpacer: { height: LIST_HEADER_HEIGHT, width: 1, marginTop: TOP_Y },
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
  static navigationOptions = ({ navigation }: { navigation }) => ({
    headerMode: "none",
    header: () => null,
    cardStyle: {
      backgroundColor: "transparent"
    },
    gestureEnabled: true,
    gestureDirection: "vertical",
    cardTransparent: false
  });
  state = { photo: null, isSearching: false };
  controlsOpacityValue = new Animated.Value(0);

  constructor(props) {
    super(props);

    this.state = {
      blockId: props.blockId,
      isKeyboardVisible: false,
      selectedImages: [],
      query: "",
      isSearching: false,
      selectMultiple: false
    };
  }

  keyboardVisibleValue = new Animated.Value(0);
  handleKeyboardShow = () => this.setState({ isKeyboardVisible: true });
  handleChangeFocusInput = () => {
    this.handleOpenSearch();
  };
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

    const { onChange } = this.props;

    let photo = selectedImages[0];

    if (onChange) {
      onChange(this.state.blockId, photo, post);
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

  handleChangeQuery = query => {
    this.setState({ query });
    if (query.length === 0) {
    }
  };

  handleOpenSearch = () => {
    this.props.navigation.navigate("ImagePickerSearch", {
      onSearch: this.handleChangeQuery
    });
  };

  renderTabBar = props => (
    <Animated.View
      style={{
        position: "relative",
        zIndex: 9999,
        backgroundColor: COLORS.background,
        height: LIST_HEADER_HEIGHT + TOP_HEADER + TOP_Y,
        justifyContent: "flex-end",
        transform: [
          {
            translateY: this.scrollY.interpolate({
              inputRange: [0, TOP_Y],
              outputRange: [0, -TOP_Y],
              extrapolateRight: Animated.Extrapolate.CLAMP
            })
          }
        ]
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
    </Animated.View>
  );

  clearSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
    this.setState({ query: "" });
  };

  renderSearchHeader = isSearch => (
    <Animated.View
      style={
        isSearch ? [styles.memeHeader, styles.searchHeader] : styles.memeHeader
      }
    >
      <View style={styles.input}>
        <ImagePickerSearch
          autoFocusSearch={false}
          openSearch={this.handleChangeFocusInput}
          editable={false}
          onPressClose={this.clearSearch}
          query={this.state.query}
        />
      </View>

      {!isSearch && (
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
      )}
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

  get showSearchResults() {
    return this.state.query.length > 0;
  }

  scrollY = new Animated.Value<number>(0);

  render() {
    return (
      <View style={styles.page}>
        {this.showSearchResults && <View style={styles.searchSpacer} />}
        <View key="container" style={styles.container}>
          {!this.showSearchResults && (
            <GalleryTabView
              width={this.props.width}
              isKeyboardVisible={this.state.isKeyboardVisible}
              height={this.props.height - TOP_Y - LIST_HEADER_HEIGHT}
              keyboardVisibleValue={this.keyboardVisibleValue}
              onPress={this.handlePickPhoto}
              show
              isModal={false}
              isFocused={this.props.isFocused && !this.showSearchResults}
              position={this.position}
              renderTabBar={this.renderTabBar}
              selectedIDs={getSelectedIDs(this.state.selectedImages)}
              headerHeight={this.headerHeight}
              renderHeader={this.renderHeader}
              tabBarPosition="top"
              tabs={DEFAULT_TABS}
              scrollY={this.scrollY}
              initialRoute={this.props.initialRoute || "all"}
            />
          )}

          {this.showSearchResults && (
            <View style={styles.searchContainer}>
              {this.renderSearchHeader(true)}
              <GallerySearchList
                query={this.state.query}
                isFocused={this.props.isFocused && this.showSearchResults}
                isModal={false}
                onPress={this.handlePickPhoto}
                scrollY={this.scrollY}
                height={this.props.height - TOP_Y - LIST_HEADER_HEIGHT}
              />
            </View>
          )}
        </View>

        {this.props.isFinishedAnimating && !this.showSearchResults && (
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
              <BorderlessButton>
                <View style={styles.headerTextButon}>
                  <MediumText style={styles.headerButtonLabel}>Skip</MediumText>
                  <IconChevronRight size={12} color={COLORS.mutedLabel} />
                </View>
              </BorderlessButton>
            </View>
          </Animated.View>
        )}
      </View>
    );
  }
}

export const ImagePickerPage = props => {
  const navigation = useNavigation();
  const { top, left, right } = React.useContext(SafeAreaContext);
  const isFocused = useIsFocused();
  const route = useRoute();
  const { onChange, initialRoute, blockId } = route.params ?? {};
  const [isFinishedAnimating, setFinishedAnimating] = React.useState(
    !isFocused
  );

  React.useLayoutEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setFinishedAnimating(true);
    });

    return () => task.cancel();
  }, [setFinishedAnimating]);

  return (
    <RawImagePickerPage
      {...props}
      navigation={navigation}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
      isFocused={isFocused}
      isFinishedAnimating={isFinishedAnimating}
      onChange={onChange}
      initialRoute={initialRoute}
      blockId={blockId}
    />
  );
};

ImagePickerPage.navigationOptions = RawImagePickerPage.navigationOptions;

export default ImagePickerPage;
