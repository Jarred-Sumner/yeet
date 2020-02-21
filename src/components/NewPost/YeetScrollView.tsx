import { requireNativeComponent, ViewProps } from "react-native";
import * as React from "react";

export type YeetScrollViewProps = ViewProps & {
  headerHeight: number;
  footerHeight: number;
};

export const YeetScrollView = requireNativeComponent(
  "YeetScrollView"
) as React.ComponentType<YeetScrollViewProps>;

export default YeetScrollView;
