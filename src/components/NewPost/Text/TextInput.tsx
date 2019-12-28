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
import { TextInput as RNTextInput } from "./CustomTextInputComponent";
import { SpeechBubble } from "./SpeechBubble";
import { textInputPresets } from "./Presets";
import { invertColor, getStrokeColor, isColorDark } from "../../../lib/colors";

const RawAnimatedTextInput = React.memo(
  Animated.createAnimatedComponent(RNTextInput)
);

const AnimatedTextInput = React.forwardRef((props, ref) => {
  const inputRef = React.useRef();

  React.useImperativeHandle(ref, () => {
    return inputRef?.current?.getNode();
  });

  return <RawAnimatedTextInput ref={inputRef} {...props} />;
}) as React.ComponentType<TextInputProps>;

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
  // if (border === TextBorderType.stroke || format === PostFormat.post) {
  return {
    textShadowRadius: null
  };
  // }

  let _backgroundColor =
    backgroundColor === "rgba(0, 0, 0, 0)" ? null : backgroundColor;

  let textShadowColor: string = "rgba(0, 0, 0, 0)";
  if (format === PostFormat.comment) {
    if (isColorDark(color || _backgroundColor)) {
      textShadowColor = "rgba(255, 255, 255, 0.25)";
    } else {
      textShadowColor = "rgba(0, 0, 0, 0.25)";
    }
  } else if (border === TextBorderType.hidden) {
    if (isColorDark(color || _backgroundColor)) {
      textShadowColor = "rgba(255, 255, 255, 0.95)";
    } else {
      textShadowColor = "rgba(0, 0, 0, 0.95)";
    }
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

  let textShadowRadius = presets.textShadowRadius ?? 0;

  if (
    (border === TextBorderType.hidden || border === TextBorderType.highlight) &&
    !presets.textShadowRadius
  ) {
    textShadowRadius = 2;
    // textShadowOffset = {
    //   width
    // }
  }

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
      textAlign:
        textInputPresets[TextTemplate.basic].presets.textAlign || "left",
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
  [TextTemplate.comic]: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0)"
    },
    input: {
      ...FONT_STYLES.comic,
      borderRadius: 0,
      paddingLeft: 0,
      paddingRight: 12,
      paddingVertical: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 12,

      overflow: "visible",
      backgroundColor:
        textInputPresets[TextTemplate.comic].presets.backgroundColor,
      textAlign:
        textInputPresets[TextTemplate.comic].presets.textAlign || "left",
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
      textAlign: "left",
      backgroundColor: "rgba(0, 0, 0, 0)",

      marginTop: 0,
      paddingTop: SPACING.normal,
      paddingBottom: SPACING.normal,
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
      paddingLeft: SPACING.half,
      paddingRight: SPACING.half,
      paddingTop: SPACING.normal,
      paddingBottom: SPACING.normal,
      textAlign:
        textInputPresets[TextTemplate.pickaxe].presets.textAlign || "left",
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
      paddingTop: SPACING.normal,
      paddingBottom: SPACING.normal,
      paddingLeft: SPACING.half,
      paddingRight: SPACING.half,
      textAlign:
        textInputPresets[TextTemplate.terminal].presets.textAlign || "left",
      textShadowColor:
        textInputPresets[TextTemplate.terminal].presets.textShadowColor,
      textShadowOffset:
        textInputPresets[TextTemplate.terminal].presets.textShadowOffset,

      textShadowRadius:
        textInputPresets[TextTemplate.terminal].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
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
      textAlign:
        textInputPresets[TextTemplate.gary].presets.textAlign || "left",
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
    flexGrow: 0,
    flexShrink: 0,
    position: "relative"
  },
  input: {
    marginTop: 0,
    marginLeft: 0,
    flexGrow: 0,
    flex: 0,
    flexShrink: 0,
    marginRight: 0,
    backgroundColor: "rgba(0, 0, 0, 0)",
    marginBottom: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    flexWrap: "nowrap",
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
    borderWidth: 0,
    borderColor: "rgba(0, 0, 0, 0)",
    borderRadius: 0,
    overflow: "visible",
    shadowOpacity: 0,
    textShadowRadius: null
  },
  absoluteFocused: {
    width: SCREEN_DIMENSIONS.width - SPACING.double - 30,
    height: "100%",
    flex: 0,
    textAlign: "left"
  }
});

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

