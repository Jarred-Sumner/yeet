import Config from "react-native-config";
import DeviceInfo from "react-native-device-info";
import { getInset } from "react-native-safe-area-view";
import { Dimensions } from "react-native";
export const BASE_HOSTNAME = "https://getyeet.app";

export const ONESIGNAL_APP_ID = "d25d41fd-b301-4e78-a18d-40fe5b1ce6eb";
export const CODEPUSH_KEY = "HXt7XeMPJ9yTpDpDMG5Q5f59qMqK5nsDZic9K";
// export let BASE_HOSTNAME = Config.BASE_HOSTNAME;
export const IS_SIMULATOR = DeviceInfo.isEmulator();

export const TOP_Y = getInset("top");
export const BOTTOM_Y = getInset("bottom");
export const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_DEVELOPMENT && !IS_SIMULATOR) {
  BASE_HOSTNAME = Config.PRODUCTION_BASE_HOSTNAME;
}

export const SCREEN_DIMENSIONS = Dimensions.get("window");
