import { PostSchemaValue } from "../EVENT_TYPES";
import { selectBlock, selectTextBlock } from "../actions";
import { TextTemplate, TextPostBlock } from "../../enums";
import { hardAssert } from "../../assert";

const ensureOverrides = (block: TextPostBlock) => {
  if (block?.config?.overrides) {
    return;
  }

  block.config.overrides = {};
};

export const updateTextAlign = (
  schema: PostSchemaValue,
  { textAlign, blockId }: { textAlign: CanvasTextAlign; blockId: string }
) => {
  const block = selectTextBlock(schema, blockId);
  hardAssert(block, "Block must exist");

  ensureOverrides(block);
  block.config.overrides.textAlign = textAlign;
};

export const updateBlockColor = (
  schema: PostSchemaValue,
  {
    color,
    backgroundColor,
    blockId
  }: { color: string; blockId: string; backgroundColor?: string }
) => {
  const block = selectTextBlock(schema, blockId);

  hardAssert(block, `Block must exist: ${blockId}`);

  if (backgroundColor || color) {
    ensureOverrides(block);
  }

  if (backgroundColor) {
    block.config.overrides.backgroundColor = backgroundColor;
  }

  if (color) {
    block.config.overrides.color = color;
  }
};

export const updateTemplate = (
  schema: PostSchemaValue,
  { template, blockId }: { blockId: string; template: TextTemplate }
) => {
  const block = selectTextBlock(schema, blockId);
  hardAssert(block, "Block must exist");
  block.config.template = template;
};

export const updateBorderType = (
  schema: PostSchemaValue,
  { borderType, blockId }: { blockId: string; borderType: TextBorderType }
) => {
  const block = selectTextBlock(schema, blockId);
  hardAssert(block, "Block must exist");
  block.config.border = borderType;
};
