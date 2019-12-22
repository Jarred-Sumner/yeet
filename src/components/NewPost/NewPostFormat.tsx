import { getInset } from "react-native-safe-area-view";
import { SPACING } from "../../lib/styles";

export const CAROUSEL_HEIGHT = 40 + getInset("top") + SPACING.half;

export {
  buildPost,
  buildTextBlock,
  buildImageBlock,
  ChangeBlockFunction,
  DEFAULT_FORMAT,
  DEFAULT_POST_FORMAT,
  DEFAULT_TEXT_BACKGROUND_COLOR,
  DEFAULT_TEXT_BORDER_BY_TEMPLATE,
  DEFAULT_TEXT_COLOR,
  FocusType,
  generateBlockId,
  ImagePostBlock,
  isPlaceholderImageBlock,
  MAX_POST_HEIGHT,
  minImageWidthByFormat,
  NewPostType,
  PostBlockType,
  PostFormat,
  PostLayout,
  POST_WIDTH,
  presetsByFormat,
  TextBorderType,
  TextPostBlock,
  TextTemplate
} from "../../lib/buildPost";
