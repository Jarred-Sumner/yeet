/**
 * @format
 */

require("./src/lib/polyfills");
import "react-native-gesture-handler";
import "react-native-reanimated";
import { AppRegistry, YellowBox } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

YellowBox.ignoreWarnings([
  "Module YeetExporter requires main queue setup since it overrides",
  "Module YeetTextInputViewManager requires main queue setup since it o",
  "Warning: componentWillMount is deprecated",
  "Warning: componentWillMount has been renamed",
  "Warning: componentWillReceiveProps is deprecated",
  "Warning: componentWillReceiveProps has been renamed",
  "`-[RCTRootView cancelTouches]`"
]);

AppRegistry.registerComponent(appName, () => App);
