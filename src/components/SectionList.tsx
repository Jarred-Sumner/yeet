import * as React from "react";
import { SectionList as RNSectionList, SectionListProps } from "react-native";
import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import Animated from "react-native-reanimated";
import { ScrollView as NavigationScrollView } from "react-navigation";
import hoistNonReactStatics from "hoist-non-react-statics";

const GestureHandlerSectionList = createNativeWrapper(RNSectionList);

export const ScrollView = createNativeWrapper(
  Animated.createAnimatedComponent(NavigationScrollView),
  {
    disallowInterruption: true
  }
);

const SectionListComponent = Animated.createAnimatedComponent(
  GestureHandlerSectionList
) as RNSectionList<any>;

const _SectionList = React.forwardRef((props, ref) => {
  let _ref = React.useRef();

  React.useImperativeHandle(ref, () => _ref.current.getNode());

  return <SectionListComponent {...props} ref={_ref} />;
});

export const SectionList = hoistNonReactStatics(
  _SectionList,
  RNSectionList
) as React.ComponentType<SectionListProps<any>>;

SectionList.defaultProps = {
  ...(SectionList.defaultProps || {}),
  renderScrollView: props => <ScrollView {...props} />
};

export default SectionList;
