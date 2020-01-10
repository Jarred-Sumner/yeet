import { memoize } from "lodash";
import * as React from "react";
// import { ReText } from "react-native-redash";
import {
  PixelRatio,
  StyleProp,
  StyleSheet,
  TextInput as _RNTextInput,
  TextInputProps,
  View
} from "react-native";
import Animated from "react-native-reanimated";
import chroma from "chroma-js";
import { SCREEN_DIMENSIONS } from "../../../../config";
import { FONT_STYLES } from "../../../lib/fonts";
import { COLORS, SPACING } from "../../../lib/styles";
import {
  CurrentUserCommentAvatar,
  normalizeBackgroundColor,
  TextCommentAvatar
} from "../../Posts/CommentsViewer";
import {
  FocusType,
  PostFormat,
  PostLayout,
  TextBorderType,
  TextPostBlock,
  TextTemplate
} from "../NewPostFormat";
import { TextInput as __RNTextInput } from "./CustomTextInputComponent";
import { SpeechBubble } from "./SpeechBubble";
import { textInputPresets } from "./Presets";
import { invertColor, getStrokeColor, isColorDark } from "../../../lib/colors";
import {
  NativeViewGestureHandler,
  createNativeWrapper
} from "react-native-gesture-handler";
import {
  POST_WIDTH,
  MAX_POST_HEIGHT,
  isFixedSizeBlock
} from "../../../lib/buildPost";

const RNTextInput = __RNTextInput;

// const RNTextInput = createNativeWrapper(, {
//   disallowInterruption: true,
//   shouldCancelWhenOutside: true
// });

export const contrastingColor = memoize((color: string) => {
  if (isColorDark(color)) {
    return "#fff";
  } else {
    return "#333";
  }
});

const getPlaceholderColor = memoize((color: string) =>
  chroma(color)
    .alpha(0.65)
    .css()
);

const getTextShadow = (
  backgroundColor: string,
  color: string,
  format: PostFormat,
  border: TextBorderType,
  template: TextTemplate
) => {
  if (format === PostFormat.post || border !== TextBorderType.hidden) {
    return {
      textShadowRadius: null,
      textShadowColor: "rgba(0, 0, 0, 0)"
    };
  }

  let textShadowColor = "rgb(0, 0, 0)";

  if (isColorDark(color)) {
    textShadowColor = "rgba(255, 255, 255, 1.0)";
  } else {
    textShadowColor = "rgba(0, 0, 0, 1.0)";
  }

  if (textShadowColor === "rgba(0, 0, 0, 0)") {
    return {
      textShadowColor: "rgba(0, 0, 0, 0)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: null
    };
  }

  const presets = textInputPresets[template];

  let textShadowOffset = presets.textShadowOffset ?? {
    width: 0,
    height: 0
  };

  let textShadowRadius = presets.textShadowRadius ?? StyleSheet.hairlineWidth;

  return {
    textShadowColor,
    textShadowOffset,
    textShadowRadius
  };
};

const BASE_OVERLAY_STYLE = {
  backgroundColor: "rgba(0, 0, 0, 0)",
  fontFamily: "Helvetica",
  marginTop: 0,
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 6,
  textAlignVertical: "center",
  paddingRight: 6
};

