import { Platform } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import Keystore, { ACCESSIBLE } from "react-native-secure-key-store";

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
  JWT: "JWT",
  CURRENT_USER_ID: "CURRENT_USER_ID"
};

var _cachedJWT;

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
    return result === "true";
  }

  static setDismissedPushNotificationModal(value) {
    return Storage.setItem(
      KEYS.DISMISSED_PUSH_NOTIFICATION_MODAL,
      !!value ? "true" : "false"
    );
  }

  static async hasDismissedWelcomeModal() {
    const result = await Storage.getItem(KEYS.DISMISSED_WELCOME_MODAL);
    return result === "true";
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

  static getJWT() {
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
