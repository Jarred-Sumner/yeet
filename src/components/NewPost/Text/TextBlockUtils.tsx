import {
  PostFormat,
  TextBorderType,
  TextPostBlock,
  TextTemplate
} from "../../../lib/enums";
import { textInputPresets } from "./Presets";
import { PixelRatio } from "react-native";
import { memoize } from "lodash";
import { isColorDark } from "../../../lib/colors";

export const getStrokeWidth = (block: TextPostBlock) => {
  const border = getBorderType(block);
  const { template } = block.config;
  const presets = textInputPresets[template].presets;

  if (template === TextTemplate.bigWords) {
    return 5;
  } else if (border === TextBorderType.stroke) {
    return 3;
  } else if (template === TextTemplate.comic) {
    return PixelRatio.get();
  } else {
    return 0;
  }
};

export const getSupportedBorderTypes = (
  block: TextPostBlock
): Array<TextBorderType> => {
  if (block.format === PostFormat.post) {
    return [TextBorderType.hidden, TextBorderType.invert];
  } else if (block.config.template === TextTemplate.bigWords) {
    return [TextBorderType.highlight];
  } else {
    return [
      TextBorderType.invert,
      TextBorderType.highlight,
      TextBorderType.hidden,
      TextBorderType.stroke
    ];
  }
};

export const getFontSize = (block: TextPostBlock): number => {
  const { fontSize } = block.config.overrides;

  if (typeof fontSize === "number") {
    return fontSize;
  }

  const { template } = block.config;

  const fontSizes = textInputPresets[template].fontSizes;
  const _borderType = getBorderType(block);

  const size = getClosestNumber(
    block.value?.length ?? 0,
    Object.values(fontSizes)
  );

  if (
    _borderType === TextBorderType.stroke &&
    template !== TextTemplate.bigWords
  ) {
    return size * 1.25;
  } else {
    return size;
  }
};

export const getHighlightInset = (block: TextPostBlock) => {
  if (block?.type !== "text") {
    return 0;
  }

  const border = getBorderType(block);
  const { template } = block.config;
  const presets = textInputPresets[template].presets;
  if (block.format === PostFormat.post) {
    return 0;
  }
  return border === TextBorderType.stroke ? -3.0 : presets.highlightInset ?? 0;
};

export const getBorderType = (block: TextPostBlock): TextBorderType => {
  const { template, overrides = {}, border } = block.config;
  if (template === TextTemplate.comic) {
    if (border === TextBorderType.invert) {
      return border;
    } else {
      return TextBorderType.solid;
    }
  } else if (template === TextTemplate.bigWords) {
    return TextBorderType.stroke;
  } else {
    return border;
  }
};

const getClosestNumber = (goal, counts) =>
  counts.find(count => {
    if (goal - Number(count) <= 0) {
      return true;
    }
  }) || counts[counts.length - 1];

export const getTextBlockBackgroundColor = (block: TextPostBlock) => {
  const { template, overrides = {}, border } = block.config;
  let color = getDenormalizedColor(block);
  let backgroundColor = getDenormalizedBackgroundColor(block);
  if (block.format === PostFormat.comment) {
    return backgroundColor;
  }
  if (border === TextBorderType.hidden && template !== TextTemplate.post) {
    return "rgba(0, 0, 0, 0)";
  } else if (border === TextBorderType.invert) {
    return color;
  } else {
    return backgroundColor;
  }
};

export const isTextBlockAlignEnabled = (block: TextPostBlock): boolean => {
  if (block?.type !== "text") {
    return false;
  }

  const { template, overrides = {}, border } = block.config;

  if (template === TextTemplate.bigWords || template === TextTemplate.comic) {
    return false;
  }

  return true;
};

export const getDenormalizedColor = (block: TextPostBlock) => {
  const { overrides = {} } = block.config;

  return (
    overrides?.color ||
    overrides?.textColor ||
    textInputPresets[block.config.template].presets.color
  );
};

export const getDenormalizedBackgroundColor = (block: TextPostBlock) => {
  const { overrides = {} } = block.config;

  return (
    overrides?.backgroundColor ||
    textInputPresets[block.config.template].presets.backgroundColor
  );
};

export const getTextBlockColor = (block: TextPostBlock) => {
  if (!block || block.type !== "text") {
    return;
  }
  const { border } = block.config;
  let color = getDenormalizedColor(block);
  let backgroundColor = getDenormalizedBackgroundColor(block);
  if (border === TextBorderType.invert) {
    return backgroundColor;
  } else {
    return color;
  }
};

export const contrastingColor = memoize((color: string) => {
  if (isColorDark(color)) {
    return "#fff";
  } else {
    return "#333";
  }
});
