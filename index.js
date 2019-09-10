/**
 * @format
 */

require("./src/lib/polyfills");
import { AppRegistry, YellowBox } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";
import "react-native-gesture-handler";
import "react-native-reanimated";

YellowBox.ignoreWarnings([
  "Warning: componentWillMount is deprecated",
  "Warning: componentWillMount has been renamed",
  "Warning: componentWillReceiveProps is deprecated",
  "Warning: componentWillReceiveProps has been renamed",
  "`-[RCTRootView cancelTouches]`"
]);

AppRegistry.registerComponent(appName, () => App);
