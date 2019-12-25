import * as React from "react";
// import { ReText } from "react-native-redash";
import {
  View,
  StyleSheet,
  NativeModules,
  InteractionManager,
  TextInput as _RNTextInput,
  StyleProp,
  StyleSheetProperties,
  TextInputProps,
  PixelRatio
} from "react-native";
import { isNumber } from "lodash";
import {
  TapGestureHandler,
  GestureHandlerGestureEvent,
  State,
  BaseButton,
  createNativeWrapper,
  NativeViewGestureHandler
} from "react-native-gesture-handler";
import tinycolor from "tinycolor2";
import Animated, { Easing } from "react-native-reanimated";
import {
  TextPostBlock,
  PostFormat,
  FocusType,
  PostLayout,
  TextTemplate,
  TextBorderType
} from "../NewPostFormat";
import { COLORS, SPACING } from "../../../lib/styles";
import {
  normalizeBackgroundColor,
  CurrentUserCommentAvatar,
  TextCommentAvatar
} from "../../Posts/CommentsViewer";
import { TextInput as RNTextInput } from "./CustomTextInputComponent";
import { memoize } from "lodash";
import { FONT_STYLES } from "../../../lib/fonts";
import { SpeechBubble } from "./SpeechBubble";
import { SCREEN_DIMENSIONS } from "../../../../config";
const ZERO_WIDTH_SPACE = "​";

const RawAnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

const AnimatedTextInput = React.forwardRef((props, ref) => {
  const inputRef = React.useRef();

  React.useImperativeHandle(ref, () => {
    return inputRef?.current?.getNode();
  });

  return <RawAnimatedTextInput ref={inputRef} {...props} />;
}) as React.ComponentType<TextInputProps>;

export const contrastingColor = memoize((color: string) => {
  const _color = tinycolor(color);
  if (_color.isDark()) {
    return "#fff";
  } else {
    return "#333";
  }
});

const getPlaceholderColor = memoize((color: string) =>
  tinycolor(color)
    .setAlpha(0.65)
    .toString()
);

const textInputStyles = {
  [TextTemplate.comment]: {
    fontSizes: {
      "0": 14,
      "8": 14,
      "12": 14,
      "24": 14
    },
    presets: {
      backgroundColor: normalizeBackgroundColor("#7367FC"),
      color: "white",
      highlightInset: -6,
      highlightCornerRadius: 2
    }
  },
  [TextTemplate.post]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: "#000",
      color: "#fff",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: null
    }
  },
  [TextTemplate.basic]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: COLORS.secondary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      highlightInset: -6,
      highlightCornerRadius: 2,
      textShadowOffset: {
        width: StyleSheet.hairlineWidth,
        height: StyleSheet.hairlineWidth
      },
      textShadowRadius: 0
    }
  },
  [TextTemplate.gary]: {
    fontSizes: {
      "0": 48,
      "8": 48,
      "12": 48,
      "24": 48
    },
    presets: {
      backgroundColor: COLORS.secondary,
      textAlign: "center",
      color: "rgb(250,197,194)",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: StyleSheet.hairlineWidth
    }
  },
  [TextTemplate.comic]: {
    fontSizes: {
      "0": 20,
      "8": 20,
      "12": 20,
      "24": 20
    },
    presets: {
      backgroundColor: "white",
      textAlign: "center",
      color: "black",
      borderRadius: 0,
      highlightInset: -12,

      highlightCornerRadius: 4,

      textShadowColor: "transparent",
      placeholderColor: "white",

      textShadowOffset: {
        width: 0,
        height: 0
      },
      textShadowRadius: null
    }
  },

  [TextTemplate.pickaxe]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: COLORS.secondary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: StyleSheet.hairlineWidth
    }
  },
  [TextTemplate.terminal]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: COLORS.secondary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      highlightInset: -6,
      textAlign: "left",
      highlightCornerRadius: 2,
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: StyleSheet.hairlineWidth
    }
  }
};

