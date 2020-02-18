import * as React from "react";

import {
  requireNativeComponent,
  ViewProps,
  NativeModules,
  NativeEventEmitter,
  NativeSyntheticEvent,
  Platform
} from "react-native";
import Animated from "react-native-reanimated";
import { ContentContainerContext } from "./ContentContainerContext";
import { BoundsRect } from "../../lib/Rect";
import { createNativeWrapper } from "react-native-gesture-handler";

export type MovableViewPositionChange = {
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotate: number;
  };
  uid: string;
  bounds: BoundsRect;
  center: { x: number; y: number };
};

export type MovableViewPositionChangeEvent = NativeSyntheticEvent<
  MovableViewPositionChange
>;

type SnapContainerProps = ViewProps & {
  onShowSnapPreview: NativeSyntheticEvent<any>;
  onHideSnapPreview: NativeSyntheticEvent<any>;
  onDelete: NativeSyntheticEvent<any>;
  onTapBackground: NativeSyntheticEvent<any>;
  onStartMoving: MovableViewPositionChangeEvent;
  onStopMoving: MovableViewPositionChangeEvent;
  onSnap: NativeSyntheticEvent<any>;
  snapPoints: {};
  deleteX: number;
  deleteY: number;
  deleteTag: number;
};

export const NativeSnapContainerView = requireNativeComponent(
  "SnapContainerView"
) as React.ComponentType<SnapContainerProps>;

const AnimatedNativeSnapContainerView = Animated.createAnimatedComponent(
  NativeSnapContainerView
) as React.ComponentType<SnapContainerProps>;

const SnapContainerEventEmitter = Platform.select({
  ios: new NativeEventEmitter(NativeModules.SnapContainerEventEmitter),
  android: null
});

enum SnapContainerEvent {
  onMoveStart = "onMoveStart",
  onMoveEnd = "onMoveEnd",
  onDelete = "onDelete",
  onTapBackground = "onTapBackground"
}

class SnapContainerComponent extends React.Component {
  componentDidMount() {
    this.subscribeToEvents();
  }

  subscribeToEvents = () => {
    SnapContainerEventEmitter?.addListener(
      SnapContainerEvent.onMoveStart,
      this.handleMoveStart
    );

    SnapContainerEventEmitter?.addListener(
      SnapContainerEvent.onMoveEnd,
      this.handleMoveEnd
    );

    SnapContainerEventEmitter?.addListener(
      SnapContainerEvent.onDelete,
      this.handleDelete
    );

    SnapContainerEventEmitter?.addListener(
      SnapContainerEvent.onTapBackground,
      this.handleTapBackground
    );
  };
  unsubscribeFromEvents = () => {
    SnapContainerEventEmitter.removeAllListeners();
  };

  handleMoveStart = event => {
    console.log("MOVE START", event);
    this.props.onMoveStart && this.props.onMoveStart(event);
  };

  handleMoveEnd = event => {
    console.log("MOVE END", event);
    this.props.onMoveEnd && this.props.onMoveEnd(event);
  };

  handleDelete = event => {
    this.props.onDelete && this.props.onDelete(event);
  };

  handleTapBackground = event => {
    this.props.onTapBackground && this.props.onTapBackground(event);
  };

  componentWillUnmount() {
    this.unsubscribeFromEvents();
  }

  render() {
    const {
      snapPoints,
      movableViewTags,
      style,
      containerRef,
      children,
      NativeComponent = NativeSnapContainerView
    } = this.props;

    return (
      <NativeComponent
        snapPoints={snapPoints}
        movableViewTags={movableViewTags}
        style={style}
        ref={containerRef}
      >
        {children}
      </NativeComponent>
    );
  }
}

export const SnapContainerView = React.forwardRef((props, ref) => {
  const { movableViewTags } = React.useContext(ContentContainerContext);

  return (
    <SnapContainerComponent
      {...props}
      movableViewTags={movableViewTags}
      NativeComponent={NativeSnapContainerView}
      containerRef={ref}
    />
  );
}) as React.ComponentType<SnapContainerProps>;

export const AnimatedSnapContainerView = React.forwardRef((props, ref) => {
  const { movableViewTags } = React.useContext(ContentContainerContext);

  return (
    <SnapContainerComponent
      {...props}
      NativeComponent={AnimatedNativeSnapContainerView}
      movableViewTags={movableViewTags}
      ref={ref}
    />
  );
}) as React.ComponentType<SnapContainerProps>;
