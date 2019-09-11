import { Dimensions } from "react-native";
import nanoid from "nanoid/non-secure";
import { SPACING, COLORS } from "../../lib/styles";
import { getInset } from "react-native-safe-area-view";
import { YeetImageContainer, YeetImageRect } from "../../lib/imageSearch";

const TOP_Y = getInset("top");
export const CAROUSEL_HEIGHT = 60;

const SCREEN_DIMENSIONS = Dimensions.get("window");
export const POST_WIDTH = SCREEN_DIMENSIONS.width;

export const MAX_POST_HEIGHT =
  SCREEN_DIMENSIONS.height - TOP_Y - CAROUSEL_HEIGHT;

export enum PostFormat {
  screenshot = "screenshot",
  caption = "caption",
  sticker = "sticker",
  vent = "vent",
  comic = "comic",
  blargh = "blargh"
}

export const minImageWidthByFormat = (format: PostFormat) => {
  if (format === PostFormat.sticker) {
    return 100;
  } else {
    return POST_WIDTH;
  }
};

interface PostBlock {
  type: "text" | "image";
  required: boolean;
  format: PostFormat;
  config: {};
  autoInserted: boolean;
  id: string;
}

export type TextPostBlock = PostBlock & {
  type: "text";
  value: string;
  config: {
    placeholder?: string;
    overrides: Object;
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

export type NewPostType = {
  blocks: Array<PostBlockType>;
  height: number;
  width: number;
  format: PostFormat;
};

export const DEFAULT_TEXT_COLOR = "#f1f1f1";
export const DEFAULT_TEXT_BACKGROUND_COLOR = "#121212";

export const DEFAULT_FORMAT = PostFormat.caption;

export type ChangeBlockFunction = (change: PostBlockType) => void;

export const buildTextBlock = ({
  value,
  format,
  autoInserted,
  placeholder,
  required = true
}): TextPostBlock => {
  return {
    type: "text",
    id: nanoid(),
    format,
    value,
    autoInserted,
    required,
    config: {
      placeholder,

      overrides: {}
    }
  };
};

export const buildImageBlock = ({
  image,
  width,
  height,
  autoInserted,
  required = true,
  placeholder = false,
  id: _id,
  format,
  dimensions = {}
}: {
  image: YeetImageContainer;
}): ImagePostBlock => {
  const id = _id || nanoid();

  if (placeholder) {
    return {
      type: "image",
      id,
      format,
      autoInserted,
      required,
      value: null,
      config: {
        dimensions: null
      }
    };
  }

  return {
    type: "image",
    id,
    format,
    autoInserted,
    required,
    value: image,
    config: {
      dimensions: Object.assign(
        {},
        {
          width,
          height,
          x: 0,
          y: 0,
          maxX: width,
          maxY: height
        },
        dimensions
      )
    }
  };
};

export const isPlaceholderImageBlock = (block: ImagePostBlock) => {
  return block.type === "image" && block.value === null;
};

export const presetsByFormat = {
  [PostFormat.caption]: {
    borderRadius: 8,
    paddingTop: 48,
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.normal,
    backgroundColor: "#000",
    color: "white"
  },
  [PostFormat.screenshot]: {
    backgroundColor: "#fff",
    borderRadius: 0,
    paddingTop: 0,
    padding: 0
  }
};

export enum FocusType {
  panning = 2,
  absolute = 1,
  static = 0
}

const blocksForFormat = (
  format: PostFormat,
  _blocks: Array<PostBlockType>
): Array<PostBlockType> => {
  const blocks = [..._blocks];

  if (format === PostFormat.screenshot) {
    return blocks.filter(
      ({ type, autoInserted }) => !(type === "text" && autoInserted)
    );
  } else if (format === PostFormat.caption) {
    const firstBlock = blocks[0];

    if (!firstBlock || firstBlock.type === "image") {
      blocks.unshift(
        buildTextBlock({
          value: "",
          placeholder: "Enter a title",
          autoInserted: true,
          format
        })
      );
    }

    return blocks;
  } else {
    return blocks;
  }
};

export const buildPost = ({
  format,
  blocks: _blocks,
  width,
  height
}: {
  format: PostFormat;
  blocks: Array<PostBlockType>;
  width: number;
  height: number;
}): NewPostType => {
  const presets = presetsByFormat[format];
  const blocks = blocksForFormat(format, _blocks);

  if (format === PostFormat.caption) {
    return {
      format,
      width,
      height,
      backgroundColor: presets.backgroundColor,
      blocks
    };
  } else if (format === PostFormat.screenshot) {
    return {
      format,
      backgroundColor: presets.backgroundColor,
      blocks
    };
  } else {
    throw Error(`Unimplemented format ${format}`);
  }
};
