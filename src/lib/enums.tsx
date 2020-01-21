import { BoundsRect, DimensionsRect } from "./Rect";

export type PostBlockID = string;

export interface PostBlock {
  type: "text" | "image";
  required: boolean;
  format: PostFormat;
  layout: PostLayout;
  config: {};
  autoInserted: boolean;
  id: PostBlockID;
  frame: BoundsRect | null;
}

export enum SnapDirection {
  none = 0,
  left = 1,
  right = 2,
  bottom = 3,
  top = 4
}

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

export enum TextBorderType {
  stroke = "stroke",
  solid = "solid",
  ellipse = "ellipse",
  hidden = "hidden",
  invert = "invert",
  highlight = "highlight"
}

export type TextPostBlock = PostBlock & {
  type: "text";
  value: string;
  config: {
    placeholder?: string;
    minHeight?: number;
    border: TextBorderType;
    template: TextTemplate;
    overrides: Partial<{
      numberOfLines: number;
      color: string;
      textColor: string;
      maxWidth: number;
      backgroundColor: string;
      strokeColor: string;
      fontSize: number;
    }>;
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

export const DEFAULT_POST_FORMAT = PostFormat.post;

export enum SnapBehavior {
  none = 0,
  top = 1,
  middle = 2,
  bottom = 3
}

export type SnapPoint = {
  direction: SnapDirection;
  key: string;
  value: {
    positions: BlockPositionList;
    blocks: BlockMap;
  };
  indicator: { x: number; y: number };
  background: BoundsRect;
};
