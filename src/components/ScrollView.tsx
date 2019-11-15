import { ScrollView as GestureHandlerScrollView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { ScrollViewProps } from "react-native";

export const ScrollView = Animated.createAnimatedComponent(
  GestureHandlerScrollView
) as React.ComponentType<ScrollViewProps>;
