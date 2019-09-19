import Config from "react-native-config";
import DeviceInfo from "react-native-device-info";
import { getInset } from "react-native-safe-area-view";
import { Dimensions } from "react-native";
// const BASE_HOSTNAME = "http://192.168.0.101:3000";

export let BASE_HOSTNAME = Config.BASE_HOSTNAME;
export const IS_SIMULATOR = DeviceInfo.isEmulator();

export const TOP_Y = getInset("top");
export const BOTTOM_Y = getInset("bottom");
export const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_DEVELOPMENT && !IS_SIMULATOR) {
  BASE_HOSTNAME = Config.PRODUCTION_BASE_HOSTNAME;
}

export const SCREEN_DIMENSIONS = Dimensions.get("window");
