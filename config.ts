import Config from "react-native-config";
import DeviceInfo from "react-native-device-info";
import { getInset } from "react-native-safe-area-view";
import { Dimensions, Platform } from "react-native";
// export const BASE_HOSTNAME = "https://getyeet.app";

export const ONESIGNAL_APP_ID = "d25d41fd-b301-4e78-a18d-40fe5b1ce6eb";
export const CODEPUSH_KEY = "HXt7XeMPJ9yTpDpDMG5Q5f59qMqK5nsDZic9K";
export let BASE_HOSTNAME = Platform.select({
  ios: Config.BASE_HOSTNAME,
  android:
    process.env.NODE_ENV === "production"
      ? "https://getyeet.app"
      : "http://localhost:3000"
});
export const IS_SIMULATOR = DeviceInfo.isEmulator();

export const TOP_Y = getInset("top");
export const BOTTOM_Y = getInset("bottom");
export const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const FLICKR_API_KEY = "567fbd36f8779b6b9ee673ee7c5e570f";

if (IS_DEVELOPMENT && !IS_SIMULATOR && Platform.OS === "ios") {
  BASE_HOSTNAME = Config.PRODUCTION_BASE_HOSTNAME;
}

export const SCREEN_DIMENSIONS = Dimensions.get("window");
