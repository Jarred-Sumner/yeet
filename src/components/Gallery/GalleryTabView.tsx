import * as React from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { TabView, SceneMap } from "react-native-tab-view";
import { MediaPlayerPauser } from "../MediaPlayer";
import {
  GallerySectionItem,
  FILTERS,
  LIST_HEADER_HEIGHT
} from "../NewPost/ImagePicker/FilterBar";
import {
  GIFsFilterList,
  CameraRollFilterList,
  SearchFilterList,
  MemesFilterList
} from "./GalleryFilterList";
import { GallerySectionList } from "./GallerySectionList";
import { GalleryHeader } from "./GalleryHeader";
import Animated from "react-native-reanimated";
import { PanGestureHandler, FlatList } from "react-native-gesture-handler";

const styles = StyleSheet.create({
  sceneContainer: {
    overflow: "visible",
    flex: 1
  },
  container: {
    flex: 1
  }
});

const ROUTE_LIST = FILTERS.map(filter => {
  return {
    key: filter.value || "all",
    title: filter.label
  };
});

class GalleryTabViewComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      navigationState: {
        index: Math.max(
          ROUTE_LIST.findIndex(({ key }) => key === props.initialRoute),
          0
        ),
        routes: ROUTE_LIST
      },
      query: ""
    };

    this.position = new Animated.Value<number>(
      this.state.navigationState.index
    );
    this.initialLayout = { width: this.props.width, height: this.props.height };
  }

  static defaultProps = {
    initialRoute: "all",
    tabBarPosition: "top",
    inset: 0,
    bottomInset: 0,
    offset: 0
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.props.show !== prevProps.show && this.props.show) {
      this.setState({
        navigationState: {
          index: Math.max(
            ROUTE_LIST.findIndex(({ key }) => key === this.props.initialRoute),
            0
          ),
          routes: this.state.navigationState.routes
        }
      });
    }
  }

  panRef = React.createRef<PanGestureHandler>();

  cameraRollListRef = React.createRef<FlatList>();
  gifsListRef = React.createRef<FlatList>();
  memesListRef = React.createRef<FlatList>();
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
      ...otherProps
    } = this.props;
    const { query, navigationState } = this.state;
    const currentRoute = navigationState.routes[navigationState.index].key;

    switch (route.key) {
      case "all":
        return (
          <SearchFilterList
            isFocused={currentRoute === "all"}
            flatListRef={this.searchListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onChangeFilter={jumpTo}
            onPress={onPress}
            inset={this.props.inset}
            show={this.props.show}
            keyboardVisibleValue={keyboardVisibleValue}
            defaultTransparent={this.props.transparentSearch}
            autoFocus={this.props.autoFocusSearch}
            insetValue={this.props.insetValue}
            offset={this.props.offset}
            bottomInset={this.props.bottomInset}
            selectedIDs={selectedIDs}
            isModal={this.props.isModal}
            scrollY={this.props.scrollY}
          />
        );

      case GallerySectionItem.memes:
        return (
          <MemesFilterList
            isFocused={currentRoute === GallerySectionItem.memes}
            flatListRef={this.memesListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onPress={onPress}
            onChangeFilter={jumpTo}
            insetValue={this.props.insetValue}
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
            isFocused={currentRoute === GallerySectionItem.cameraRoll}
            flatListRef={this.cameraRollListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onChangeFilter={jumpTo}
            onPress={onPress}
            selectedIDs={selectedIDs}
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
            isFocused={currentRoute === GallerySectionItem.gifs}
            flatListRef={this.gifsListRef}
            simultaneousHandlers={this.simultaneousHandlers}
            onChangeFilter={jumpTo}
            onPress={onPress}
            bottomInset={this.props.bottomInset}
            selectedIDs={selectedIDs}
            isModal={this.props.isModal}
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

  handleChangeQuery = query => this.setState({ query });

  renderTabBar = props => (
    <GalleryHeader
      {...props}
      query={this.state.query}
      showHeader={this.props.showHeader}
      filter={props.navigationState.routes[0].key}
      scrollY={this.props.scrollY}
      keyboardVisibleValue={this.props.keyboardVisibleValue}
      position={this.position}
      tabBarPosition={this.props.tabBarPosition}
    />
  );

  position: Animated.Value<number>;
  initialLayout: { width: number; height: number };

  containerStyle = [styles.container, this.initialLayout];

  onIndexChange = index =>
    this.setState({
      navigationState: { ...this.state.navigationState, index }
    });

  render() {
    const { width, height, tabBarPosition, showHeader } = this.props;

    return (
      <TabView
        navigationState={this.state.navigationState}
        renderScene={this.renderScene}
        tabBarPosition={showHeader ? "bottom" : "top"}
        lazy={false}
        removeClippedSubviews={Platform.select({
          ios: false,
          android: false
        })}
        gestureHandlerProps={{
          ref: this.panRef,
          simultaneousHandlers: [
            this.gifsListRef,
            this.memesListRef,
            this.cameraRollListRef
          ]
        }}
        sceneContainerStyle={styles.sceneContainer}
        style={this.containerStyle}
        renderTabBar={this.renderTabBar}
        onIndexChange={this.onIndexChange}
        initialLayout={this.initialLayout}
        position={this.position}
        // keyboardDismissMode="none"
      />
    );
  }
}

export const GalleryTabView = React.memo(GalleryTabViewComponent);

export default GalleryTabView;
