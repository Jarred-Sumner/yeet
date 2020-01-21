import { getInset } from "react-native-safe-area-view";
import { SPACING } from "../../lib/styles";

export const CAROUSEL_HEIGHT = 40 + getInset("top") + SPACING.half;

export {
  buildPost,
  buildTextBlock,
  buildImageBlock,
  FocusType,
  generateBlockId,
  isPlaceholderImageBlock,
  MAX_POST_HEIGHT,
  minImageWidthByFormat,
  DEFAULT_TEXT_BORDER_BY_TEMPLATE,
  POST_WIDTH,
  presetsByFormat
} from "../../lib/buildPost";
export {
  TextBorderType,
  TextPostBlock,
  TextTemplate,
  NewPostType,
  PostBlockType,
  PostFormat,
  PostLayout,
  ChangeBlockFunction,
  DEFAULT_FORMAT,
  DEFAULT_POST_FORMAT,
  DEFAULT_TEXT_BACKGROUND_COLOR,
  DEFAULT_TEXT_COLOR,
  ImagePostBlock
} from "../../lib/enums";
