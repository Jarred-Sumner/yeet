/**
 * @format
 */

require("./src/lib/polyfills");
import "react-native-gesture-handler";
import "react-native-reanimated";
import { AppRegistry, YellowBox, findNodeHandle } from "react-native";
import _App from "./App";
import { name as appName } from "./app.json";
import { memoize } from "lodash";
import codePush from "react-native-code-push";
import { IS_SIMULATOR } from "./config";

YellowBox.ignoreWarnings([
  "Module EmojiTextInputViewManager",
  "RUTS",
  "Unable to find module for UIManager",
  "Module YeetExporter requires main queue setup since it overrides",
  "Module YeetTextInputViewManager requires main queue setup since it o",
  "Module YeetColorSlider requires main queue setup since it o",
  "Warning: componentWillMount is deprecated",
  "Warning: componentWillMount has been renamed",
  "Warning: componentWillReceiveProps is deprecated",
  "Warning: componentWillReceiveProps has been renamed",
  "`-[RCTRootView cancelTouches]`"
]);

let App = _App;
if (!IS_SIMULATOR) {
  App = codePush({
    checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
    installMode: codePush.InstallMode.ON_NEXT_RESUME
  })(_App);
}

AppRegistry.registerComponent(appName, () => App);