const getTextShadow = memoize(
  (
    backgroundColor: string,
    color: string,
    format: PostFormat,
    border: TextBorderType,
    template: TextTemplate
  ) => {
    if (border === TextBorderType.stroke || format === PostFormat.post) {
      return {
        textShadowRadius: null
      };
    }

    let _backgroundColor =
      backgroundColor === "transparent" ? null : backgroundColor;

    let textShadowColor: string = "transparent";
    if (format === PostFormat.comment) {
      const _color = tinycolor(_backgroundColor || color);
      if (_color.isDark()) {
        textShadowColor = "rgba(255, 255, 255, 0.25)";
      } else {
        textShadowColor = "rgba(0, 0, 0, 0.25)";
      }
    } else if (border === TextBorderType.hidden) {
      const _color = tinycolor(_backgroundColor || color);
      if (_color.isDark()) {
        textShadowColor = "rgba(255, 255, 255, 0.95)";
      } else {
        textShadowColor = "rgba(0, 0, 0, 0.95)";
      }
    }

    if (textShadowColor === "transparent") {
      return {
        textShadowColor: "transparent",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: null
      };
    }

    let textShadowOffset = textInputStyles[template].presets
      ?.textShadowOffset ?? {
      width: 0,
      height: 0
    };

    let textShadowRadius =
      textInputStyles[template].presets?.textShadowRadius ?? 0;

    if (
      (border === TextBorderType.hidden ||
        border === TextBorderType.highlight) &&
      !textInputStyles[template].presets?.textShadowRadius
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
  }
);

const BASE_OVERLAY_STYLE = {
  backgroundColor: "transparent",
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
      backgroundColor: "transparent"
    },
    input: {
      ...FONT_STYLES.basic,
      textAlign:
        textInputStyles[TextTemplate.basic].presets.textAlign || "left",
      color: textInputStyles[TextTemplate.basic].presets.color,

      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  }),
  [TextTemplate.comic]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
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
        textInputStyles[TextTemplate.comic].presets.backgroundColor,
      textAlign:
        textInputStyles[TextTemplate.comic].presets.textAlign || "left",
      color: textInputStyles[TextTemplate.comic].presets.color,

      textShadowColor:
        textInputStyles[TextTemplate.comic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.comic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.comic].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  }),

  [TextTemplate.post]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...FONT_STYLES.post,
      textAlign: "left",
      backgroundColor: "transparent",

      marginTop: 0,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 8,
      textAlignVertical: "center",
      paddingRight: 8,
      color: textInputStyles[TextTemplate.post].presets.color,
      textShadowColor:
        textInputStyles[TextTemplate.post].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.post].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.post].presets.textShadowRadius
    }
  }),
  [TextTemplate.pickaxe]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...FONT_STYLES.minecraft,
      textAlign:
        textInputStyles[TextTemplate.pickaxe].presets.textAlign || "left",
      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  }),

  [TextTemplate.terminal]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...FONT_STYLES.monospace,
      paddingTop: SPACING.normal,
      paddingBottom: SPACING.normal,
      textAlign:
        textInputStyles[TextTemplate.terminal].presets.textAlign || "left",
      textShadowColor:
        textInputStyles[TextTemplate.terminal].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.terminal].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.terminal].presets.textShadowRadius
    },
    stickerInput: {
      ...BASE_OVERLAY_STYLE
    }
  }),
  [TextTemplate.gary]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...FONT_STYLES.spongebob,
      textAlign: textInputStyles[TextTemplate.gary].presets.textAlign || "left",
      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
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
    flexShrink: 0,
    marginRight: 0,
    backgroundColor: "transparent",
    marginBottom: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    flexWrap: "nowrap",
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    overflow: "visible",
    shadowOpacity: 0,
    textShadowRadius: null
  }
});

export const getDenormalizedColor = (block: TextPostBlock) => {
  const { template, overrides = {} } = block.config;

  return (
    overrides?.color ||
    overrides?.textColor ||
    textInputStyles[template].presets.color
  );
};

export const getDenormalizedBackgroundColor = (block: TextPostBlock) => {
  const { template, overrides = {} } = block.config;

  return (
    overrides?.backgroundColor ||
    textInputStyles[template].presets.backgroundColor
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
    return "transparent";
  } else if (border === TextBorderType.invert) {
    return color;
  } else {
    if (
      (!overrides?.backgroundColor &&
        tinycolor(backgroundColor).isDark() &&
        tinycolor(color).isDark()) ||
      (tinycolor(backgroundColor).isLight() && tinycolor(color).isLight())
    ) {
      return contrastingColor(color);
    } else {
      return backgroundColor;
    }
  }
};

