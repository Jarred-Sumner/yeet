import { TextInput } from "react-native";
import { BoundsRect } from "./Rect";

import { isNumber, throttle } from "lodash";

const { currentlyFocusedField } = TextInput.State;

export const photosAuthorizationStatus = (): string =>
  global.YeetJSI?.photosAuthorizationStatus;

export const triggerScrollEvent = (nodeHandle: number) =>
  global.YeetJSI?.triggerScrollEvent(nodeHandle);

export const getItem = (key: string, type: string): any =>
  global.YeetJSI?.getItem(key, type);

export const removeItem = (key: string): any => global.YeetJSI?.removeItem(key);

export const getFocusedYeetInputTag = (): any =>
  global.YeetJSI?.focusedTextInputTag;

export const setItem = (key: string, value: any, type: string): any =>
  global.YeetJSI?.setItem(key, value, type);

export const hideSplashScreen = () => global.YeetJSI?.hideSplashScreen();

const _focusYeetTextInput = inputTag => global.YeetJSI?.focus(inputTag);
const _blurYeetTextInput = inputTag => global.YeetJSI?.blur(inputTag);

export const focusYeetTextInput = throttle(_focusYeetTextInput, 50);
export const blurYeetTextInput = throttle(_blurYeetTextInput, 50);

export const dismissKeyboard = () => {
  const id = [getFocusedYeetInputTag(), currentlyFocusedField()].filter(
    isNumber
  )[0];

  if (id) {
    blurYeetTextInput(id);
    window.requestIdleCallback(() => TextInput.State.blurTextInput(id));
  }
};

export enum PanSheetViewSize {
  tall = "longForm",
  short = "shortForm"
}

export const transitionPanSheetView = (
  tag: number,
  size: PanSheetViewSize | "dismiss"
) => global.YeetJSI?.transitionPanView(tag, size);

export const measureRelativeTo = (
  containerTag: number,
  blocks: Array<number>,
  callback: (
    err: Error | null,
    measurements: { measurements: Array<BoundsRect> }
  ) => void
) => global.YeetJSI?.measureRelativeTo(containerTag, blocks, callback);
