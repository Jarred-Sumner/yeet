import * as React from "react";
import { FlatList as RNFlatList, FlatListProps } from "react-native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import Animated from "react-native-reanimated";
import { ScrollView as NavigationScrollView } from "react-navigation";
import hoistNonReactStatics from "hoist-non-react-statics";

export const ScrollView = createNativeWrapper(
  Animated.createAnimatedComponent(NavigationScrollView),
  {
    disallowInterruption: true
  }
);

const FlatListComponent = Animated.createAnimatedComponent(
  GestureHandlerFlatList
) as RNFlatList<any>;

const _FlatList = React.forwardRef((props, ref) => {
  let _ref = React.useRef();

  React.useImperativeHandle(ref, () => _ref.current.getNode());

  return <FlatListComponent {...props} ref={_ref} />;
});

export const FlatList = hoistNonReactStatics(_FlatList, RNFlatList);

FlatList.defaultProps = {
  ...(FlatList.defaultProps || {}),
  renderScrollView: props => <ScrollView {...props} />
};

export default FlatList;