export const getTextBlockAlign = (block: TextPostBlock): CanvasTextAlign => {
  const { template, overrides = {}, border } = block.config;

  return (
    overrides?.textAlign ||
    textInputStyles[template].presets.textAlign ||
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

export class TextInput extends React.Component<Props> {
  static defaultProps = {
    TextInputComponent: AnimatedTextInput
  };
  state = {
    isFocused: false
  };

  fontSizeValue: Animated.Value<number>;

  getFontSizeValue = (props, text) => {
    const fontSize = props.block?.config?.overrides?.fontSize;

    if (typeof fontSize === "number") {
      return fontSize;
    }

    const fontSizes = textInputStyles[props.block.config.template].fontSizes;
    return fontSizes[getClosestNumber(text.length, Object.keys(fontSizes))];
  };

  handleChange = text => {
    this.props.onChangeValue(text);

    return true;
  };

  handleBlur = event => {
    this.props.onBlur && this.props.onBlur(event);
    this.setState({ isFocused: false });
  };

  handleFocus = event => {
    this.props.onFocus && this.props.onFocus(event);
    this.setState({ isFocused: true });
  };

  render() {
    const {
      config: {
        placeholder = " ",
        minHeight,
        template,
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
      id,
      ...otherProps
    } = this.props.block;
    const {
      editable,
      inputRef,
      onBlur,
      photoURL,
      disabled,
      username,
      onLayout,
      focusType,
      onTapAvatar,
      focusTypeValue,
      maxX = SCREEN_DIMENSIONS.width,
      onFocus,
      block,
      gestureRef,
      TextInputComponent
    } = this.props;
    const { isFocused } = this.state;

    let width = undefined;
    let height = undefined;

    if (focusType === FocusType.absolute && isFocused) {
      width = "100%";
      height = "100%";
    } else if (format === PostFormat.post) {
      if (
        [
          PostLayout.horizontalTextMedia,
          PostLayout.horizontalMediaText
        ].includes(layout)
      ) {
        width = "50%";
      }
    }

    const backgroundColor = getTextBlockBackgroundColor(block);
    const color = getTextBlockColor(block);
    const textAlign = getTextBlockAlign(block);
    const textTransform = overrides?.textTransform;
    const maxWidth = overrides?.maxWidth;

    const textShadow = getTextShadow(
      backgroundColor,
      color,
      format,
      border,
      template
    );

    const containerStyles = [
      styles.container,
      textInputTypeStylesheets[template].container,
      {
        height,
        width,
        backgroundColor: null
      }
    ];

    const highlightInset =
      textInputStyles[template].presets?.highlightInset ?? 0;

    const highlightCornerRadius =
      textInputStyles[template].presets?.highlightCornerRadius ?? 0;

    const inputStyles = [
      styles.input,
      textInputTypeStylesheets[template].input,
      {
        backgroundColor:
          format === PostFormat.post ? backgroundColor : undefined,
        minHeight,
        marginLeft:
          template === TextTemplate.comic
            ? Math.abs(highlightInset)
            : undefined,
        textAlign:
          focusType === FocusType.absolute && isFocused ? "left" : textAlign,

        color,
        fontWeight: border === TextBorderType.stroke ? "600" : undefined,
        textTransform,

        flex:
          focusType === FocusType.absolute && isFocused
            ? -1
            : {
                [PostFormat.sticker]: 0,
                [PostFormat.comment]: 0,
                [PostFormat.post]: 0
              }[format],
        width:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,
        height:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,

        fontSize: this.getFontSizeValue(this.props, value),
        ...textShadow,
        maxWidth: maxWidth
      }
    ];
    let borderType = border;
    let highlightColor = backgroundColor;
    const selectionColor = contrastingColor(backgroundColor);
    let strokeColor =
      TextBorderType.highlight === border ? "transparent" : color;

    if (borderType === TextBorderType.stroke) {
      strokeColor = backgroundColor;
    }

    // console.log({
    //   borderType,
    //   selectionColor,
    //   highlightColor,
    //   strokeColor,
    //   color,
    //   backgroundColor
    // });

    const innerContent = (
      <View key={`${format}-${layout}`} style={containerStyles}>
        <TextInputComponent
          {...otherProps}
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
          // autoCorrect={
          //   {
          //     [TextTemplate.basic]: true,
          //     [TextTemplate.comic]: true,
          //     [TextTemplate.terminal]: false
          //   }[template] ?? true
          // }
          // autoCapitalize={
          //   {
          //     [TextTemplate.basic]: "sentences",
          //     [TextTemplate.comic]: "none",
          //     [TextTemplate.terminal]: "characters"
          //   }[template] || "sentences"
          // }
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
              ? -1 * (PixelRatio.getFontScale() * 2)
              : 2
          }
          lengthPerLine={50}
          blurOnSubmit={false}
          fontSizeRange={textInputStyles[template].fontSizes}
          placeholderTextColor={getPlaceholderColor(selectionColor)}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          scrollEnabled={false}
          placeholder={placeholder}
          defaultValue={this.props.text}
          highlightColor={highlightColor}
          onChangeText={this.handleChange}
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
        <View>
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
                opacity: String(this.props.text).length > 4 ? 1 : 0,
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
  }
}
export default TextInput;
