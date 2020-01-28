import { Database, Q, Query } from "@nozbe/watermelondb";
import { ImageContainer } from "./models/ImageContainer";
import { RecentlyUsedContent } from "./models/RecentlyUsedContent";
import { YeetImageContainer } from "../imageSearch";
import { PostFragment } from "../graphql/PostFragment";
import { first } from "lodash";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { schema } from "./schema";
import RNFS from "react-native-fs";
import { basename, join, extname } from "path";
import nanoid from "nanoid/non-secure";
import { cloneDeep } from "lodash";
import { copyFileToDocuments } from "../Storage";
import { orderBy, uniqBy } from "lodash";

const adapter = new SQLiteAdapter({
  schema: schema
});

export const database = new Database({
  modelClasses: [ImageContainer, RecentlyUsedContent],
  actionsEnabled: true,
  adapter
});

export const fetchRecentlyUsedContent = async () => {
  const contents: Query<RecentlyUsedContent> = await database.collections
    .get("recently_used_contents")
    .query()
    .fetch();

  return orderBy<RecentlyUsedContent>(
    uniqBy(contents, "uid"),
    ["lastUsedAt"],
    ["desc"]
  ).map(content => {
    return content.graphql;
  });
};

export const addRecentlyUsedContent = async (
  _image: YeetImageContainer,
  post: Partial<PostFragment> | null = null
) => {
  let image = cloneDeep(_image);

  if (image.image.uri.includes(RNFS.TemporaryDirectoryPath)) {
    image.image.uri = await copyFileToDocuments(image.image.uri);
  }

  if (image.preview?.uri?.includes(RNFS.TemporaryDirectoryPath)) {
    image.preview.uri = await copyFileToDocuments(image.preview.uri);
  }

  const id = post?.id || image.id;

  return database.action(async () => {
    const contents = database.collections.get("recently_used_contents");
    const existingContents = first<ImageContainer>(
      await contents.query(Q.where("uid", id)).fetch()
    );

    if (existingContents) {
      await existingContents.update(record => {
        post && Object.assign(record, RecentlyUsedContent.fromPost(post));
        Object.assign(
          record,
          RecentlyUsedContent.fromYeetImageContainer(image)
        );
        record.lastUsedAt = new Date();
      });
    } else {
      return contents.create(record => {
        post && Object.assign(record, RecentlyUsedContent.fromPost(post));
        Object.assign(
          record,
          RecentlyUsedContent.fromYeetImageContainer(image)
        );
        record.lastUsedAt = new Date();
      });
    }
  });
};
