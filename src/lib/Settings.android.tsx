import DefaultPreference from "react-native-default-preference";
import { WATCH_KEYS } from "./Storage";

export const isWaitlisted = async () => {
  return (await DefaultPreference.get(WATCH_KEYS.WAITLILST)) === "true";
};

export const setWaitlisted = async value => {
  return DefaultPreference.set(WATCH_KEYS.WAITLILST, String(!!value));
};
