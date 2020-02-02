import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { ImageContainer } from "./models/ImageContainer";
import { RecentlyUsedContent } from "./models/RecentlyUsedContent";
import { schema } from "./schema";

const adapter = new SQLiteAdapter({
  schema: schema
});

export const database = new Database({
  modelClasses: [ImageContainer, RecentlyUsedContent],
  actionsEnabled: true,
  adapter
});
