import { Dimensions } from "react-native";

const SCREEN_DIMENSIONS = Dimensions.get("window");

interface PostBlock {
  type: "text" | "image";
  value: any;
  config: {};
}

export type TextPostBlock = PostBlock & {
  type: "text";
  value: string;
  config: {
    backgroundColor: string;
    color: string;
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
    src: string;
    originalSrc: string;
  };
};

export type PostBlockType = TextPostBlock | ImagePostBlock;

export type NewPostType = {
  blocks: Array<PostBlockType>;
  height: number;
  width: number;
};

export const DEFAULT_TEXT_COLOR = "#f1f1f1";
export const DEFAULT_TEXT_BACKGROUND_COLOR = "#121212";

export const PLACEHOLDER_POST: NewPostType = {
  height: 652,
  width: SCREEN_DIMENSIONS.width,
  blocks: [
    {
      type: "image",
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
