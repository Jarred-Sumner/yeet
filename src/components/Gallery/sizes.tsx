import { SCREEN_DIMENSIONS } from "../../../config";
import {
  COLUMN_COUNT,
  COLUMN_GAP,
  GIF_COLUMN_COUNT,
  MEMES_COLUMN_COUNT
} from "./COLUMN_COUNT";
import { PixelRatio } from "react-native";
import { SPACING } from "../../lib/styles";

export const SQUARE_ITEM_WIDTH = Math.floor(
  SCREEN_DIMENSIONS.width / COLUMN_COUNT - COLUMN_GAP * COLUMN_COUNT
);
export const SQUARE_ITEM_HEIGHT = SQUARE_ITEM_WIDTH;
export const VERTICAL_ITEM_HEIGHT = SQUARE_ITEM_WIDTH * (16 / 9);
export const VERTICAL_ITEM_WIDTH = SQUARE_ITEM_WIDTH;
export const HORIZONTAL_ITEM_HEIGHT = 200;
export const HORIZONTAL_ITEM_WIDTH =
  SCREEN_DIMENSIONS.width / GIF_COLUMN_COUNT - COLUMN_GAP * GIF_COLUMN_COUNT;
export const MEMES_ITEM_WIDTH = Math.floor(
  SCREEN_DIMENSIONS.width / MEMES_COLUMN_COUNT - COLUMN_GAP * MEMES_COLUMN_COUNT
);
export const MEMES_ITEM_HEIGHT = Math.floor(
  SCREEN_DIMENSIONS.width / MEMES_COLUMN_COUNT - COLUMN_GAP * MEMES_COLUMN_COUNT
);

export const INSET_SQUARE_INSET = SPACING.double;
export const INSET_SQUARE_ITEM_WIDTH = Math.floor(
  (SCREEN_DIMENSIONS.width - INSET_SQUARE_INSET * COLUMN_COUNT) / COLUMN_COUNT -
    COLUMN_GAP * COLUMN_COUNT
);

export const INSET_SQUARE_ITEM_HEIGHT = SQUARE_ITEM_WIDTH;