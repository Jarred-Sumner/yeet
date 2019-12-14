import { NativeModules, NativeEventEmitter } from "react-native";
import { MediaSource } from "../MediaPlayer";

export type ClipboardResponse = {
  urls: Array<string>;
  strings: Array<string>;
  hasImages: Boolean;
  hasURLs: Boolean;
  hasStrings: Boolean;
};

export const YeetClipboard = NativeModules["YeetClipboard"];

const emitter = new NativeEventEmitter(YeetClipboard);

export const listenToClipboardChanges = listener =>
  emitter.addListener("YeetClipboardChange", listener);

export const stopListeningToClipboardChanges = listener =>
  emitter.removeListener("YeetClipboardChange", listener);

export const listenToClipboardRemove = listener =>
  emitter.addListener("YeetClipboardRemove", listener);

export const stopListeningToClipboardRemove = listener =>
  emitter.removeListener("YeetClipboardRemove", listener);

export const getClipboardContents = (): Promise<ClipboardResponse> => {
  return new Promise((resolve, reject) => {
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
  return new Promise((resolve, reject) => {
    YeetClipboard.clipboardMediaSource((err, mediaSource) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(mediaSource);

      if (
        typeof mediaSource === "object" &&
        typeof mediaSource.id === "string"
      ) {
        resolve(mediaSource);
      } else {
        resolve(null);
      }
    });
  });
};
