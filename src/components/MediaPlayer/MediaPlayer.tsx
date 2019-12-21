import hoistNonReactStatics from "hoist-non-react-statics";
import React, { useImperativeHandle } from "react";
import { findNodeHandle, View } from "react-native";
import { SharedElement } from "react-navigation-shared-element";
import {
  MediaPlayerComponent,
  MediaPlayerProps
} from ".//MediaPlayerComponent";
import { MediaPlayerContext } from "./MediaPlayerContext";

const BatchPausableMediaPlayer = React.forwardRef(({ id, ...props }, ref) => {
  const _ref = React.useRef<MediaPlayerComponent>(null);
  useImperativeHandle(ref, () => _ref.current);
  const mediaPlayerContext = React.useContext(MediaPlayerContext);

  React.useEffect(() => {
    if (mediaPlayerContext === null || !id) {
      return;
    }

    if (id) {
      mediaPlayerContext.registerID(id, findNodeHandle(_ref.current));
    }

    return () => {
      mediaPlayerContext.unregisterID(id);
    };
  }, [mediaPlayerContext, id]);

  return <MediaPlayerComponent id={id} {...props} ref={_ref} />;
});

const _MediaPlayer = (React.forwardRef(
  (
    {
      onLoad,
      isActive,
      id,
      sharedId,
      borderRadius,
      ...props
    }: MediaPlayerProps,
    ref
  ) => {
    const MediaPlayerContainer =
      typeof id === "string" && id.length > 0
        ? BatchPausableMediaPlayer
        : MediaPlayerComponent;

    const player = (
      <MediaPlayerContainer
        {...props}
        onLoad={onLoad}
        id={id}
        isActive={isActive}
        borderRadius={borderRadius}
        ref={ref}
      />
    );
    if (sharedId) {
      return (
        <SharedElement id={sharedId}>
          <View>{player}</View>
        </SharedElement>
      );
    } else {
      return player;
    }
  }
) as unknown) as MediaPlayerComponent;

export const MediaPlayer = hoistNonReactStatics(
  _MediaPlayer,
  MediaPlayerComponent
);

export default MediaPlayer;
