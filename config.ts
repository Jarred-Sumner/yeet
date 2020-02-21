import DeviceInfo from "react-native-device-info";
import { getInset } from "react-native-safe-area-view";
import { Dimensions, Platform } from "react-native";

export const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

const DEVELOPMENT_HOSTNAME = "http://localhost:3000";
const PRODUCTION_HOSTNAME = "https://getyeet.ap";

export let BASE_HOSTNAME = IS_DEVELOPMENT
  ? DEVELOPMENT_HOSTNAME
  : PRODUCTION_HOSTNAME;

export const ONESIGNAL_APP_ID = "d25d41fd-b301-4e78-a18d-40fe5b1ce6eb";
export const CODEPUSH_KEY = "HXt7XeMPJ9yTpDpDMG5Q5f59qMqK5nsDZic9K";

export const IS_SIMULATOR = DeviceInfo.isEmulator();

export const TOP_Y = getInset("top");
export const BOTTOM_Y = getInset("bottom");

export const OS_VERSION = parseInt(Platform.Version, 10);
export const IS_IOS_13 = Platform.select({
  ios: OS_VERSION >= 13,
  android: false
});

if (IS_DEVELOPMENT && !IS_SIMULATOR && Platform.OS === "ios") {
  BASE_HOSTNAME = PRODUCTION_HOSTNAME;
}

export const SCREEN_DIMENSIONS = Dimensions.get("window");
