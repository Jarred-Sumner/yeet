import nanoid from "nanoid/non-secure";
import { YeetImageContainer, YeetImageRect } from "./imageSearch";
import { scaleRectToHeight, scaleRectToWidth } from "./Rect";
import { SPACING } from "./styles";
import { flatten } from "lodash";

if (typeof globalThis.SCREEN_DIMENSIONS === "undefined") {
  var { SCREEN_DIMENSIONS, TOP_Y } = require("../../config");
} else {
  var { SCREEN_DIMENSIONS, TOP_Y } = globalThis;
}

export const POST_WIDTH = SCREEN_DIMENSIONS.width;

export const MAX_POST_HEIGHT = SCREEN_DIMENSIONS.height - TOP_Y - 100;
export type ExampleMap = { [id: string]: Array<string> };

const MAX_BLOCK_WIDTH = POST_WIDTH;
const MAX_BLOCK_HEIGHT = MAX_POST_HEIGHT;

const VERTICAL_IMAGE_DIMENSIONS = {
  width: MAX_BLOCK_WIDTH,
  height: MAX_BLOCK_HEIGHT / 3
};

const HORIZONTAL_IMAGE_DIMENSIONS = {
  width: MAX_BLOCK_WIDTH / 2,
  height: MAX_BLOCK_WIDTH
};

export enum PostFormat {
  post = "post",
  sticker = "sticker",
  comment = "comment"
}

export enum TextTemplate {
  basic = "basic",
  post = "post",
  bigWords = "bigWords",
  comment = "comment",
  comic = "comic",
  gary = "gary",
  terminal = "terminal",
  pickaxe = "pickaxe"
}

export enum PostLayout {
  horizontalTextMedia = "horizontalTextMedia",
  horizontalTextText = "horizontalTextText",
  verticalTextMedia = "verticalTextMedia",

  verticalMediaText = "verticalMediaText",
  horizontalMediaText = "horizontalMediaText",

  media = "media",
  text = "text",

  verticalMediaMedia = "verticalMediaMedia",
  horizontalMediaMedia = "horizontalMediaMedia"
}

export const minImageWidthByFormat = (format: PostFormat) => {
  if (format === PostFormat.sticker) {
    return SCREEN_DIMENSIONS.width * 0.75;
  } else {
    return POST_WIDTH;
  }
};

export type PostBlockID = string;

interface PostBlock {
  type: "text" | "image";
  required: boolean;
  format: PostFormat;
  layout: PostLayout;
  config: {};
  autoInserted: boolean;
  id: PostBlockID;
}

export enum TextBorderType {
  stroke = "stroke",
  solid = "solid",
  ellipse = "ellipse",
  hidden = "hidden",
  invert = "invert",
  highlight = "highlight"
}

export const DEFAULT_TEXT_BORDER_BY_TEMPLATE: {
  [key: TextTemplate]: TextBorderType;
} = {
  [TextTemplate.post]: TextBorderType.hidden,
  [TextTemplate.comment]: TextBorderType.highlight,
  [TextTemplate.basic]: TextBorderType.hidden,
  [TextTemplate.gary]: TextBorderType.hidden,
  [TextTemplate.comic]: TextBorderType.solid,
  [TextTemplate.terminal]: TextBorderType.hidden,
  [TextTemplate.pickaxe]: TextBorderType.hidden
};

export type TextPostBlock = PostBlock & {
  type: "text";
  value: string;
  config: {
    placeholder?: string;
    minHeight?: number;
    overrides: Object;
    border: TextBorderType;
    template: TextTemplate;
  };
};

export type ImagePostBlock = PostBlock & {
  type: "image";
  value: YeetImageContainer;
  config: {
    dimensions: YeetImageRect;
  };
};

export type PostBlockType = TextPostBlock | ImagePostBlock;

export type BlockMap = { [id: string]: PostBlockType };
export type BlockPositionList = Array<Array<PostBlockID>>;

export type NewPostType = {
  blocks: BlockMap;
  positions: BlockPositionList;
  height: number;
  backgroundColor?: string;
  width: number;
  format: PostFormat;
  layout: PostLayout;
};

export const DEFAULT_TEXT_COLOR = "#f1f1f1";
export const DEFAULT_TEXT_BACKGROUND_COLOR = "#121212";

