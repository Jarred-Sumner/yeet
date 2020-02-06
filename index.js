/**
 * @format
 */

require("./src/lib/polyfills");

import {
  AppRegistry,
  YellowBox,
  findNodeHandle,
  NativeModules,
  Platform,
  View
} from "react-native";
import * as React from "react";
import { name as appName } from "./app.json";
import { memoize } from "lodash";
import codePush from "react-native-code-push";
import { enableScreens } from "react-native-screens";

enableScreens();

const { IS_SIMULATOR } = require("./config");

require("react-native-gesture-handler");
require("react-native-reanimated");

let _App = require("./App").default;
let App = _App;

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

if (false) {
  App = codePush({
    checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
    installMode: codePush.InstallMode.ON_NEXT_RESUME
  })(_App);
}

AppRegistry.registerComponent(appName, () => App);
