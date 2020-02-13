import _ViewPager, {
  ViewPagerOnPageSelectedEventData,
  ViewPagerProps
} from "@react-native-community/viewpager";
import * as React from "react";
import { findNodeHandle, StyleSheet, View } from "react-native";
import {
  createNativeWrapper,
  FlatList,
  NativeViewGestureHandlerProperties
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import { COLORS } from "../../lib/styles";
import { GallerySectionItem } from "../NewPost/ImagePicker/GallerySectionItem";
import { AssetsFilterList } from "./FilterList/AssetFilterList";
import { CameraRollFilterList } from "./FilterList/CameraRollFilterList";
import { GIFsFilterList } from "./FilterList/GIFsFilterList";
import { MemesFilterList } from "./FilterList/MemesFilterList";
import { RecentFilterList } from "./FilterList/RecentFilterList";
import { StickerFilterList } from "./FilterList/StickerFilterList";
import { GallerySectionList } from "./GallerySectionList";
import { PanSheetContext } from "./PanSheetView";
import { NativeScreen } from "react-native-screens";

const ViewPager = createNativeWrapper(_ViewPager, {
  disallowInterruption: false
}) as React.ComponentType<ViewPagerProps & NativeViewGestureHandlerProperties>;

const styles = StyleSheet.create({
  sceneContainer: {
    overflow: "visible",
    flex: 0,
    flexGrow: 0,
    width: "100%"
  },
  modalSceneContainer: {
    overflow: "visible",
    flex: -1,
    flexGrow: 0,
    backgroundColor: COLORS.primaryDark,
    width: "100%"
  },
  container: {
    flex: 0,
    width: "100%",

    overflow: "visible"
  }
});

export const DEFAULT_TABS = [
  GallerySectionItem.memes,
  GallerySectionItem.cameraRoll,
  GallerySectionItem.gifs
];
export const ROUTE_LIST = DEFAULT_TABS;

type Props = {
  initialRoute: GallerySectionItem;
  routes: Array<GallerySectionItem>;
  tabBarPosition: "top" | "bottom";
  inset: number;
  headerHeight: Function;
  width: number;
  height: number;
  bottomInset: number;
  offset: number;
  query: string;
  renderHeader: Function;
  scrollY: Animated.Value<number>;
  position: Animated.Value<number>;
};

class GalleryTabViewComponent extends React.Component<Props, { page: number }> {
  constructor(props) {
    super(props);

    this.state = {
      page: Math.max(props.routes.indexOf(props.initialRoute), 0)
    };
    this.loadedScreens = new Set([this.currentRoute]);

    this.position = this.props.position;
  }

  loadedScreens: Set<GallerySectionItem>;

  static defaultProps = {
    initialRoute: "all",
    routes: ROUTE_LIST,
    tabBarPosition: "top",
    inset: 0,
    headerHeight: 0,
    width: SCREEN_DIMENSIONS.width,
    height: 0,
    bottomInset: 0,
    offset: 0
  };

  onPageScrollEvent = Animated.event(
    [
      {
        nativeEvent: {
          position: this.props.position
        }
      }
    ],
    { useNativeDriver: true }
  );

  viewPagerRef = React.createRef();

  componentDidMount() {
    const { viewPagerRef } = this;

    if (viewPagerRef.current) {
      this.onPageScrollEvent.attachEvent(
        findNodeHandle(this.viewPagerRef.current),
        "onPageScroll"
      );
    }

    this.props.setActiveScrollView(this.activeListRef);
  }

  componentWillUnmount() {
    const { viewPagerRef } = this;

    if (viewPagerRef.current) {
      this.onPageScrollEvent.detachEvent(
        findNodeHandle(this.viewPagerRef.current),
        "onPageScroll"
      );
    }

    this.props.setActiveScrollView(null);
  }

  cameraRollListRef = React.createRef<FlatList>();
  gifsListRef = React.createRef<FlatList>();
  memesListRef = React.createRef<FlatList>();
  assetsListRef = React.createRef<FlatList>();
  stickerListRef = React.createRef<FlatList>();
  searchListRef = React.createRef<FlatList>();

  routesToRef = {
    [GallerySectionItem.cameraRoll]: this.cameraRollListRef,
    [GallerySectionItem.gifs]: this.gifsListRef,
    [GallerySectionItem.memes]: this.memesListRef,
    [GallerySectionItem.assets]: this.assetsListRef,
    [GallerySectionItem.sticker]: this.stickerListRef,
    [GallerySectionItem.search]: this.searchListRef
  };

  get currentRoute() {
    return this.props.routes[this.state.page];
  }

  simultaneousHandlers = this.viewPagerRef;
  get viewPagerSimultaneousHandlers() {
    return [
      this.cameraRollListRef,
      this.gifsListRef,
      this.memesListRef,
      this.assetsListRef,
      this.stickerListRef,
      this.searchListRef,
      ...this.props.simultaneousHandlers
    ];
  }

  waitFor = this.props.waitFor;

  get activeListRef() {
    return this.routesToRef[this.currentRoute].current;
  }

  renderScene = route => {
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
    const currentRoute = this.currentRoute;

    switch (route) {
      case GallerySectionItem.all:
        return (
          <GallerySectionList
            isFocused={isFocused && currentRoute === GallerySectionItem.all}
            flatListRef={this.allListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            waitFor={this.waitFor}
            onPress={onPress}
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
            waitFor={this.waitFor}
            onPress={onPress}
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
            waitFor={this.waitFor}
            onPress={onPress}
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
            waitFor={this.waitFor}
            onPress={onPress}
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
            waitFor={this.waitFor}
            onPress={onPress}
            query={query}
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
            waitFor={this.waitFor}
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
            waitFor={this.waitFor}
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
    this.props.renderTabBar({
      ...props,
      route: this.currentRoute,
      tabViewRef: this.currentRef
    });

  position: Animated.Value<number>;
  initialLayout: { width: number; height: number };

  onIndexChange = index => {
    this.loadedScreens.add(this.props.routes[index]);
    this.setState({ page: index });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.page !== this.state.page) {
      this.props.setActiveScrollView(this.activeListRef);
    }
  }

  onPageSelected = ({
    nativeEvent
  }: {
    nativeEvent: ViewPagerOnPageSelectedEventData;
  }) => {
    this.onIndexChange(nativeEvent.position);
  };

  tabViewRef = React.createRef();

  get currentRef() {
    return this.routesToRef[this.currentRoute];
  }

  renderSceneContainer = route => {
    return (
      <NativeScreen
        active={this.currentRoute === route}
        key={route}
        style={[
          styles.sceneContainer,
          {
            height: this.props.height,
            width: this.props.width,
            backgroundColor: COLORS.primaryDark
          }
        ]}
      >
        {this.loadedScreens.has(route) && this.renderScene(route)}
      </NativeScreen>
    );
  };

  render() {
    const { width, height, tabBarPosition, routes } = this.props;

    return (
      <>
        {this.renderTabBar(this.state)}
        <ViewPager
          transitionStyle="scroll"
          style={[styles.container, { height }]}
          orientation="horizontal"
          onPageSelected={this.onPageSelected}
          ref={this.viewPagerRef}
          scrollEnabled
          pageMargin={0}
          keyboardDismissMode="none"
          simultaneousRecognizers={this.viewPagerSimultaneousHandlers}
          showPageIndicator={false}
        >
          {routes.map(this.renderSceneContainer)}
        </ViewPager>
      </>
    );
  }
}

export const GalleryTabView = React.memo(props => {
  const { setActiveScrollView } = React.useContext(PanSheetContext);
  return (
    <GalleryTabViewComponent
      {...props}
      setActiveScrollView={setActiveScrollView}
    />
  );
});

GalleryTabView.defaultProps = GalleryTabViewComponent.defaultProps;

export default GalleryTabView;
