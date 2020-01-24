import * as React from "react";
import { requireNativeComponent, ViewProps } from "react-native";
import Animated from "react-native-reanimated";

type Props = ViewProps & {
  title: string;
  actions: [ContextMenuAction];
  onPress: React.ReactEventHandler<{ title: string; id: string }>;
};

export type ContextMenuAction = {
  systemIcon: string;
  title: string;
  id: string;
  children?: Array<ContextMenuAction>;
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
};

export const ContextMenu = requireNativeComponent(
  "ContextMenuView"
) as React.ComponentType<Props>;

export const AnimatedContextMenu = Animated.createAnimatedComponent(
  ContextMenu
) as React.ComponentType<Props>;
