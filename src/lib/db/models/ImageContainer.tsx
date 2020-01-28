import { Model } from "@nozbe/watermelondb";
import {
  field,
  relation,
  date,
  readonly
} from "@nozbe/watermelondb/decorators";
import { YeetImageContainer } from "../../imageSearch";

export class ImageContainer extends Model {
  static associations = {
    recently_used_contents: {
      type: "has_many",
      foreignKey: "image_container_id"
    }
  };
}
