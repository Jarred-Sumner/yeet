import * as React from "react";
import { FlatList as RNFlatList, FlatListProps, Platform } from "react-native";
import {
  FlatList as GestureHandlerFlatList,
  ScrollView as _ScrollView
} from "react-native-gesture-handler";
// import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import Animated from "react-native-reanimated";
import hoistNonReactStatics from "hoist-non-react-statics";

export const ScrollView = Animated.ScrollView;

const FlatListComponent = Animated.createAnimatedComponent(
  GestureHandlerFlatList
) as RNFlatList<any>;

const _FlatList = React.forwardRef(
  ({ contentContainerStyle, contentInset, contentOffset, ...props }, ref) => {
    let _ref = React.useRef();

    React.useImperativeHandle(ref, () => _ref.current.getNode());

    if (Platform.OS === "ios") {
      return (
        <FlatListComponent
          contentInset={contentInset}
          contentOffset={contentOffset}
          contentContainerStyle={contentContainerStyle}
          {...props}
          ref={_ref}
        />
      );
    } else {
      return (
        <FlatListComponent
          contentContainerStyle={
            !contentContainerStyle && (contentInset || contentOffset)
              ? {
                  paddingTop: contentInset?.top || 0,
                  paddingBottom: contentInset?.bottom || 0
                }
              : contentContainerStyle
          }
          {...props}
          ref={_ref}
        />
      );
    }
  }
);

export const FlatList = hoistNonReactStatics(
  _FlatList,
  RNFlatList
) as React.ComponentType<FlatListProps<any>>;

FlatList.defaultProps = {
  ...(FlatList.defaultProps || {})
};

export default FlatList;
