import * as React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { TabView, SceneMap } from "react-native-tab-view";
import { LIST_HEADER_HEIGHT, TabBar } from "./ImagePicker/TabBar";
import { CameraRollList } from "./ImagePicker/CameraRollList";
import { InternetImagesList } from "./ImagePicker/InternetImagesList";
import { MediaPlayerPauser } from "../MediaPlayer";

const CameraRollRoute = props => <CameraRollList {...props} />;

const InternetImagesRoute = props => <InternetImagesList {...props} />;

export enum ImagePickerRoute {
  internet = "internet",
  camera = "camera"
}

const ROUTE_LIST = [
  { key: ImagePickerRoute.camera, title: "Internet" },
  { key: ImagePickerRoute.internet, title: "Camera" }
];

export class ImagePicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: Math.max(
        ROUTE_LIST.findIndex(({ key }) => key === props.initialRoute),
        0
      ),
      routes: ROUTE_LIST
    };
  }

  static defaultProps = {
    initialRoute: ImagePickerRoute.camera
  };

  renderScene = ({ route, jumpTo, position }) => {
    const { width, height, ...otherProps } = this.props;

    switch (route.key) {
      case ImagePickerRoute.camera:
        return (
          <MediaPlayerPauser>
            <CameraRollRoute
              jumpTo={jumpTo}
              position={position}
              width={width}
              height={height - LIST_HEADER_HEIGHT}
              tabBarHeight={LIST_HEADER_HEIGHT}
              {...otherProps}
            />
          </MediaPlayerPauser>
        );
      case ImagePickerRoute.internet:
        return (
          <MediaPlayerPauser>
            <InternetImagesRoute
              jumpTo={jumpTo}
              position={position}
              width={width}
              height={height - LIST_HEADER_HEIGHT}
              tabBarHeight={LIST_HEADER_HEIGHT}
              {...otherProps}
            />
          </MediaPlayerPauser>
        );
      default: {
        throw Error(`Invalid route: ${route}`);
        return null;
      }
    }
  };

  renderTabBar = props => (
    <TabBar {...props} opacityValue={this.props.controlsOpacityValue} />
  );

  render() {
    const { width, height } = this.props;
    return (
      <TabView
        navigationState={this.state}
        renderScene={this.renderScene}
        tabBarPosition="top"
        lazy
        sceneContainerStyle={{ overflow: "visible" }}
        renderTabBar={this.renderTabBar}
        onIndexChange={index => this.setState({ index })}
        initialLayout={{ width, height }}
      />
    );
  }
}

export { LIST_HEADER_HEIGHT } from "./ImagePicker/TabBar";