const textInputTypeStylesheets: {
  [style: TextTemplate]: {
    container: StyleProp<View>;
    sticker?: StyleProp<View>;
    input: StyleProp<_RNTextInput>;
  };
} = {
  [TextTemplate.comment]: StyleSheet.create({
    container: {
      borderRadius: 0
    },
    input: {
      borderRadius: 4,
      overflow: "hidden",
      fontFamily: "Inter",
      paddingLeft: 6,
      paddingRight: 6,
      fontWeight: "600",
      paddingTop: 10,
      paddingBottom: 10,
      textShadowOffset: { width: 0, height: 0 },

      textShadowRadius: 1
    }
  }),
  [TextTemplate.basic]: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0)"
    },
    input: {
      ...FONT_STYLES.basic,

      color: textInputPresets[TextTemplate.basic].presets.color,

      textShadowColor:
        textInputPresets[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputPresets[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputPresets[TextTemplate.basic].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  }),
  [TextTemplate.bigWords]: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0)"
    },
    input: {
      ...FONT_STYLES.bigWords,
      color: textInputPresets[TextTemplate.bigWords].presets.color,

      textShadowColor:
        textInputPresets[TextTemplate.bigWords].presets.textShadowColor,
      textShadowOffset:
        textInputPresets[TextTemplate.bigWords].presets.textShadowOffset,

      textShadowRadius:
        textInputPresets[TextTemplate.bigWords].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  }),
  [TextTemplate.comic]: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0)"
    },
    sticker: {
      paddingLeft: Math.abs(
        textInputPresets[TextTemplate.comic].presets.highlightInset
      ),
      paddingRight: Math.abs(
        textInputPresets[TextTemplate.comic].presets.highlightInset
      ),

      paddingBottom: Math.abs(
        textInputPresets[TextTemplate.comic].presets.highlightInset
      ),
      paddingTop:
        24 +
        Math.abs(textInputPresets[TextTemplate.comic].presets.highlightInset) -
        PixelRatio.get()
    },
    input: {
      ...FONT_STYLES.comic,
      borderRadius: 0,
      paddingLeft: 0,
      paddingRight: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      justifyContent: "center",

      overflow: "visible",
      backgroundColor:
        textInputPresets[TextTemplate.comic].presets.backgroundColor,

      color: textInputPresets[TextTemplate.comic].presets.color,

      textShadowColor:
        textInputPresets[TextTemplate.comic].presets.textShadowColor,
      textShadowOffset:
        textInputPresets[TextTemplate.comic].presets.textShadowOffset,

      textShadowRadius:
        textInputPresets[TextTemplate.comic].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  }),

  [TextTemplate.post]: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0)"
    },
    input: {
      ...FONT_STYLES.post,
      backgroundColor: "rgba(0, 0, 0, 0)",

      marginTop: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 8,
      textAlignVertical: "center",
      paddingRight: 8,
      color: textInputPresets[TextTemplate.post].presets.color,
      textShadowColor:
        textInputPresets[TextTemplate.post].presets.textShadowColor,
      textShadowOffset:
        textInputPresets[TextTemplate.post].presets.textShadowOffset,

      textShadowRadius:
        textInputPresets[TextTemplate.post].presets.textShadowRadius
    }
  }),
  [TextTemplate.pickaxe]: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0)"
    },
    input: {
      ...FONT_STYLES.minecraft,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,

      textShadowColor:
        textInputPresets[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputPresets[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputPresets[TextTemplate.basic].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  }),

  [TextTemplate.terminal]: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0)"
    },
    input: {
      ...FONT_STYLES.monospace,
      paddingLeft: 0,
      textAlignVertical: "center",
      paddingRight: 0,

      textShadowColor:
        textInputPresets[TextTemplate.terminal].presets.textShadowColor,
      textShadowOffset:
        textInputPresets[TextTemplate.terminal].presets.textShadowOffset,

      textShadowRadius:
        textInputPresets[TextTemplate.terminal].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE,
      paddingTop: 0,
      paddingBottom: 0
    }
  }),
  [TextTemplate.gary]: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0)"
    },
    input: {
      ...FONT_STYLES.spongebob,
      paddingLeft: SPACING.half,
      paddingRight: SPACING.half,

      textShadowColor:
        textInputPresets[TextTemplate.gary].presets.textShadowColor,
      textShadowOffset:
        textInputPresets[TextTemplate.gary].presets.textShadowOffset,

      textShadowRadius:
        textInputPresets[TextTemplate.gary].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  })
};

