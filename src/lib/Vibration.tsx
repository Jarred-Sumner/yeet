import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

const trigger = (type, opts) => {
  if (global.YeetJSI?.hapticFeedback) {
    global.YeetJSI?.hapticFeedback(type, opts);
  } else {
    ReactNativeHapticFeedback.trigger(type, opts);
  }
};

export const sendLightFeedback = () => {
  trigger("impactLight", options);
};

export const sendSelectionFeedback = () => {
  trigger("selection", options);
};

export const sendSuccessNotification = () => {
  trigger("notificationSuccess", options);
};
