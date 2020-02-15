import { TextInput } from "react-native";

const { currentlyFocusedField } = TextInput.State;

export const photosAuthorizationStatus = (): string =>
  global.YeetJSI?.photosAuthorizationStatus;

export const triggerScrollEvent = (nodeHandle: number) =>
  global.YeetJSI?.triggerScrollEvent(nodeHandle);

export const getItem = (key: string, type: string): any =>
  global.YeetJSI?.getItem(key, type);

export const removeItem = (key: string): any => global.YeetJSI?.removeItem(key);

export const setItem = (key: string, value: any, type: string): any =>
  global.YeetJSI?.setItem(key, value, type);

export const hideSplashScreen = () => global.YeetJSI?.hideSplashScreen();

export const focusYeetTextInput = inputTag => global.YeetJSI?.focus(inputTag);
export const blurYeetTextInput = inputTag => global.YeetJSI?.blur(inputTag);

export const dismissKeyboard = () => {
  if (currentlyFocusedField()) {
    const id = currentlyFocusedField();

    blurYeetTextInput(id);
    window.requestIdleCallback(() => TextInput.State.blurTextInput(id));
  }
};

export enum PanSheetViewSize {
  tall = "longForm",
  short = "shortForm"
}

export const transitionPanSheetView = (tag: number, size: PanSheetViewSize) =>
  global.YeetJSI?.transitionPanView(tag, size);