export const getTextBlockAlign = (block: TextPostBlock): CanvasTextAlign => {
  const { template, overrides = {}, border } = block.config;

  return (
    overrides?.textAlign ||
    textInputPresets[block.config.template].textAlign ||
    "left"
  );
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
  disabled,
  blockRef,
  stickerRef,
  username,
  onLayout,
  focusType,
  onChangeValue,
  onTapAvatar,
  text,
  focusTypeValue,
  maxX = SCREEN_DIMENSIONS.width,
  onFocus,
  block,
  gestureRef,
  TextInputComponent = AnimatedTextInput
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
      border,
      overrides = {
        color: undefined,
        backgroundColor: undefined,
        textAlign: undefined,
        textTransform: undefined,
        maxWidth: undefined
      }
    },
    value,
    layout,
    format,
    id
  } = block;

  const { presets, fontSizes } = textInputPresets[template];

  const fontSize =
    overrides?.fontSize ??
    getClosestNumber(text.length, Object.values(fontSizes));
  const [isFocused, setFocused] = React.useState(false);

  const handleBlur = React.useCallback(
    event => {
      onBlur && onBlur(event);
      setFocused(false);
    },
    [onBlur, setFocused]
  );

  const handleFocus = React.useCallback(
    event => {
      onFocus && onFocus(event);
      setFocused(true);
    },
    [onFocus, setFocused]
  );

  const handleChangeText = React.useCallback(
    event => {
      onChangeValue && onChangeValue(event);
    },
    [onChangeValue]
  );

  let width = undefined;
  let height = undefined;

  if (focusType === FocusType.absolute && isFocused) {
    width = "100%";
    height = "100%";
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
  const maxWidth = overrides?.maxWidth;

  const textShadow = React.useMemo(
    () => getTextShadow(backgroundColor, color, format, border, template),
    [backgroundColor, color, format, border, template]
  );

  const highlightInset = presets.highlightInset ?? 0;

  const highlightCornerRadius = presets.highlightCornerRadius ?? 0;

  let borderType = border;
  let highlightColor = backgroundColor;
  const selectionColor = contrastingColor(backgroundColor);
  let strokeColor = "rgba(0, 0, 0, 0)";

  if (borderType === TextBorderType.stroke) {
    strokeColor =
      fontSize >= 18 ? getStrokeColor(color) : contrastingColor(color);
  }

  const containerStyles = React.useMemo(
    () => [
      styles.container,
      textInputTypeStylesheets[template].container,
      {
        height,
        width
      }
    ],
    [template, width, height, styles.container, textInputTypeStylesheets]
  );

  const inputStyles = React.useMemo(
    () => [
      styles.input,
      textInputTypeStylesheets[template].input,
      {
        backgroundColor: format === PostFormat.post ? backgroundColor : null,
        minHeight,
        marginLeft:
          template === TextTemplate.comic
            ? Math.abs(highlightInset)
            : undefined,
        textAlign,
        color,
        textTransform,
        fontSize,
        ...textShadow,
        maxWidth
      },
      isFocused && focusType === FocusType.absolute && styles.absoluteFocused
    ],
    [
      styles.input,
      template,
      minHeight,
      textAlign,
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

  if (isFocused) {
    console.log({
      border,
      highlightColor,
      highlightInset,
      strokeColor,
      color,
      backgroundColor,
      textShadow
    });
  }

  const innerContent = (
    <View ref={blockRef} key={`${format}-${layout}`} style={containerStyles}>
      <TextInputComponent
        editable={false}
        selectable={format === PostFormat.post}
        ref={inputRef}
        style={inputStyles}
        isSticker={
          format === PostFormat.sticker || format === PostFormat.comment
        }
        multiline
        scrollEnabled={false}
        nestedScrollEnabled
        listKey={block.id}
        spellCheck={false}
        adjustsFontSizeToFit
        inputAccessoryViewID={`new-post-input`}
        minimumFontScale={0.4}
        selectionColor={selectionColor}
        template={template}
        highlightInset={highlightInset}
        highlightCornerRadius={highlightCornerRadius}
        strokeColor={strokeColor}
        borderType={borderType}
        strokeWidth={
          borderType === TextBorderType.stroke
            ? (fontSize >= 16 ? -2 : -1) * PixelRatio.get()
            : 2
        }
        lengthPerLine={50}
        blurOnSubmit={false}
        fontSizeRange={textInputPresets[template].fontSizes}
        placeholderTextColor={getPlaceholderColor(selectionColor)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        scrollEnabled={false}
        placeholder={placeholder}
        defaultValue={text}
        highlightColor={highlightColor}
        onChangeText={handleChangeText}
        keyboardAppearance="dark"
        textContentType="none"
        autoFocus={false}
        maxWidth={maxWidth}
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
      <View ref={stickerRef}>
        {template == TextTemplate.comic && (
          <>
            <View
              style={{
                height: 40,
                width: "100%",
                marginLeft: Math.abs(highlightInset)
              }}
            />
          </>
        )}

        {innerContent}

        {template === TextTemplate.comic && (
          <View
            pointerEvents="none"
            style={{
              opacity: String(text).length > 4 ? 1 : 0,
              alignItems: "center",
              top: 0,
              position: "absolute",
              left: 0,
              right: 0,
              zIndex: 1,
              transform: [
                {
                  rotate: "-4deg"
                },
                { scale: -1 }
              ]
            }}
          >
            <SpeechBubble
              strokeColor={color}
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
