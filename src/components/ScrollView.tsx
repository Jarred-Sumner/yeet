import { ScrollView as GestureHandlerScrollView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

export const ScrollView = Animated.createAnimatedComponent(
  GestureHandlerScrollView
);
