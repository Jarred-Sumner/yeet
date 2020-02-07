import { cloneDeep } from "lodash";
import nanoid from "nanoid/non-secure";
import { basename, extname, join } from "path";
import { Platform } from "react-native";
import RNFS from "react-native-fs";
import Keystore, { ACCESSIBLE } from "react-native-secure-key-store";
import {
  RecentlyUsedContent,
  RecentlyUsedContentType
} from "./db/models/RecentlyUsedContent";
import { PostFragment } from "./graphql/PostFragment";
import { YeetImage, YeetImageContainer } from "./imageSearch";
import { getItem, setItem, removeItem } from "./Yeet";

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

const KEY_TYPES = {
  [KEYS.CURRENT_USER_ID]: "string",
  [KEYS.DISMISSED_WELCOME_MODAL]: "bool",
  [KEYS.DISMISSED_PUSH_NOTIFICATION_MODAL]: "bool"
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
      !!value ? 1 : 0
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
    return removeItem(Storage.formatKey(key));
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
    return getItem(Storage.formatKey(key), KEY_TYPES[key] || "string");
    // return AsyncStorage.getItem(Storage.formatKey(key));
  }

  static async insertRecentlyUsed(imageContainer: YeetImageContainer, post) {
    return addRecentlyUsedContent(imageContainer, post);
  }

  static clearRecentlyUsed() {
    return Storage.setItem(KEYS.RECENTLY_USED_IMAGES, JSON.stringify([]));
  }

  static setItem(key, value) {
    if (value) {
      return setItem(Storage.formatKey(key), value, KEY_TYPES[key]);
    } else {
      console.log(`[Storage] REMOVE ${key}`);
      return Storage.removeItem(key);
    }
  }
}

export default Storage;

export const copyFileToDocuments = async (uri: string) => {
  const path = uri.replace("file://", "");

  const filename = basename(path);
  let newPath = join(RNFS.DocumentDirectoryPath, filename);
  if (await RNFS.exists(newPath)) {
    const extension = extname(newPath);
    newPath = join(RNFS.DocumentDirectoryPath, nanoid() + extension);
  }

  await RNFS.copyFile(path, newPath);

  return newPath;
};

export const fetchRecentlyUsedContent = async (
  limit: number,
  offset: number,
  contentType: RecentlyUsedContentType | null
): Promise<[[Object], number]> => {
  let realm = RecentlyUsedContent._realm;

  if (!realm) {
    realm = await RecentlyUsedContent.getRealm();
  }

  let query = realm
    .objects<RecentlyUsedContent>("RecentlyUsedContent")
    .sorted("lastUsedAt", true);

  if (typeof contentType === "number") {
    query = query.filtered(`contentType == ${contentType}`);
  }

  const count = query.length;
  const to = Math.min(limit + offset, count);

  return [
    query.slice(offset, to).map(row => {
      return row.graphql;
    }),
    count
  ];
};

export const addRecentlyUsedContent = async (
  _image: YeetImageContainer,
  post: Partial<PostFragment> | null = null
) => {
  let image = cloneDeep(_image);

  if (image) {
    if (image.image.uri.includes(RNFS.TemporaryDirectoryPath)) {
      image.image.uri = await copyFileToDocuments(image.image.uri);
    }

    if (image.preview?.uri?.includes(RNFS.TemporaryDirectoryPath)) {
      image.preview.uri = await copyFileToDocuments(image.preview.uri);
    }
  }

  const id = post?.id || image.id;
  const realm = await RecentlyUsedContent.getRealm();

  const existingContents = await realm.objectForPrimaryKey(
    "RecentlyUsedContent",
    id
  );

  realm.write(() => {
    if (existingContents) {
      if (post) {
        Object.assign(existingContents, RecentlyUsedContent.fromPost(post));
      } else {
        Object.assign(
          existingContents,
          RecentlyUsedContent.fromYeetImageContainer(image)
        );
      }

      existingContents.lastUsedAt = new Date();
    } else {
      const props = { lastUsedAt: new Date(), createdAt: new Date(), id };
      if (post) {
        Object.assign(props, RecentlyUsedContent.fromPost(post));
      } else {
        Object.assign(props, RecentlyUsedContent.fromYeetImageContainer(image));
      }
      realm.create("RecentlyUsedContent", props, Realm.UpdateMode.All);
    }
  });
};
