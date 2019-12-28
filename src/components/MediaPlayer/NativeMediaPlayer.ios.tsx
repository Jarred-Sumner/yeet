import { requireNativeComponent } from "react-native";
import * as React from "react";

export const VIEW_NAME = "MediaPlayerView";

export const NativeMediaPlayer = React.memo(requireNativeComponent(VIEW_NAME));
