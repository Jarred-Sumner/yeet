import chroma from "chroma-js";
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
import { SCREEN_DIMENSIONS } from "../../../../config";
import { isFixedSizeBlock, POST_WIDTH } from "../../../lib/buildPost";
import { getStrokeColor, isColorDark } from "../../../lib/colors";
import { FONT_STYLES } from "../../../lib/fonts";
import { COLORS, SPACING } from "../../../lib/styles";
import {
  CurrentUserCommentAvatar,
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
import { textInputPresets } from "./Presets";
import { SpeechBubble } from "./SpeechBubble";
import useKeyboard from "@rnhooks/keyboard";
import { useAnimatedEvent } from "../../../lib/animations";
import YeetView from "./YeetView";
import { IconLock } from "../../Icon";
import { SemiBoldText } from "../../Text";

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
      paddingTop: 3,
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
  fixedWidthBorder: {
    borderWidth: 2,
    borderRadius: 1,
    borderColor: COLORS.secondaryOpacity,
    borderStyle: "dashed",
    margin: -2,
    position: "absolute",
    zIndex: -1,
    top: -2,
    bottom: -2,
    left: -2,
    right: -2
  },
  fixedWidthTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",

    position: "absolute",
    justifyContent: "flex-start",
    opacity: 0.75,
    paddingHorizontal: SPACING.half,

    zIndex: -1,
    top: -24,
    left: 0,
    right: 0
  },
  widthLockLabel: {
    marginLeft: SPACING.half / 2,
    fontSize: 12,
    color: "white"
  }
});

const formatStylesheets = {
  [PostFormat.post]: StyleSheet.create({
    container: {
      marginBottom: SPACING.normal,
      marginTop: SPACING.normal,
      marginVertical: SPACING.normal
    },
    focusedContainer: {},
    sticker: {},
    input: {
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

const getStrokeWidth = (block: TextPostBlock) => {
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

  return border === TextBorderType.stroke ? -3.0 : presets.highlightInset ?? 0;
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

export const TextInput = React.forwardRef((props, ref) => {
  const {
    editable,
    inputRef,
    onBlur,
    photoURL,
    onContentSizeChange,
    disabled,
    stickerTag,
    blockRef,
    stickerRef,
    username,
    isBlockFocused: _isFocused,
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
  } = props;

  const willAutoFocus = React.useRef(isSticker && text.length === 0);
  const hasBlurred = React.useRef(false);

  React.useEffect(() => {
    if (willAutoFocus.current === true && hasBlurred.current) {
      willAutoFocus.current = false;
    }
  }, [_isFocused]);

  const isFocused = willAutoFocus.current || _isFocused;

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

  const _ref = React.useRef();

  React.useImperativeHandle(ref, () => _ref.current);

  useAnimatedEvent(onContentSizeChange, "onContentSizeChange", _ref);

  const isFixedSize = isFixedSizeBlock(block);
  const isKeyboardFocused = isFocused && focusType === FocusType.absolute;

  const STICKER_FOCUS_WIDTH = POST_WIDTH - 32;

  let format = block.format;
  if (isSticker && block.format === PostFormat.post) {
    format = PostFormat.sticker;
  }

  const border = getBorderType(block);

  const { presets, fontSizes } = textInputPresets[template];

  const fontSize = getFontSize(block);

  const handleBlur = React.useCallback(
    event => {
      hasBlurred.current = true;
      onBlur && onBlur(event);
    },
    [onBlur, hasBlurred]
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

  const maxWidth = block.config?.overrides?.maxWidth;

  const highlightInset = getHighlightInset(block);

  let width = undefined;
  let height = undefined;

  let containerWidth = undefined;
  let containerHeight = undefined;

  // if (focusType === FocusType.absolute && isFocused && !isFixedSize) {
  // } else if (format === PostFormat.post) {
  //   if (
  //     [PostLayout.horizontalTextMedia, PostLayout.horizontalMediaText].includes(
  //       layout
  //     )
  //   ) {
  //     width = "50%";
  //   } else if (
  //     [PostLayout.verticalTextMedia, PostLayout.verticalMediaText].includes(
  //       layout
  //     )
  //   ) {
  //     width = "100%";
  //   }
  // } else if (isSticker && !isFocused && !isFixedSize) {
  //   // width = contentSize.width;
  //   // height = contentSize.height;
  // }

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
      textAlign,
      width,
      containerHeight,
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

        // letterSpacing: border === TextBorderType.stroke ? 0.5 : undefined,

        textAlign,
        color,
        textTransform,
        fontSize,
        ...textShadow
      }

      // template === TextTemplate.comic && {
      //   textAlign: "center"
      // }
    ],
    [
      styles.input,
      template,
      strokeWidth,
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
        ref={_ref}
        style={inputStyles}
        format={format}
        multiline
        scrollEnabled={false}
        singleFocus
        stickerContainerTag={stickerTag}
        numberOfLines={overrides.numberOfLines ?? null}
        width={maxWidth}
        maxContentWidth={maxWidth}
        maxWidth={maxWidth ?? POST_WIDTH}
        // height={typeof height === "number" ? height : undefined}
        nestedScrollEnabled
        fontSize={fontSize}
        listKey={block.id}
        spellCheck={false}
        inputAccessoryViewID={`new-post-input`}
        minimumFontScale={0.4}
        selectionColor={selectionColor}
        willAutoFocus={willAutoFocus.current}
        template={template}
        highlightInset={highlightInset}
        highlightCornerRadius={highlightCornerRadius}
        strokeColor={strokeColor}
        border={borderType}
        strokeWidth={strokeWidth}
        // onContentSizeChange={onContentSizeChange}
        onFinishEditing={onFinishEditing}
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
          formatStylesheets[format].sticker
        ]}
        nativeID="stickerContainer"
        ref={stickerRef}
      >
        {isKeyboardFocused && isFixedSize && (
          <>
            <View pointerEvents="none" style={styles.fixedWidthBorder} />
            <View pointerEvents="none" style={styles.fixedWidthTop}>
              <IconLock size={12} color={"white"} />
              <SemiBoldText style={styles.widthLockLabel}>Width</SemiBoldText>
            </View>
          </>
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
              left: 0,
              right: 0,
              zIndex: 1,
              transform: [
                {
                  rotate: "-4deg"
                },
                { scale: -1 },

                {
                  translateY: StyleSheet.hairlineWidth
                },
                {
                  translateX: -2.5
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
});
export default TextInput;
