import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import { MediaSource } from "../MediaPlayer";

export type ClipboardResponse = {
  urls: Array<string>;
  strings: Array<string>;
  hasImages: Boolean;
  hasURLs: Boolean;
  hasStrings: Boolean;
};

export const YeetClipboard = NativeModules["YeetClipboard"] ?? {
  clipboard: {
    urls: [],
    strings: [],
    hasImages: false,
    hasURLs: false,
    hasStrings: false
  },
  mediaSource: null
};

const emitter = Platform.select({
  ios: new NativeEventEmitter(YeetClipboard),
  android: null
});

export const listenToClipboardChanges = listener =>
  emitter?.addListener("YeetClipboardChange", listener);

export const stopListeningToClipboardChanges = listener =>
  emitter?.removeListener("YeetClipboardChange", listener);

export const listenToClipboardRemove = listener =>
  emitter?.addListener("YeetClipboardRemove", listener);

export const stopListeningToClipboardRemove = listener =>
  emitter?.removeListener("YeetClipboardRemove", listener);

export const getClipboardContents = (): Promise<ClipboardResponse> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === "android") {
      resolve({
        urls: [],
        strings: [],
        hasImages: false,
        hasURLs: false,
        hasStrings: false
      });
      return;
    }

    YeetClipboard.getContents((err, contents) => {
      if (err) {
        reject(err);
        return;
      } else {
        resolve(contents);
      }
    });
  });
};

export const getClipboardMediaSource = (): Promise<MediaSource | null> => {
  if (Platform.OS === "android") {
    return Promise.resolve(null);
  }

  return global.Clipboard.getMediaSource();
};