export const DEFAULT_FORMAT = PostFormat.post;

export type ChangeBlockFunction = (change: PostBlockType) => void;

const DEFAULT_TEMPLATE_BY_FORMAT = {
  [PostFormat.comment]: TextTemplate.comment,
  [PostFormat.sticker]: TextTemplate.basic,
  [PostFormat.post]: TextTemplate.post
};

export const getDefaultTemplate = (template: string, format: PostFormat) => {
  return TextTemplate[template] || DEFAULT_TEMPLATE_BY_FORMAT[format];
};

export const getDefaultBorder = (border: string, template: TextBorderType) => {
  return TextBorderType[border] || DEFAULT_TEXT_BORDER_BY_TEMPLATE[template];
};

export const buildTextBlock = ({
  value,
  format,
  layout,
  border: _border,
  autoInserted,
  minHeight,
  placeholder,
  overrides = {},
  template: _template,
  id = null,
  required = true
}): TextPostBlock => {
  const template = getDefaultTemplate(_template, format);
  const border = getDefaultBorder(_border, template);

  return {
    type: "text",
    id: id ?? generateBlockId(),
    format,
    layout,
    value,
    autoInserted,
    required,
    config: {
      placeholder,
      minHeight,
      overrides,
      border,
      template
    }
  };
};

export const buildImageBlock = ({
  image,
  width,
  height,
  autoInserted,
  layout,
  required = true,
  placeholder = false,
  id: _id,
  format,
  dimensions = {}
}: {
  image: YeetImageContainer;
  layout: PostLayout;
  autoInserted: boolean;
  format: PostFormat;
  dimensions: Partial<YeetImageRect>;
}): ImagePostBlock => {
  const id = _id || generateBlockId();

  if (placeholder) {
    return {
      type: "image",
      id,
      layout,
      format,
      autoInserted,
      required,
      value: null,
      config: {
        dimensions: null
      }
    };
  }

  const { width: _width, height: _height, ..._dimensions } = dimensions;

  return {
    type: "image",
    id,
    format,
    layout,
    autoInserted,
    required,
    value: image,
    config: {
      dimensions: Object.assign(
        {},
        {
          width: width || _width,
          height: height || _height,
          x: 0,
          y: 0,
          maxX: width,
          maxY: height
        },
        _dimensions
      )
    }
  };
};

const scaleImageBlockToWidth = (
  width: number,
  block: ImagePostBlock
): ImagePostBlock => {
  return {
    ...block,
    config: {
      ...block.config,
      dimensions: scaleRectToWidth(width, block.config.dimensions)
    }
  };
};

const scaleImageBlockToHeight = (
  height: number,
  block: ImagePostBlock
): ImagePostBlock => {
  return {
    ...block,
    config: {
      ...block.config,
      dimensions: scaleRectToHeight(height, block.config.dimensions)
    }
  };
};

export const isPlaceholderImageBlock = (block: ImagePostBlock) => {
  return block.type === "image" && block.value === null;
};

export const presetsByFormat = {
  [PostFormat.comment]: {
    textTop: 0,
    paddingTop: 0,
    padding: 0,
    borderRadius: 4
  },
  [PostFormat.post]: {
    borderRadius: 8,
    paddingTop: 0,
    textTop: 0,
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.normal,
    backgroundColor: "#fff",
    color: "black"
  },
  [PostFormat.sticker]: {
    borderRadius: 8,
    paddingTop: 0,
    textTop: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "#000",
    color: "white"
  }
};

export enum FocusType {
  panning = 2,
  absolute = 1,
  static = 0
}

