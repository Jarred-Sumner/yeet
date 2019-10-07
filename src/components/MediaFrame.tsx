import { requireNativeComponent, findNodeHandle } from "react-native";
import React from "react";
import { NativeModules } from "react-native";

const VIEW_NAME = "MediaFrameView";

const MediaFrameView = requireNativeComponent(VIEW_NAME);

export class MediaFrame extends React.Component {
  nativeRef = React.createRef();
  static NativeModule = NativeModules["MediaFrameViewManager"];

  captureFrame = (mediaQueueRef: React.RefObject<any>) => {
    return MediaFrame.NativeModule.updateFrame(
      findNodeHandle(this),
      findNodeHandle(mediaQueueRef.current)
    );
  };

  render() {
    return <MediaFrameView ref={this.nativeRef} {...this.props} />;
  }
}

export default MediaFrame;
