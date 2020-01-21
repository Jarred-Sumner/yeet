import {
  flatMap,
  flatten,
  isArray,
  isEmpty,
  set,
  uniqBy,
  sortBy,
  cloneDeep
} from "lodash";
import nanoid from "nanoid/non-secure";
import { textInputPresets } from "../components/NewPost/Text/Presets";
import {
  BlockMap,
  BlockPositionList,
  ImagePostBlock,
  NewPostType,
  PostBlock,
  PostBlockType,
  PostFormat,
  PostLayout,
  SnapDirection,
  SnapPoint,
  TextBorderType,
  TextPostBlock,
  TextTemplate
} from "./enums";
import { YeetImageContainer, YeetImageRect } from "./imageSearch";
import {
  BoundsRect,
  DimensionsRect,
  scaleRectAspectFill,
  scaleRectAspectFit,
  scaleRectToHeight,
  scaleRectToWidth
} from "./Rect";
import { Rectangle } from "./Rectangle";
import { SPACING } from "./styles";

export const generateBlockId = nanoid;

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

export const minImageWidthByFormat = (format: PostFormat) => {
  if (format === PostFormat.sticker) {
    return SCREEN_DIMENSIONS.width * 0.75;
  } else {
    return POST_WIDTH;
  }
};

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
  frame = null,
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
    frame,
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
  frame = null,
  dimensions = {}
}: {
  image: YeetImageContainer;
  layout: PostLayout;
  autoInserted: boolean;
  frame: BoundsRect | null;
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
      frame,
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
    frame,
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
  const dimensions = scaleRectToWidth(width, block.config.dimensions);

  return {
    ...block,
    frame: {
      ...(block.frame ?? { x: 0, y: 0 }),
      width: dimensions.width,
      height: dimensions.height
    },
    config: {
      ...block.config,
      dimensions
    }
  };
};

const scaleImageBlockToFill = (
  bounds: DimensionsRect,
  block: ImagePostBlock
): ImagePostBlock => {
  return {
    ...block,
    config: {
      ...block.config,
      dimensions: scaleRectAspectFill(bounds, block.config.dimensions)
    }
  };
};

