import * as React from "react";
import { NativeColorSlider } from "./NativeColorSlider";
import Animated from "react-native-reanimated";

export const ColorSlider = Animated.createAnimatedComponent(NativeColorSlider);
export default ColorSlider;
