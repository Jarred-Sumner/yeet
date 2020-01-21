import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

export const sendLightFeedback = () => {
  ReactNativeHapticFeedback.trigger("impactLight", options);
};

export const sendSelectionFeedback = () => {
  ReactNativeHapticFeedback.trigger("selection", options);
};

export const sendSuccessNotification = () => {
  ReactNativeHapticFeedback.trigger("notificationSuccess", options);
};