const scaleImageBlockToFit = (
  bounds: DimensionsRect,
  block: ImagePostBlock
): ImagePostBlock => {
  return {
    ...block,
    config: {
      ...block.config,
      dimensions: scaleRectAspectFit(bounds, block.config.dimensions)
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
isPlaceholderImageBlock;
const isImageBlock = (block: PostBlock) => block?.type === "image";
export const isTextBlock = (block: PostBlock) => block?.type === "text";
export const isEmptyTextBlock = (block: TextPostBlock) =>
  isTextBlock(block) && isEmpty(block.value);

const isImageBlockWithImage = (block: PostBlock) =>
  isImageBlock(block) && !isPlaceholderImageBlock(block);

export const blocksForFormat = (
  format: PostFormat,
  layout: PostLayout,
  _blocks: BlockMap,
  _positions: BlockPositionList
): Array<Array<PostBlockType>> => {
  const blocks = flatten(
    _positions.map(position => {
      if (typeof position === "string") {
        return _blocks[position];
      } else if (isArray(position)) {
        return position.map(_id => _blocks[_id]);
      } else {
        return null;
      }
    })
  ).filter(Boolean);

  //scaleImageBlockToWidth(VERTICAL_IMAGE_DIMENSIONS.width, imageBlock)
  // scaleImageBlockToWidth(
  //   HORIZONTAL_IMAGE_DIMENSIONS.width,
  const ensureTextBlock = (blocks: Array<PostBlock>, layout: PostLayout) => {
    let existingTextBlock = blocks.find(isTextBlock);

    if (existingTextBlock) {
      existingTextBlock = {
        ...existingTextBlock,
        format: PostFormat.post,

        layout
      };
      return existingTextBlock;
    }

    return buildTextBlock({
      value: "",
      placeholder: "Tap to edit text",
      format: PostFormat.post,
      layout,
      frame: null,
      template: TextTemplate.post,
      border: TextBorderType.hidden
    });
  };

  const ensureImageBlock = (
    blocks: Array<PostBlock>,
    layout: PostLayout,
    dimensions: DimensionsRect,
    altDimensions: DimensionsRect
  ) => {
    let existingImageBlock = blocks.find(isImageBlockWithImage);

    if (existingImageBlock) {
      existingImageBlock = {
        ...existingImageBlock,
        format: PostFormat.post,
        layout
      };

      const isHeightSensitive = dimensions.height > altDimensions.height;
      const isWidthSensitive = dimensions.width > altDimensions.width;

      if (isWidthSensitive) {
        return scaleImageBlockToWidth(dimensions.width, existingImageBlock);
      } else if (isHeightSensitive) {
        return scaleImageBlockToWidth(dimensions.width, existingImageBlock);
      }

      const _a = scaleImageBlockToFit(dimensions, existingImageBlock);
      const _b = scaleImageBlockToFit(altDimensions, existingImageBlock);
      const a = scaleImageBlockToFill(dimensions, existingImageBlock);
      const b = scaleImageBlockToFill(altDimensions, existingImageBlock);

      if (
        isWidthSensitive &&
        a.config.dimensions.width > b.config.dimensions.width
      ) {
        return b;
      } else if (
        isWidthSensitive &&
        b.config.dimensions.width > a.config.dimensions.width
      ) {
        return a;
      } else if (
        isHeightSensitive &&
        a.config.dimensions.height > b.config.dimensions.height
      ) {
        return a;
      } else if (
        isHeightSensitive &&
        b.config.dimensions.height > a.config.dimensions.height
      ) {
        return b;
      }
    }

    return buildImageBlock({
      image: null,
      autoInserted: true,
      layout,
      required: true,
      format: PostFormat.post,
      width: dimensions.width,
      height: dimensions.height
    });
  };

  const without = (id: string, blocks) => {
    return blocks.filter(block => block.id !== id);
  };

  switch (layout) {
    case PostLayout.horizontalTextMedia: {
      return [
        [
          ensureTextBlock(blocks, layout),
          ensureImageBlock(
            blocks,
            layout,
            HORIZONTAL_IMAGE_DIMENSIONS,
            VERTICAL_IMAGE_DIMENSIONS
          )
        ]
      ];
    }
    case PostLayout.horizontalTextText: {
      const firstTextBlock = ensureTextBlock(blocks, layout);
      return [
        [
          [
            firstTextBlock,
            ensureTextBlock(without(firstTextBlock.id, blocks), layout)
          ]
        ]
      ];
    }
    case PostLayout.verticalTextMedia: {
      return [
        [ensureTextBlock(blocks, layout)],
        [
          ensureImageBlock(
            blocks,
            layout,
            VERTICAL_IMAGE_DIMENSIONS,
            HORIZONTAL_IMAGE_DIMENSIONS
          )
        ]
      ];
    }
    case PostLayout.verticalMediaText: {
      return [
        [
          ensureImageBlock(
            blocks,
            layout,
            VERTICAL_IMAGE_DIMENSIONS,
            HORIZONTAL_IMAGE_DIMENSIONS
          )
        ],
        [ensureTextBlock(blocks, layout)]
      ];
    }
    case PostLayout.horizontalMediaText: {
      return [
        [
          ensureImageBlock(
            blocks,
            layout,
            HORIZONTAL_IMAGE_DIMENSIONS,
            VERTICAL_IMAGE_DIMENSIONS
          ),
          ensureTextBlock(blocks, layout)
        ]
      ];
    }
    case PostLayout.media: {
      return [
        [
          ensureImageBlock(
            blocks,
            layout,
            HORIZONTAL_IMAGE_DIMENSIONS,
            VERTICAL_IMAGE_DIMENSIONS
          )
        ]
      ];
    }
    case PostLayout.text: {
      return [[ensureTextBlock(blocks, layout)]];
    }
    case PostLayout.verticalMediaMedia: {
      const firstImageBlock = ensureImageBlock(
        blocks,
        layout,
        VERTICAL_IMAGE_DIMENSIONS,
        HORIZONTAL_IMAGE_DIMENSIONS
      );

      return [
        [firstImageBlock],
        [
          ensureImageBlock(
            without(firstImageBlock.id, blocks),
            layout,
            VERTICAL_IMAGE_DIMENSIONS
          )
        ]
      ];
    }
    case PostLayout.horizontalMediaMedia: {
      const firstImageBlock = ensureImageBlock(
        blocks,
        layout,
        HORIZONTAL_IMAGE_DIMENSIONS,
        VERTICAL_IMAGE_DIMENSIONS
      );

      return [
        [
          firstImageBlock,
          ensureImageBlock(
            without(firstImageBlock.id, blocks),
            layout,
            HORIZONTAL_IMAGE_DIMENSIONS,
            VERTICAL_IMAGE_DIMENSIONS
          )
        ]
      ];
    }
    default:
      break;
  }
};

export const snapBlock = (
  to: SnapDirection,
  at: PostBlock,
  _block: PostBlock,
  blocks: BlockMap,
  __positions: BlockPositionList
) => {
  if (!_block) {
    return { blocks, positions: __positions };
  }

  let block = {
    ..._block
  };

  let positions = [...__positions];

  __positions.forEach((row, index) => {
    if (row.indexOf(block.id) > -1) {
      let _row = [...row];
      _row.splice(row.indexOf(block.id), 1);

      if (_row.length === 0) {
        positions.splice(index, 1);
      } else {
        positions.splice(index, 1, _row);
      }
    }
  });

  let rowIndex = positions.findIndex(row => {
    return row.includes(at.id);
  });

  if (isTextBlock(block)) {
    const textAlign = getTextBlockAlign(block);
    block.format = PostFormat.post;
    block.layout = PostLayout.verticalMediaText;
    set(block, "config.overrides.maxWidth", undefined);
    set(block, "config.overrides.numberOfLines", undefined);
    if (textAlign !== getTextBlockAlign(block)) {
      set(block, "config.overrides.textAlign", textAlign);
    }
  }

  if (to === SnapDirection.bottom || to === SnapDirection.top) {
    let width = POST_WIDTH;
    let frame = {
      x: 0,
      y: 0,
      width,
      height: block.frame.height
    };

    block.frame.x = 0;
    if (isImageBlockWithImage(block)) {
      block = scaleImageBlockToWidth(width, block);
      block.layout = PostLayout.verticalTextMedia;
      frame = block.frame;
    } else {
      block.frame = frame;
    }

    if (rowIndex > -1 && to === SnapDirection.bottom) {
      positions.splice(rowIndex, 1, ...[positions[rowIndex], [block.id]]);
    } else if (rowIndex > -1 && to === SnapDirection.top) {
      positions.splice(rowIndex, 1, ...[[block.id], positions[rowIndex]]);
    } else if (rowIndex === -1 && to === SnapDirection.bottom) {
      positions.push([block.id]);
    } else if (rowIndex === -1 && to === SnapDirection.top) {
      positions.unshift([block.id]);
    }

    frame.y =
      to === SnapDirection.top
        ? at.frame.y - block.frame.height
        : at.frame.y + at.frame.height;

    return {
      blocks: { ...blocks, [block.id]: block },
      positions
    };
  } else if (to === SnapDirection.left || to === SnapDirection.right) {
    let frame = {
      x: 0,
      y: 0,
      width: POST_WIDTH,
      height: block.frame.height
    };

    let atColumnIndex = positions[rowIndex]?.indexOf(at.id);

    let _positions = [...positions];

    let row = [..._positions[rowIndex]];

    let maxHeight = block.frame.height;
    row.forEach(column => {
      const _block = blocks[column];

      maxHeight = Math.max(_block.frame?.height ?? 0, maxHeight);
    });

    let chosenIndex =
      to === SnapDirection.left ? atColumnIndex - 1 : atColumnIndex + 1;

    let width = POST_WIDTH / (row.length + 1);
    let y = at.frame.y;
    let height = maxHeight;

    if (chosenIndex >= row.length - 1) {
      row.push(block.id);
    } else if (chosenIndex <= 0) {
      row = [block.id].concat(row);
    } else {
      row.splice(chosenIndex, 1, block.id, row[chosenIndex]);
    }

    let x = Math.min(Math.max(width * chosenIndex, 0), POST_WIDTH);

    if (isImageBlockWithImage(block)) {
      block = scaleImageBlockToWidth(width, block);
      block.layout = PostLayout.horizontalMediaText;
      block.frame.x = x;
      block.frame.y = y;
      if (block.frame.height < maxHeight) {
        block.frame.y += (maxHeight - block.frame.height) / 2;
      }
    } else {
      block.frame = {
        x,
        y,
        width,
        height
      };
    }

    let _blocks = { ...blocks, [block.id]: block };

    row.forEach(blockId => {
      let _block = { ...blocks[blockId] };
      if (isImageBlock(_block)) {
        _block = scaleImageBlockToWidth(width, _block);

        _block.layout = PostLayout.horizontalMediaText;
        _blocks[blockId] = _block;
      }
    });

    _positions.splice(rowIndex, 1, row);

    return {
      blocks: _blocks,
      positions: _positions
    };
  } else {
    return { blocks, positions };
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

export const isFixedSizeBlock = (block: PostBlock | null = null) => {
  if (!block) {
    return false;
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

export const getTextBlockAlign = (block: TextPostBlock): CanvasTextAlign => {
  if (block.type === "image") {
    return "left";
  }

  const { template, overrides = {}, border } = block.config;

  if (template === TextTemplate.bigWords || template === TextTemplate.comic) {
    return "center";
  }

  return (
    overrides?.textAlign ||
    textInputPresets[block.config.template].textAlign ||
    {
      [PostFormat.post]: "left",
      [PostFormat.sticker]: "center",
      [PostFormat.comment]: "left"
    }[block.format]
  );
};

export const getPositionsKey = positions =>
  positions.map(row => `|${row.join("|")}|`).join("\n");

export const getSnapPoints = (
  at: PostBlockType,
  block: PostBlockType,
  blocks: BlockMap,
  positions: BlockPositionList,
  size: number = 32
): Array<SnapPoint> => {
  const frame = at.frame as BoundsRect;
  if (!frame) {
    return [];
  }

  if (
    Object.values(blocks).length === 0 ||
    (Object.values(blocks).length === 1 && !!blocks[block.id])
  ) {
    return [];
  }

  const rect = Rectangle.fromFrame(frame);
  if (rect.isEmpty()) {
    return [];
  }

  const leftValue = snapBlock(SnapDirection.left, at, block, blocks, [
    ...positions
  ]);
  const left: SnapPoint = {
    direction: SnapDirection.left,
    key: getPositionsKey(leftValue.positions),
    value: leftValue,
    indicator: {
      x: Math.max(rect.left, 0) - size,
      y: rect.center().y
    },
    background: leftValue.blocks[block.id].frame
  };

  const rightValue = snapBlock(SnapDirection.right, at, block, blocks, [
    ...positions
  ]);

  const right: SnapPoint = {
    direction: SnapDirection.right,
    key: getPositionsKey(rightValue.positions),
    value: rightValue,
    indicator: {
      x: rect.right,
      y: rect.center().y
    },
    background: rightValue.blocks[block.id].frame
  };

  const bottomValue = snapBlock(SnapDirection.bottom, at, block, blocks, [
    ...positions
  ]);

  const bottom: SnapPoint = {
    direction: SnapDirection.bottom,
    key: getPositionsKey(bottomValue.positions),
    value: bottomValue,
    indicator: {
      x: rect.center().x,
      y: rect.bottom
    },
    background: bottomValue.blocks[block.id].frame
  };

  const topValue = snapBlock(SnapDirection.top, at, block, blocks, [
    ...positions
  ]);
  const top: SnapPoint = {
    direction: SnapDirection.top,
    key: getPositionsKey(topValue.positions),
    value: topValue,
    indicator: {
      x: rect.center().x,
      y: rect.top
    },
    background: topValue.blocks[block.id].frame
  };

  return [top, left, bottom, right];
};

export const getAllSnapPoints = (
  block: PostBlockType,
  blocks: BlockMap,
  positions: BlockPositionList
): Array<SnapPoint> => {
  let _points = {};

  const snapPoints = flatMap(Object.values(blocks), at =>
    getSnapPoints(cloneDeep(at), cloneDeep(block), cloneDeep(blocks), [
      ...positions
    ])
  );

  const mergePoints = (current: SnapPoint, newPoint: SnapPoint): SnapPoint => {
    const _currentR = Rectangle.fromFrame(current.background);
    const _pointR = Rectangle.fromFrame(newPoint.background);

    let background = _currentR.expandToContain(_pointR);
    current.background = background.frame;
    current.background.x = Math.max(current.background.x, 0);
    // current.background.y = Math.max(current.background.y, 0);
    // if (
    //   (current.direction === SnapDirection.left &&
    //     newPoint.direction === SnapDirection.right) ||
    //   (current.direction === SnapDirection.right &&
    //     newPoint.direction === SnapDirection.left)
    // ) {
    //   if (background.x > _currentR.x) {

    //   }
    // }

    return current;
  };

  for (let point of snapPoints) {
    if (_points[point.key]) {
      _points[point.key] = mergePoints(_points[point.key], point);
    } else {
      _points[point.key] = point;
    }
  }

  return Object.values(_points);
};
