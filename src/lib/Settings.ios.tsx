import { Settings } from "react-native";
import { WATCH_KEYS } from "./Storage";

export const isWaitlisted = () => {
  return String(Settings.get(WATCH_KEYS.WAITLILST)) === "true";
};

export const setWaitlisted = async (value: boolean) => {
  return Settings.set({ [WATCH_KEYS.WAITLILST]: String(!!value) });
};
