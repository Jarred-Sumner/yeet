import { Dimensions } from "react-native";
import nanoid from "nanoid/non-secure";
import { SPACING, COLORS } from "../../lib/styles";

export const CAROUSEL_HEIGHT = 60;

const SCREEN_DIMENSIONS = Dimensions.get("window");

export enum PostFormat {
  screenshot = "screenshot",
  caption = "caption",
  vent = "vent",
  comic = "comic",
  blargh = "blargh"
}

interface PostBlock {
  type: "text" | "image";
  value: any;
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
  value: {
    intrinsicWidth: number;
    intrinsicHeight: number;
    width: number;
    height: number;
    x: number;
    y: number;
    src: string | null;
    originalSrc: string | null;
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

export const PLACEHOLDER_POST: NewPostType = {
  height: 600,
  width: SCREEN_DIMENSIONS.width,
  format: DEFAULT_FORMAT,
  blocks: [
    {
      type: "image",
      id: nanoid(),
      format: DEFAULT_FORMAT,
      autoInserted: true,
      value: {
        intrinsicWidth: 0,
        intrinsicHeight: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        src: "",
        originalSrc: ""
      },
      config: {}
    }
  ]
};

export type ChangeBlockFunction = (change: PostBlockType) => void;

export const buildTextBlock = ({
  value,
  format,
  autoInserted,
  placeholder
}): TextPostBlock => {
  return {
    type: "text",
    id: nanoid(),
    format,
    value,
    autoInserted,
    config: {
      placeholder,
      overrides: {}
    }
  };
};

export const buildImageBlock = ({
  image,
  croppedPhoto,
  displaySize,
  autoInserted,
  format
}): ImagePostBlock => {
  return {
    type: "image",
    id: nanoid(),
    format,
    autoInserted,
    value: {
      intrinsicWidth: image.width,
      intrinsicHeight: image.height,
      ...displaySize,
      x: 0,
      y: 0,
      src: croppedPhoto.source,
      originalSrc: image.uri,
      uri: croppedPhoto.uri
    },
    config: {}
  };
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
    padding: 0
  }
};

export enum FocusBlockType {
  absolute = 0,
  static = 1
}

const blocksForFormat = (
  format: PostFormat,
  _blocks: Array<PostBlockType>
): Array<PostBlockType> => {
  const blocks = _blocks.map(block => ({
    ...block,
    format
  }));

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
