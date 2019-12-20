import { Platform } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import Keystore, { ACCESSIBLE } from "react-native-secure-key-store";
import { YeetImageContainer, YeetImage, isVideo } from "./imageSearch";
import { uniqBy } from "lodash";
import RNFS from "react-native-fs";
import { basename, join, extname } from "path";
import nanoid from "nanoid/non-secure";

const PRODUCTION_SUPER_STORE = "@yeetapp-production";
const DEVELOPMENT_SUPER_STORE = "@yeetapp-dev-11";

const SUPER_STORE =
  process.env.NODE_ENV === "production"
    ? PRODUCTION_SUPER_STORE
    : DEVELOPMENT_SUPER_STORE;
// const IS_CACHING_CONTACTS_ENABLED = true;

const KEYS = {
  DISMISSED_PUSH_NOTIFICATION_MODAL: "DISMISSED_PUSH_NOTIFICATION_MODAL",
  DISMISSED_WELCOME_MODAL: "DISMISSED_WELCOME_MODAL",
  RECENTLY_USED_IMAGES: "RECENTLY_USED_IMAGES",
  JWT: "JWT",
  CURRENT_USER_ID: "CURRENT_USER_ID"
};

export const WATCH_KEYS = {
  WAITLILST: "HIDE_WAITILST"
};

var _cachedJWT;

type RecentImage = YeetImage & {
  id: string;
};

const recentlyUsedId = (image: RecentImage) => image.id ?? image.uri;

export class Storage {
  static formatKey = key => {
    return `${SUPER_STORE}:${key}`;
  };

  static async hasDismissedPushNotificationModal() {
    if (Platform.OS === "android") {
      return Promise.resolve(true);
    }

    const result = await Storage.getItem(
      KEYS.DISMISSED_PUSH_NOTIFICATION_MODAL
    );

    return String(result) === "true";
  }

  static setDismissedPushNotificationModal(value) {
    return Storage.setItem(
      KEYS.DISMISSED_PUSH_NOTIFICATION_MODAL,
      !!value ? "true" : "false"
    );
  }

  static async hasDismissedWelcomeModal() {
    const result = await Storage.getItem(KEYS.DISMISSED_WELCOME_MODAL);
    return String(result) === "true";
  }

  static getCachedJWT() {
    return _cachedJWT;
  }

  static removeItem(key) {
    AsyncStorage.removeItem(Storage.formatKey(key));
  }

  static setDismissedWelcomeModal(value) {
    return Storage.setItem(
      KEYS.DISMISSED_WELCOME_MODAL,
      !!value ? "true" : "false"
    );
  }

  static setJWT(value) {
    _cachedJWT = value;
    return Keystore.set(this.formatKey(KEYS.JWT), value, {
      accessible: ACCESSIBLE.ALWAYS
    });
  }

  static signOut() {
    _cachedJWT = null;
    return Promise.all([
      Keystore.remove(this.formatKey(KEYS.JWT)),
      Storage.removeItem(KEYS.CURRENT_USER_ID)
    ]);
  }

  static getJWT() {
    if (_cachedJWT) {
      return Promise.resolve(_cachedJWT);
    }

    return Keystore.get(this.formatKey(KEYS.JWT)).then(
      jwt => {
        if (jwt) {
          _cachedJWT = jwt;
        }

        return jwt;
      },
      () => null
    );
  }

  static setUserId(userId) {
    return Storage.setItem(KEYS.CURRENT_USER_ID, userId);
  }

  static getUserId() {
    return Storage.getItem(KEYS.CURRENT_USER_ID);
  }

  static isSignedIn() {
    return !!this.getCachedJWT();
  }

  static getItem(key: string) {
    console.log(`[Storage] GET ${key}`);
    return AsyncStorage.getItem(Storage.formatKey(key));
  }

  static getRecentlyUsed(): Promise<Array<RecentImage>> {
    return this.getItem(KEYS.RECENTLY_USED_IMAGES).then(result => {
      if (result && typeof result === "string") {
        try {
          return JSON.parse(result);
        } catch {
          return [];
        }
      } else {
        return [];
      }
    });
  }

  static async insertRecentlyUsed(imageContainer: YeetImageContainer) {
    const recentlyUsed = await this.getRecentlyUsed();

    let image: RecentImage = { ...imageContainer.image };
    image.id = imageContainer.id;
    if (image.uri.includes(RNFS.TemporaryDirectoryPath)) {
      const path = image.uri.replace("file://", "");

      const filename = basename(path);
      let newPath = join(RNFS.DocumentDirectoryPath, filename);
      if (await RNFS.exists(newPath)) {
        const extension = extname(newPath);
        newPath = join(RNFS.DocumentDirectoryPath, nanoid() + extension);
      }

      await RNFS.copyFile(path, newPath);

      image.uri = newPath;
    }

    recentlyUsed.unshift(image);

    return Storage.setItem(
      KEYS.RECENTLY_USED_IMAGES,
      JSON.stringify(uniqBy(recentlyUsed, recentlyUsedId).slice(0, 80))
    );
  }

  static clearRecentlyUsed() {
    return Storage.setItem(KEYS.RECENTLY_USED_IMAGES, JSON.stringify([]));
  }

  static setItem(key, value) {
    if (value) {
      AsyncStorage.setItem(Storage.formatKey(key), value);
    } else {
      console.log(`[Storage] REMOVE ${key}`);
      AsyncStorage.removeItem(Storage.formatKey(key));
    }
  }
}

export default Storage;