const styles = StyleSheet.create({
  container: {
    flex: 0,
    position: "relative",
    overflow: "visible"
  },
  input: {
    flex: 0,

    backgroundColor: "rgba(0, 0, 0, 0)",

    paddingTop: 0,
    flexWrap: "wrap",

    borderWidth: 0,
    borderColor: "rgba(0, 0, 0, 0)",
    borderRadius: 0,
    overflow: "visible",
    shadowOpacity: 0,
    textShadowRadius: null
  },
  absoluteFocused: {
    // flex: 1
    // textAlign: "left"
  },
  fixedSizeBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.secondaryOpacity,
    borderStyle: "dashed",
    position: "absolute",
    zIndex: -1,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
});

const formatStylesheets = {
  [PostFormat.post]: StyleSheet.create({
    container: {},
    focusedContainer: {},
    sticker: {},
    input: {
      paddingBottom: SPACING.normal,
      paddingTop: SPACING.normal,
      paddingVertical: SPACING.normal,
      flex: 1
    }
  }),
  [PostFormat.sticker]: StyleSheet.create({
    container: {},
    sticker: {},
    focusedSticker: {},
    input: {}
  }),
  [PostFormat.comment]: StyleSheet.create({
    container: {},
    sticker: {},
    focusedContainer: {},
    input: {}
  })
};

export const getDenormalizedColor = (block: TextPostBlock) => {
  const { template, overrides = {} } = block.config;

  return (
    overrides?.color ||
    overrides?.textColor ||
    textInputPresets[block.config.template].presets.color
  );
};

export const getDenormalizedBackgroundColor = (block: TextPostBlock) => {
  const { template, overrides = {} } = block.config;

  return (
    overrides?.backgroundColor ||
    textInputPresets[block.config.template].presets.backgroundColor
  );
};

export const getTextBlockColor = (block: TextPostBlock) => {
  const { border } = block.config;

  let color = getDenormalizedColor(block);
  let backgroundColor = getDenormalizedBackgroundColor(block);

  if (border === TextBorderType.invert) {
    return backgroundColor;
  } else {
    return color;
  }
};

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

export const getSupportedBorderTypes = (
  block: TextPostBlock
): Array<TextBorderType> => {
  if (block.format === PostFormat.post) {
    return [TextBorderType.hidden, TextBorderType.invert];
  } else if (block.config.template === TextTemplate.bigWords) {
    return [TextBorderType.highlight];
  } else {
    return [
      TextBorderType.highlight,
      TextBorderType.invert,
      TextBorderType.stroke,
      TextBorderType.hidden
    ];
  }
};

