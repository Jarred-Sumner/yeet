import { cloneDeep } from "lodash";
import * as React from "react";
import { StyleSheet } from "react-native";
import { FlatList, PanGestureHandler } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { TabView } from "react-native-tab-view";
import { SCREEN_DIMENSIONS } from "../../../config";
import { COLORS } from "../../lib/styles";
import {
  FILTERS,
  GallerySectionItem
} from "../NewPost/ImagePicker/GallerySectionItem";
import { AssetsFilterList } from "./FilterList/AssetFilterList";
import { CameraRollFilterList } from "./FilterList/CameraRollFilterList";
import { GIFsFilterList } from "./FilterList/GIFsFilterList";
import { MemesFilterList } from "./FilterList/MemesFilterList";
import { RecentFilterList } from "./FilterList/RecentFilterList";
import { StickerFilterList } from "./FilterList/StickerFilterList";
import { GallerySectionList } from "./GallerySectionList";

const styles = StyleSheet.create({
  sceneContainer: {
    overflow: "visible",
    flex: -1,
    flexGrow: 0,
    // backgroundColor: COLORS.primaryDark,
    width: "100%"
  },
  modalSceneContainer: {
    overflow: "visible",
    flex: -1,
    flexGrow: 0,
    // backgroundColor: COLORS.primaryDark,
    width: "100%"
  },
  container: {
    flex: -1,
    width: "100%",

    overflow: "visible"
  }
});

export const DEFAULT_TABS = [
  GallerySectionItem.memes,
  GallerySectionItem.cameraRoll,
  GallerySectionItem.gifs
];
export const ROUTE_LIST = FILTERS.filter(({ value }) =>
  DEFAULT_TABS.includes(value)
).map(filter => {
  return {
    key: filter.value || "all",
    title: filter.label
  };
});

class GalleryTabViewComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      navigationState: props.navigationState || {
        index: Math.max(
          props.routes.findIndex(({ key }) => key === props.initialRoute),
          0
        ),
        routes: cloneDeep(props.routes).sort((route, b) =>
          props.tabs.indexOf(route.key) > props.tabs.indexOf(b.key) ? 1 : -1
        )
      }
    };

    this.position = this.props.position;
    this.initialLayout = {
      width: this.props.width,
      height: this.props.height
    };
    this.sceneContainerStyle = [
      this.props.isModal ? styles.modalSceneContainer : styles.sceneContainer,
      {
        height: this.initialLayout.height
      }
    ];

    this.containerStyle = [
      styles.container,
      { height: this.initialLayout.height }
    ];
  }

  static defaultProps = {
    initialRoute: "all",
    routes: ROUTE_LIST,
    tabBarPosition: "top",
    inset: 0,
    headerHeight: 0,
    width: SCREEN_DIMENSIONS.width,
    height: 0,
    bottomInset: 0,
    offset: 0,
    icons: false,
    light: false
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.props.show !== prevProps.show && this.props.show) {
      const newNavigationState = {
        index: Math.max(
          this.navigationState.routes.findIndex(
            ({ key }) => key === this.props.initialRoute
          ),
          0
        ),
        routes: this.navigationState.routes
      };

      if (this.props.onChangeNavigationState) {
        this.props.onChangeNavigationState(newNavigationState);
      } else {
        this.setState({ navigationState: newNavigationState });
      }
    }

    if (prevProps.height !== this.props.height) {
      this.forceUpdate();
    }
  }

  panRef = React.createRef<PanGestureHandler>();

  cameraRollListRef = React.createRef<FlatList>();
  gifsListRef = React.createRef<FlatList>();
  memesListRef = React.createRef<FlatList>();
  assetsListRef = React.createRef<FlatList>();
  stickerListRef = React.createRef<FlatList>();
  searchListRef = React.createRef<FlatList>();

  simultaneousHandlers = this.panRef;

  renderScene = ({ route, jumpTo, position }) => {
    const {
      width,
      height,
      isKeyboardVisible,
      onPress,
      keyboardVisibleValue,
      selectedIDs,
      isFocused,
      renderHeader,
      headerHeight,
      query,
      ...otherProps
    } = this.props;
    const { navigationState } = this;
    const currentRoute = navigationState.routes[navigationState.index].key;

    switch (route.key) {
      case GallerySectionItem.all:
        return (
          <GallerySectionList
            isFocused={isFocused && currentRoute === GallerySectionItem.all}
            flatListRef={this.allListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onPress={onPress}
            onChangeFilter={jumpTo}
            renderHeader={renderHeader}
            headerHeight={headerHeight}
            insetValue={this.props.insetValue}
            height={height}
            offset={this.props.offset}
            query={query}
            bottomInset={this.props.bottomInset}
            selectedIDs={selectedIDs}
            isModal={this.props.isModal}
            inset={this.props.inset}
            scrollY={this.props.scrollY}
            keyboardVisibleValue={keyboardVisibleValue}
          />
        );

      case GallerySectionItem.assets:
        return (
          <AssetsFilterList
            isFocused={isFocused && currentRoute === GallerySectionItem.assets}
            flatListRef={this.assetsListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onPress={onPress}
            onChangeFilter={jumpTo}
            renderHeader={renderHeader}
            headerHeight={headerHeight}
            insetValue={this.props.insetValue}
            height={height}
            offset={this.props.offset}
            query={query}
            bottomInset={this.props.bottomInset}
            selectedIDs={selectedIDs}
            isModal={this.props.isModal}
            inset={this.props.inset}
            scrollY={this.props.scrollY}
            keyboardVisibleValue={keyboardVisibleValue}
          />
        );

      case GallerySectionItem.recent:
        return (
          <RecentFilterList
            isFocused={isFocused && currentRoute === GallerySectionItem.recent}
            flatListRef={this.assetsListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onPress={onPress}
            onChangeFilter={jumpTo}
            insetValue={this.props.insetValue}
            height={height}
            renderHeader={renderHeader}
            headerHeight={headerHeight}
            offset={this.props.offset}
            query={query}
            bottomInset={this.props.bottomInset}
            selectedIDs={selectedIDs}
            isModal={this.props.isModal}
            inset={this.props.inset}
            scrollY={this.props.scrollY}
            keyboardVisibleValue={keyboardVisibleValue}
          />
        );

      case GallerySectionItem.sticker:
        return (
          <StickerFilterList
            isFocused={isFocused && currentRoute === GallerySectionItem.sticker}
            flatListRef={this.stickerListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onPress={onPress}
            onChangeFilter={jumpTo}
            insetValue={this.props.insetValue}
            query={query}
            height={height}
            renderHeader={renderHeader}
            headerHeight={headerHeight}
            offset={this.props.offset}
            bottomInset={this.props.bottomInset}
            selectedIDs={selectedIDs}
            isModal={this.props.isModal}
            inset={this.props.inset}
            scrollY={this.props.scrollY}
            keyboardVisibleValue={keyboardVisibleValue}
          />
        );

      case GallerySectionItem.memes:
        return (
          <MemesFilterList
            isFocused={isFocused && currentRoute === GallerySectionItem.memes}
            flatListRef={this.memesListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onPress={onPress}
            query={query}
            onChangeFilter={jumpTo}
            renderHeader={renderHeader}
            headerHeight={headerHeight}
            insetValue={this.props.insetValue}
            height={height}
            offset={this.props.offset}
            bottomInset={this.props.bottomInset}
            selectedIDs={selectedIDs}
            isModal={this.props.isModal}
            inset={this.props.inset}
            scrollY={this.props.scrollY}
            keyboardVisibleValue={keyboardVisibleValue}
          />
        );

      case GallerySectionItem.cameraRoll:
        return (
          <CameraRollFilterList
            isFocused={
              isFocused && currentRoute === GallerySectionItem.cameraRoll
            }
            flatListRef={this.cameraRollListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onChangeFilter={jumpTo}
            height={height}
            onPress={onPress}
            renderHeader={renderHeader}
            headerHeight={headerHeight}
            selectedIDs={selectedIDs}
            query={query}
            bottomInset={this.props.bottomInset}
            keyboardVisibleValue={keyboardVisibleValue}
            insetValue={this.props.insetValue}
            offset={this.props.offset}
            isModal={this.props.isModal}
            inset={this.props.inset}
            scrollY={this.props.scrollY}
          />
        );
      case GallerySectionItem.gifs:
        return (
          <GIFsFilterList
            isFocused={isFocused && currentRoute === GallerySectionItem.gifs}
            flatListRef={this.gifsListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onChangeFilter={jumpTo}
            query={query}
            onPress={onPress}
            renderHeader={renderHeader}
            headerHeight={headerHeight}
            bottomInset={this.props.bottomInset}
            selectedIDs={selectedIDs}
            isModal={this.props.isModal}
            height={height}
            insetValue={this.props.insetValue}
            offset={this.props.offset}
            keyboardVisibleValue={keyboardVisibleValue}
            inset={this.props.inset}
            scrollY={this.props.scrollY}
          />
        );

      default: {
        throw Error(`Invalid route: ${route}`);
        return null;
      }
    }
  };

  renderTabBar = props =>
    this.props.renderTabBar({ ...props, tabViewRef: this.currentRef });

  position: Animated.Value<number>;
  initialLayout: { width: number; height: number };

  onIndexChange = index => {
    const newNavigationState = { ...this.navigationState, index };

    if (this.props.onChangeNavigationState) {
      this.props.onChangeNavigationState(newNavigationState);
    } else {
      this.setState({ navigationState: newNavigationState });
    }
  };

  tabViewRef = React.createRef();

  get currentRef() {
    return {
      [GallerySectionItem.cameraRoll]: this.cameraRollListRef,
      [GallerySectionItem.gifs]: this.gifsListRef,
      [GallerySectionItem.memes]: this.memesListRef,
      [GallerySectionItem.assets]: this.assetsListRef,
      [GallerySectionItem.sticker]: this.stickerListRef,
      [GallerySectionItem.all]: this.searchListRef
    }[this.navigationState.routes[this.navigationState.index].key];
  }

  get navigationState() {
    return this.props.navigationState || this.state.navigationState;
  }

  render() {
    const { width, height, tabBarPosition } = this.props;

    return (
      <TabView
        navigationState={this.navigationState}
        renderScene={this.renderScene}
        tabBarPosition={"top"}
        removeClippedSubviews={false}
        swipeEnabled
        lazy
        swipeVelocityImpact={0.25}
        ref={this.tabViewRef}
        gestureHandlerProps={{
          ref: this.panRef,
          simultaneousHandlers: [
            this.gifsListRef,
            this.memesListRef,
            this.cameraRollListRef,
            this.assetsListRef
          ]
        }}
        sceneContainerStyle={this.sceneContainerStyle}
        style={this.containerStyle}
        renderTabBar={this.props.renderTabBar ? this.renderTabBar : () => null}
        onIndexChange={this.onIndexChange}
        initialLayout={this.initialLayout}
        position={this.props.position}
        // keyboardDismissMode="none"
      />
    );
  }
}

export const GalleryTabView = React.memo(GalleryTabViewComponent);

GalleryTabView.defaultProps = GalleryTabViewComponent.defaultProps;

export default GalleryTabView;
