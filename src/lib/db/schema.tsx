import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: "recently_used_contents",
      columns: [
        { name: "uid", type: "string", isIndexed: true },
        { name: "last_used_at", type: "number", isIndexed: true },
        { name: "username", type: "string", isOptional: true },
        { name: "profile_id", type: "string" },
        { name: "blocks", type: "string", isOptional: true },
        { name: "asset", type: "string", isOptional: true },
        { name: "nodes", type: "string", isOptional: true },
        { name: "width", type: "number", isOptional: true },
        { name: "height", type: "number", isOptional: true },
        { name: "x", type: "number", isOptional: true },
        { name: "y", type: "number", isOptional: true },
        { name: "examples", type: "string", isOptional: true },
        { name: "type", type: "string", isOptional: false },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "image_uri", type: "string" },
        { name: "image_width", type: "number", isOptional: true },
        { name: "image_height", type: "number", isOptional: true },
        { name: "image_pixel_ratio", type: "number", isOptional: false },
        { name: "image_duration", type: "number", isOptional: true },
        { name: "image_mime_type", type: "string", isOptional: true },
        { name: "preview_uri", type: "string", isOptional: true },
        { name: "preview_width", type: "number", isOptional: true },
        { name: "preview_height", type: "number", isOptional: true },
        { name: "preview_pixel_ratio", type: "number", isOptional: false },
        { name: "preview_duration", type: "number", isOptional: true },
        { name: "preview_mime_type", type: "string", isOptional: true },
        { name: "source_type", type: "string", isOptional: true }
      ]
    })
  ]
});
