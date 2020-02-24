import { buildEditableNode } from "../../components/NewPost/Node/BaseNode";
import { MovableViewPositionChange } from "../../components/NewPost/SnapContainerView";
import { hardAssert, log } from "../assert";
import { buildTextBlock } from "../buildPost";
import {
  PostFormat,
  PostLayout,
  TextBorderType,
  TextPostBlock,
  TextTemplate
} from "../enums";
import { BoundsRect } from "../Rect";
import { PostSchemaValue, PostSchema } from "./EVENT_TYPES";
import { isArray, isEmpty } from "lodash";
import { IS_DEVELOPMENT } from "../../../config";

export const action = (
  type: PostSchema.Action,
  callback: (schema: PostSchemaValue, ...args) => void
) => {
  return args => {
    return [type, schema => callback(schema, args)];
  };
};

export const selectBlock = (schema: PostSchemaValue, id: string) => {
  if (schema.inlineNodes.has(id)) {
    return schema.inlineNodes.get(id).block;
  }

  return schema.post.blocks.get(id);
};

export const selectNode = (schema: PostSchemaValue, id: string) => {
  return schema.inlineNodes.get(id);
};

export const deletePosition = (schema: PostSchemaValue, { blockId: id }) => {
  for (const row of schema.post.positions) {
    if (isArray(row)) {
      let index = row.indexOf(id);
      if (index > -1) {
        row.splice(index, 1);
      }

      if (isEmpty(row)) {
        schema.post.positions.splice(schema.post.positions.indexOf(row), 1);
      }
    }
  }
};

export const selectTextBlock = selectBlock as (
  schema: PostSchemaValue,
  id: string
) => TextPostBlock;

export const insertTextNode = (
  schema: PostSchemaValue,
  { x, y, id }: { x: number; y; number; id: string }
) => {
  const block = buildTextBlock({
    value: "",
    id,
    format: PostFormat.sticker,
    template: TextTemplate.basic,
    border: TextBorderType.stroke,
    layout: PostLayout.text,
    placeholder: " ",
    autoInserted: false
  });

  const editableNode = buildEditableNode({
    block,
    x,
    y
  });

  schema.inlineNodes.set(id, editableNode);
};

export const deleteBlock = (
  schema: PostSchemaValue,
  { blockId }: { blockId: string }
) => {
  if (schema.post.blocks.has(blockId)) {
    schema.post.blocks.delete(blockId);

    console.log("B");
    deletePosition(schema, { blockId });

    console.log("C");
  }

  console.log("B");
};

export const deleteNode = (
  schema: PostSchemaValue,
  { blockId }: { blockId: string }
) => {
  if (schema.inlineNodes.has(blockId)) {
    schema.inlineNodes.delete(blockId);
  }
};

export const updateBlockFrame = (
  schema: PostSchemaValue,
  { blockId, frame }: { blockId: string; frame: BoundsRect }
) => {
  const block = selectBlock(schema, blockId);

  block.frame = frame;
};

export const updateNodeTransform = (
  schema: PostSchemaValue,
  {
    blockId,
    x,
    y,
    scale,
    rotate
  }: {
    blockId: string;
    x: number;
    y: number;
    scale: number;
    rotate: number;
  }
) => {
  const node = selectNode(schema, blockId);

  hardAssert(node, "Can't update node that doesnt exist");

  node.position.x = x;
  node.position.y = y;
  node.position.scale = scale;
  node.position.rotate = rotate;
};

export const handleStopMovingNode = (
  schema: PostSchemaValue,
  data: MovableViewPositionChange
) => {
  const { x, y, scaleX: scale, rotate } = data.transform;
  const { uid: blockId, frame } = data;

  updateNodeTransform(schema, {
    blockId,
    x,
    y,
    scale,
    rotate
  });
  updateBlockFrame(schema, {
    blockId,
    frame
  });
};

export const onChangeBlockText = (
  schema: PostSchemaValue,
  { blockId, text }: { text: string; blockId: string }
) => {
  const node = selectNode(schema, blockId);
  const block = selectBlock(schema, blockId);
  const isEmptyText = text.trim().length === 0;

  if (node && !isEmptyText) {
    block.value = text;
  } else if (!node && !isEmptyText) {
    block.value = text;
  } else if (node && isEmptyText) {
    return deleteNode(schema, { blockId });
  }
};