export const blocksForFormat = (
  format: PostFormat,
  layout: PostLayout,
  _blocks: BlockMap,
  positions: BlockPositionList
): Array<Array<PostBlockType>> => {
  let blocks = flatten(positions).map(position => _blocks[position]);

  if (format === PostFormat.comment) {
    return [
      [
        blocks.find(block => block.type === "text") ??
          buildTextBlock({
            value: "",
            placeholder: "",
            autoInserted: true,
            id: generateBlockId(),
            format: PostFormat.comment,
            template: TextTemplate.comment,
            layout
          })
      ]
    ];
  }

  switch (layout) {
    case PostLayout.horizontalMediaMedia: {
      blocks = blocks
        .filter(block => block.type === "image")
        .slice(0, 2)
        .map(block => {
          block.layout = layout;
          return block;
        });

      for (let i = blocks.length; i < 2; i++) {
        blocks.push(
          buildImageBlock({
            image: null,
            autoInserted: true,
            format,
            layout,
            dimensions: HORIZONTAL_IMAGE_DIMENSIONS
          })
        );
      }

      return [
        blocks.map(block => ({
          ...scaleImageBlockToWidth(HORIZONTAL_IMAGE_DIMENSIONS.width, block),
          layout
        }))
      ];
    }
    case PostLayout.verticalMediaMedia: {
      blocks = blocks
        .filter(block => block.type === "image")
        .slice(0, 2)
        .map(block => {
          return {
            ...block,
            layout,
            format
          };
        });

      let dimensions = VERTICAL_IMAGE_DIMENSIONS;

      if (blocks.length === 1) {
        dimensions = blocks[0].config.dimensions;

        if (dimensions.height < 200) {
          dimensions = {
            ...dimensions,
            height: Math.max(dimensions.height, 200)
          };
        }
      }

      for (let i = blocks.length; i < 2; i++) {
        blocks.push(
          buildImageBlock({
            image: null,
            autoInserted: true,
            format,
            layout,
            dimensions
          })
        );
      }

      return blocks.map(block => [
        scaleImageBlockToWidth(VERTICAL_IMAGE_DIMENSIONS.width, block)
      ]);
    }
    case PostLayout.verticalTextMedia: {
      let imageBlock = {
        ...(blocks.find(block => block.type === "image") ??
          buildImageBlock({
            image: null,
            autoInserted: true,
            format,
            layout,
            dimensions: VERTICAL_IMAGE_DIMENSIONS
          }))
      };

      let textBlock = {
        ...(blocks.find(block => block.type === "text") ??
          buildTextBlock({
            value: "",
            placeholder: "Tap to edit text",
            autoInserted: true,
            format,
            layout,
            template: TextTemplate.post
          }))
      };

      textBlock.config.minHeight = null;
      textBlock.format = format;
      textBlock.layout = layout;
      imageBlock.layout = layout;

      return [
        [textBlock],
        [scaleImageBlockToWidth(VERTICAL_IMAGE_DIMENSIONS.width, imageBlock)]
      ];
    }
    case PostLayout.verticalMediaText: {
      const imageBlock = scaleImageBlockToWidth(
        VERTICAL_IMAGE_DIMENSIONS.width,
        Object.assign(
          {},
          blocks.find(block => block.type === "image") ??
            buildImageBlock({
              image: null,
              autoInserted: true,
              format,
              layout,
              dimensions: VERTICAL_IMAGE_DIMENSIONS
            })
        )
      );

      const textBlock = Object.assign(
        {},
        blocks.find(block => block.type === "text") ??
          buildTextBlock({
            value: "",
            placeholder: "Tap to edit text",
            autoInserted: true,
            format,
            layout,

            template: TextTemplate.post
          })
      );

      textBlock.format = format;
      textBlock.layout = layout;
      imageBlock.layout = layout;

      textBlock.config.minHeight = null;

      return [[imageBlock], [textBlock]];
    }
    case PostLayout.horizontalMediaText: {
      const imageBlock = scaleImageBlockToWidth(
        HORIZONTAL_IMAGE_DIMENSIONS.width,
        Object.assign(
          {},
          blocks.find(block => block.type === "image") ??
            buildImageBlock({
              image: null,
              autoInserted: true,
              format,
              layout,
              dimensions: {
                width: MAX_BLOCK_WIDTH / 2,
                height: MAX_BLOCK_WIDTH
              }
            })
        )
      );

      const textBlock: TextPostBlock =
        blocks.find(block => block.type === "text") ??
        buildTextBlock({
          value: "",
          placeholder: "Tap to edit text",
          autoInserted: true,
          format,
          layout,

          template: TextTemplate.post
        });

      textBlock.config.minHeight = imageBlock.config.dimensions.maxY;
      textBlock.format = format;
      textBlock.layout = layout;
      imageBlock.layout = layout;

      return [[imageBlock, textBlock]];
    }
    case PostLayout.horizontaTextText: {
      const textBlock: TextPostBlock =
        blocks.find(block => block.type === "text") ??
        buildTextBlock({
          value: "",
          placeholder: "Tap to edit text",
          autoInserted: true,
          format,
          layout,
          template: TextTemplate.post
        });

      textBlock.config.minHeight = imageBlock.config.dimensions.maxY;
      imageBlock.layout = layout;

      return [imageBlock, textBlock];
    }
    case PostLayout.horizontalTextMedia: {
      const imageBlock: ImagePostBlock = scaleImageBlockToWidth(
        HORIZONTAL_IMAGE_DIMENSIONS.width,
        blocks.find(block => block.type === "image") ??
          buildImageBlock({
            autoInserted: true,

            image: null,
            format,
            layout,
            dimensions: {
              width: MAX_BLOCK_WIDTH / 2,
              height: MAX_BLOCK_WIDTH
            }
          })
      );

      const textBlock: TextPostBlock =
        blocks.find(block => block.type === "text") ??
        buildTextBlock({
          value: "",
          placeholder: "Tap to edit text",
          autoInserted: true,
          overrides: block.config.overrides,
          format,
          layout,
          template: TextTemplate.post
        });

      textBlock.config.minHeight = imageBlock.config.dimensions.height;
      textBlock.layout = PostLayout.horizontalTextMedia;
      imageBlock.layout = layout;

      return [[textBlock, imageBlock]];
    }
    case PostLayout.horizontalMediaMedia: {
      const firstImageBlock =
        blocks.find(block => block.type === "image") ??
        buildImageBlock({
          image: null,
          autoInserted: true,
          format,
          layout,
          dimensions: HORIZONTAL_IMAGE_DIMENSIONS
        });

      firstImageBlock.layout = layout;

      const secondImageBlock =
        blocks.filter(block => block.type === "image")[1] ??
        buildImageBlock({
          image: null,
          autoInserted: true,

          format,
          layout,
          dimensions: HORIZONTAL_IMAGE_DIMENSIONS
        });

      secondImageBlock.layout = layout;

      return [firstImageBlock, secondImageBlock].map(block => [
        scaleImageBlockToWidth(HORIZONTAL_IMAGE_DIMENSIONS.width, block)
      ]);
    }
    case PostLayout.media: {
      return [
        [
          scaleImageBlockToWidth(
            POST_WIDTH,
            blocks.find(block => block.type === "image") ??
              buildImageBlock({
                image: null,
                autoInserted: true,
                overrides: block.config.overrides,
                format,
                layout,
                dimensions: VERTICAL_IMAGE_DIMENSIONS
              })
          )
        ]
      ];
    }
    case PostLayout.text: {
      return [
        [
          blocks.find(block => block.type === "text") ??
            buildTextBlock({
              value: "",
              placeholder: "Tap to edit text",
              autoInserted: true,
              overrides: block.config.overrides,
              format,
              layout,
              template: TextTemplate.post
            })
        ]
      ];
    }
  }
};

export const layoutBlocksInPost = (
  format: PostFormat,
  layout: PostLayout,
  __blocks: BlockMap,
  __positions: BlockPositionList
): [BlockMap, BlockPositionList] => {
  const blocks = {};
  const _blocks = blocksForFormat(format, layout, __blocks, __positions);

  const positions = _blocks.map(row =>
    row.map(block => {
      blocks[block.id] = block;
      return block.id;
    })
  );

  return [blocks, positions];
};

export const isFixedSizeBlock = (block: PostBlock) => {
  if (block.type === "image") {
    return true;
  }

  return typeof block?.config?.overrides?.maxWidth === "number";
};

export const buildPost = ({
  format,
  layout,
  blocks,
  positions,
  width,
  backgroundColor,
  height
}: {
  format: PostFormat;
  layout: PostLayout;
  blocks: BlockMap;
  positions: BlockPositionList;
  width: number;
  height: number;
  backgroundColor?: string;
}): NewPostType => {
  return {
    format,
    layout,
    backgroundColor,
    positions,
    width,
    blocks,
    height
  };
};

export const generateBlockId = nanoid;

export const DEFAULT_POST_FORMAT = PostFormat.post;
