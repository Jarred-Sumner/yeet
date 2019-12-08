import * as React from "react";
import { FlatList as RNFlatList, FlatListProps } from "react-native";
import {
  FlatList as GestureHandlerFlatList,
  ScrollView as _ScrollView
} from "react-native-gesture-handler";
// import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import Animated from "react-native-reanimated";
import { createNavigationAwareScrollable } from "@react-navigation/native";
import hoistNonReactStatics from "hoist-non-react-statics";

export const ScrollView = createNavigationAwareScrollable(
  Animated.createAnimatedComponent(_ScrollView)
);

const renderScrollView = props => <ScrollView {...props} />;

const FlatListComponent = Animated.createAnimatedComponent(
  GestureHandlerFlatList
) as RNFlatList<any>;

const _FlatList = React.forwardRef((props, ref) => {
  let _ref = React.useRef();

  React.useImperativeHandle(ref, () => _ref.current.getNode());

  return <FlatListComponent {...props} ref={_ref} />;
});

export const FlatList = hoistNonReactStatics(
  _FlatList,
  RNFlatList
) as React.ComponentType<FlatListProps<any>>;

FlatList.defaultProps = {
  ...(FlatList.defaultProps || {}),
  renderScrollView
};

export default FlatList;