export const getTextBlockAlign = (block: TextPostBlock): CanvasTextAlign => {
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

const getStrokeWidth = (block: TextPostBlock) => {
  const border = getBorderType(block);
  const { template } = block.config;
  const presets = textInputPresets[template].presets;

  if (template === TextTemplate.bigWords) {
    return PixelRatio.get() * 2;
  } else if (border === TextBorderType.stroke) {
    return PixelRatio.get() * 2;
  } else if (template === TextTemplate.comic) {
    return PixelRatio.get();
  } else {
    return 0;
  }
};

const getFontSize = (block: TextPostBlock) => {
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
  const border = getBorderType(block);
  const { template } = block.config;

  const presets = textInputPresets[template].presets;

  return border === TextBorderType.stroke
    ? getStrokeWidth(block) * -1
    : presets.highlightInset ?? 0;
};

const getClosestNumber = (goal, counts) =>
  counts.find(count => {
    if (goal - Number(count) <= 0) {
      return true;
    }
  }) || counts[counts.length - 1];

type Props = {
  block: TextPostBlock;
  onChangeValue: (value: string) => void;
  TextInputComponent: React.ComponentType<TextInputProps>;
};

export const TextInput = ({
  editable,
  inputRef,
  onBlur,
  photoURL,
  onContentSizeChange,
  disabled,
  blockRef,
  stickerRef,
  username,
  isBlockFocused: isFocused,
  onLayout,
  focusType,
  onFinishEditing,
  onChangeValue,
  isSticker,
  paddingTop,
  onTapAvatar,
  text,
  focusTypeValue,
  maxX = SCREEN_DIMENSIONS.width,
  onFocus,
  block,
  gestureRef,
  TextInputComponent = RNTextInput
}) => {
  const {
    config: {
      placeholder = " ",
      minHeight,
      template = {
        [PostFormat.post]: TextTemplate.post,
        [PostFormat.comment]: TextTemplate.comment,
        [PostFormat.sticker]: TextTemplate.basic
      }[block.format],
      overrides = {
        color: undefined,
        backgroundColor: undefined,
        textAlign: undefined,
        textTransform: undefined,
        maxWidth: undefined,
        numberOfLines: undefined
      }
    },
    value,
    layout,
    id
  } = block;

  let format = block.format;
  if (isSticker && block.format === PostFormat.post) {
    format = PostFormat.sticker;
  }

  const border = getBorderType(block);

  const { presets, fontSizes } = textInputPresets[template];

  const fontSize = getFontSize(block);

  const handleBlur = React.useCallback(
    event => {
      onBlur && onBlur(event);
    },
    [onBlur]
  );

  const handleFocus = React.useCallback(
    event => {
      onFocus && onFocus(event);
    },
    [onFocus]
  );

  const handleChangeText = React.useCallback(
    event => {
      onChangeValue && onChangeValue(event);
    },
    [onChangeValue]
  );

  const maxWidth = overrides?.maxWidth;
  const isFixedSize = isFixedSizeBlock(block);
  const highlightInset = getHighlightInset(block);

  let width = undefined;
  let height = undefined;

  if (focusType === FocusType.absolute && isFocused && !isFixedSize) {
    width = POST_WIDTH - highlightInset * 2;
  } else if (format === PostFormat.post) {
    if (
      [PostLayout.horizontalTextMedia, PostLayout.horizontalMediaText].includes(
        layout
      )
    ) {
      width = "50%";
    } else if (
      [PostLayout.verticalTextMedia, PostLayout.verticalMediaText].includes(
        layout
      )
    ) {
      width = "100%";
    }
  }

  let backgroundColor = getTextBlockBackgroundColor(block);
  let color = getTextBlockColor(block);

  const textAlign = getTextBlockAlign(block);
  const textTransform = overrides?.textTransform;

  const textShadow = React.useMemo(
    () => getTextShadow(backgroundColor, color, format, border, template),
    [backgroundColor, color, format, border, template]
  );

  const highlightCornerRadius = presets.highlightCornerRadius ?? 0;

  let borderType = border;
  let highlightColor = backgroundColor;
  const selectionColor = contrastingColor(backgroundColor);
  let strokeColor = "rgba(0, 0, 0, 0)";

  if (template === TextTemplate.comic) {
    strokeColor = color;
  } else if (borderType === TextBorderType.stroke) {
    strokeColor =
      fontSize >= 18 ? getStrokeColor(color) : contrastingColor(color);
    highlightColor = color;
  }

  const strokeWidth = getStrokeWidth(block);

  const containerStyles = React.useMemo(
    () => [
      styles.container,
      textInputTypeStylesheets[template].container,
      formatStylesheets[format].container,
      !isSticker && {
        height,
        width
      }
    ],
    [
      template,
      format,
      width,
      height,
      isSticker,
      styles.container,
      textInputTypeStylesheets,
      formatStylesheets,
      isFocused,
      focusType
    ]
  );

  const inputStyles = React.useMemo(
    () => [
      styles.input,
      textInputTypeStylesheets[template].input,
      formatStylesheets[format].input,
      {
        backgroundColor: format === PostFormat.post ? backgroundColor : null,
        minHeight,

        marginLeft: Math.abs(highlightInset),
        marginRight: Math.abs(highlightInset),
        marginTop: Math.abs(highlightInset),
        marginBottom: Math.abs(highlightInset),

        textAlign,
        color,
        textTransform,
        fontSize,
        ...textShadow
        // maxWidth,
      }

      // template === TextTemplate.comic && {
      //   textAlign: "center"
      // }
    ],
    [
      styles.input,
      template,
      minHeight,
      textAlign,
      paddingTop,
      formatStylesheets,
      textInputTypeStylesheets[template].input,
      textInputTypeStylesheets[template],
      presets,
      width,
      height,
      border,
      backgroundColor,
      strokeColor,
      format,
      focusType,
      template,
      highlightInset,
      isFocused,
      textTransform,
      color,
      textShadow,
      maxWidth,
      fontSize
    ]
  );

  const isKeyboardFocused = isFocused && focusType === FocusType.absolute;

  let pointerEvents = "auto";
  if (isSticker && focusType === FocusType.static) {
    pointerEvents = "none";
  } else if (!isSticker && focusType === FocusType.absolute) {
    pointerEvents = "none";
  } else if (isSticker && focusType === FocusType.absolute && !isFocused) {
    pointerEvents = "none";
  }

  const innerContent = (
    <View
      nativeID="inputContainer"
      ref={blockRef}
      key={`${format}-${layout}`}
      style={containerStyles}
    >
      <TextInputComponent
        pointerEvents={pointerEvents}
        editable={true}
        selectable={
          format === PostFormat.post && focusType !== FocusType.absolute
        }
        ref={inputRef}
        style={inputStyles}
        isSticker={isSticker}
        multiline
        scrollEnabled={false}
        singleFocus
        numberOfLines={overrides.numberOfLines ?? null}
        width={maxWidth ?? width}
        // maxWidth={maxWidth ?? POST_WIDTH}
        // minWidth={isSticker ? 40 : undefined}
        maxContentWidth={maxWidth}
        height={typeof height === "number" ? height : undefined}
        onFinishEditing={onFinishEditing}
        nestedScrollEnabled
        fontSize={fontSize}
        listKey={block.id}
        spellCheck={false}
        inputAccessoryViewID={`new-post-input`}
        minimumFontScale={0.4}
        selectionColor={selectionColor}
        template={template}
        highlightInset={highlightInset}
        highlightCornerRadius={highlightCornerRadius}
        strokeColor={strokeColor}
        borderType={borderType}
        strokeWidth={strokeWidth}
        onContentSizeChange={onContentSizeChange}
        lengthPerLine={50}
        blurOnSubmit={false}
        fontSizeRange={textInputPresets[template].fontSizes}
        placeholderTextColor={getPlaceholderColor(selectionColor)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        scrollEnabled={false}
        placeholder={placeholder}
        defaultValue={text}
        onLayout={onLayout}
        highlightColor={highlightColor}
        onChangeText={handleChangeText}
        keyboardAppearance="dark"
        textContentType="none"
        autoFocus={false}
      />

      {format === PostFormat.comment ? (
        photoURL || username ? (
          <TextCommentAvatar
            onTap={onTapAvatar}
            photoURL={photoURL}
            username={username}
          />
        ) : (
          <CurrentUserCommentAvatar onTap={onTapAvatar} />
        )
      ) : null}
    </View>
  );

  if (format === PostFormat.sticker) {
    return (
      <View
        style={[
          textInputTypeStylesheets[template]?.sticker,
          formatStylesheets[format].sticker,
          isKeyboardFocused && formatStylesheets[format].focusedSticker
        ]}
        nativeID="stickerContainer"
        ref={stickerRef}
      >
        {isFixedSize && isKeyboardFocused && (
          <View pointerEvents="none" style={styles.fixedSizeBorder} />
        )}
        {innerContent}

        {template === TextTemplate.comic && (
          <View
            pointerEvents="none"
            style={{
              opacity: String(text).length > 4 ? 1 : 0,
              alignItems: "center",
              top: 3,
              position: "absolute",
              alignSelf: "center",
              // left: 0,
              // right: 0,
              zIndex: 1,
              transform: [
                {
                  rotate: "-4deg"
                },
                { scale: -1 },

                {
                  translateY: StyleSheet.hairlineWidth
                }
              ]
            }}
          >
            <SpeechBubble
              strokeColor={strokeColor}
              fillColor={backgroundColor}
              width={91 / 2}
              height={68 / 2}
            />
          </View>
        )}
      </View>
    );
  } else {
    return innerContent;
  }
};
export default TextInput;
