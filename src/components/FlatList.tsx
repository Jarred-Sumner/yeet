import * as React from "react";
import { FlatList as RNFlatList, FlatListProps } from "react-native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import Animated from "react-native-reanimated";
import { ScrollView as NavigationScrollView } from "react-navigation";

export const ScrollView = createNativeWrapper(
  Animated.createAnimatedComponent(NavigationScrollView),
  {
    disallowInterruption: true
  }
);

export const FlatList = Animated.createAnimatedComponent(
  GestureHandlerFlatList
) as React.ComponentType<FlatListProps<any>>;

FlatList.defaultProps = {
  renderScrollView: props => <ScrollView {...props} />
};

export default FlatList;
