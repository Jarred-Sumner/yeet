import * as React from "react";
// import { ReText } from "react-native-redash";
import {
  View,
  StyleSheet,
  NativeModules,
  InteractionManager,
  TextInput as _RNTextInput,
  StyleProp,
  StyleSheetProperties
} from "react-native";
import {
  // TextInput as RNTextInput,
  TapGestureHandler,
  GestureHandlerGestureEvent,
  State,
  BaseButton,
  createNativeWrapper
} from "react-native-gesture-handler";
import tinycolor from "tinycolor2";
import Animated, { Easing } from "react-native-reanimated";
import {
  TextPostBlock,
  PostFormat,
  presetsByFormat,
  FocusType,
  PostLayout,
  TextTemplate,
  TextBorderType
} from "../NewPostFormat";
import { COLORS } from "../../../lib/styles";
import {
  normalizeBackgroundColor,
  CurrentUserCommentAvatar,
  TextCommentAvatar
} from "../../Posts/CommentsViewer";
import { TextInput as RNTextInput } from "./CustomTextInputComponent";
import { memoize } from "lodash";
import { FONT_STYLES } from "../../../lib/fonts";
const ZERO_WIDTH_SPACE = "​";

const RawAnimatedTextInput = Animated.createAnimatedComponent(
  createNativeWrapper(RNTextInput)
);

const AnimatedTextInput = React.forwardRef((props, ref) => {
  const inputRef = React.useRef();

  React.useImperativeHandle(ref, () => inputRef.current.getNode());

  return <RawAnimatedTextInput ref={inputRef} {...props} />;
});

const contrastingColor = memoize((color: string) => {
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
      color: "white"
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
      backgroundColor: "#fff",
      color: "#000",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 1
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
      backgroundColor: COLORS.primary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 1
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
      backgroundColor: COLORS.primary,
      textAlign: "center",
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 5
    }
  },
  [TextTemplate.comic]: {
    fontSizes: {
      "0": 36,
      "8": 36,
      "12": 36,
      "24": 36
    },
    presets: {
      backgroundColor: "white",
      textAlign: "center",
      color: "black",
      borderRadius: 8,
      textShadowColor: "transparent",
      placeholderColor: "white",

      textShadowOffset: {
        width: 0,
        height: 0
      },
      textShadowRadius: 0
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
      backgroundColor: COLORS.primary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 1
    }
  },
  [TextTemplate.space]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: COLORS.primary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 1
    }
  },
  [TextTemplate.magic]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: COLORS.primary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 1
    }
  },
  [TextTemplate.superhero]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: COLORS.primary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 1
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
      backgroundColor: COLORS.primary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 1
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
        textShadowRadius: 0
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
  textAlign: "left",
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
      borderRadius: 4
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
      ...BASE_OVERLAY_STYLE,
      textAlign:
        textInputStyles[TextTemplate.basic].presets.textAlign || "left",
      color: textInputStyles[TextTemplate.basic].presets.color,
      fontWeight: "bold",
      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
    }
  }),
  [TextTemplate.comic]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...BASE_OVERLAY_STYLE,
      ...FONT_STYLES.comic,
      textAlign:
        textInputStyles[TextTemplate.comic].presets.textAlign || "left",
      color: textInputStyles[TextTemplate.comic].presets.color,
      fontWeight: "bold",
      textShadowColor:
        textInputStyles[TextTemplate.comic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.comic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.comic].presets.textShadowRadius
    }
  }),

  [TextTemplate.post]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      textAlign: "left",
      backgroundColor: "transparent",
      fontFamily: "Helvetica",
      marginTop: 0,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 8,
      textAlignVertical: "center",
      paddingRight: 8,
      color: textInputStyles[TextTemplate.post].presets.color,
      fontWeight: "500",
      textShadowColor:
        textInputStyles[TextTemplate.post].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.post].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.post].presets.textShadowRadius
    }
  }),
  [TextTemplate.space]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...BASE_OVERLAY_STYLE,
      ...FONT_STYLES.starwars,
      textAlign:
        textInputStyles[TextTemplate.space].presets.textAlign || "left",
      color: textInputStyles[TextTemplate.basic].presets.color,
      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
    }
  }),
  [TextTemplate.pickaxe]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...BASE_OVERLAY_STYLE,
      ...FONT_STYLES.minecraft,
      textAlign:
        textInputStyles[TextTemplate.pickaxe].presets.textAlign || "left",
      color: textInputStyles[TextTemplate.basic].presets.color,
      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
    }
  }),
  [TextTemplate.magic]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...BASE_OVERLAY_STYLE,
      ...FONT_STYLES.waltograph,
      textAlign:
        textInputStyles[TextTemplate.magic].presets.textAlign || "center",
      color: textInputStyles[TextTemplate.basic].presets.color,
      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
    }
  }),
  [TextTemplate.superhero]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...BASE_OVERLAY_STYLE,
      ...FONT_STYLES.avenger,
      textAlign:
        textInputStyles[TextTemplate.superhero].presets.textAlign || "left",
      color: textInputStyles[TextTemplate.basic].presets.color,
      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
    }
  }),
  [TextTemplate.gary]: StyleSheet.create({
    container: {
      backgroundColor: "transparent"
    },
    input: {
      ...BASE_OVERLAY_STYLE,
      ...FONT_STYLES.spongebob,
      color: textInputStyles[TextTemplate.basic].presets.color,
      textAlign: textInputStyles[TextTemplate.gary].presets.textAlign || "left",
      textShadowColor:
        textInputStyles[TextTemplate.basic].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[TextTemplate.basic].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[TextTemplate.basic].presets.textShadowRadius
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
    paddingBottom: 0
  }
});

const getClosestNumber = (goal, counts) =>
  counts.find(count => {
    if (goal - Number(count) <= 0) {
      return true;
    }
  }) || counts[counts.length - 1];

type Props = {
  block: TextPostBlock;
  onChangeValue: (value: string) => void;
};

export class TextInput extends React.Component<Props> {
  static defaultProps = {
    type: PostFormat.screenshot,
    TextInputComponent: AnimatedTextInput
  };
  state = {
    isFocused: false
  };

  fontSizeValue: Animated.Value<number>;
  constructor(props) {
    super(props);

    // this._value = new Animated.Value(props.text);

    this.fontSizeValue = new Animated.Value(
      this.getFontSizeValue(props, props.text),
      props.text
    );
  }

  fontSizeClock = new Animated.Clock();

  getFontSizeValue = (props, text) => {
    const fontSizes = textInputStyles[props.block.config.template].fontSizes;
    return fontSizes[getClosestNumber(text.length, Object.keys(fontSizes))];
  };

  lastAnimationFrame = -1;

  componentWillUnmount() {
    if (this.lastAnimationFrame) {
      window.cancelAnimationFrame(this.lastAnimationFrame);
    }
  }
  handleChange = text => {
    if (this.lastAnimationFrame > -1) {
      cancelAnimationFrame(this.lastAnimationFrame);
    }

    this.props.onChangeValue(text);

    return true;
  };

  handleHandlerChange = (handler: GestureHandlerGestureEvent) => {
    if (handler.nativeEvent.state === State.END) {
      this.handlePressInside();
    }
  };

  handleBlur = event => {
    this.props.onBlur && this.props.onBlur(event);
    this.setState({ isFocused: false });
  };

  handleFocus = event => {
    this.props.onFocus && this.props.onFocus(event);
    this.setState({ isFocused: true });
  };

  handlePressInside = () => {
    this.props.focusedBlockValue.setValue(this.props.block.id.hashCode());
    this.props.focusTypeValue.setValue(this.props.focusType);
    this.props.inputRef && this.props.inputRef.current.focus();
  };

  handlePress = (isInside: boolean) => isInside && this.handlePressInside();

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
          textAlign: undefined
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
      username,
      onLayout,
      focusType,
      onTapAvatar,
      onFocus,
      TextInputComponent
    } = this.props;
    const { isFocused } = this.state;

    let width = undefined;
    let height = undefined;

    if (focusType === FocusType.absolute && isFocused) {
      width = "100%";
      height = "100%";
    } else if (
      layout === PostLayout.horizontalMediaText ||
      layout === PostLayout.horizontalTextMedia
    ) {
      width = "50%";
    } else if (
      layout === PostLayout.verticalMediaText ||
      layout === PostLayout.verticalTextMedia
    ) {
      width = "100%";
    }

    const showHighlight = border === TextBorderType.highlight;
    const highlightRadius = showHighlight
      ? overrides?.borderRadius ||
        textInputStyles[template].presets.borderRadius ||
        8
      : 0;

    let backgroundColor =
      overrides?.backgroundColor ||
      textInputStyles[template].presets.backgroundColor;

    let textAlign =
      overrides?.textAlign || textInputStyles[template].presets.textAlign;

    let color = overrides?.color || textInputStyles[template].presets.color;

    if (border === TextBorderType.hidden) {
      backgroundColor = "transparent";
    } else if (border === TextBorderType.invert) {
      const _color = backgroundColor;
      backgroundColor = color;
      color = _color;
    } else if (border === TextBorderType.stroke) {
      backgroundColor = color;
      color = backgroundColor;
    }

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
        backgroundColor:
          border === TextBorderType.solid ? backgroundColor : undefined
      }
    ];

    const inputStyles = [
      styles.input,
      textInputTypeStylesheets[template].input,
      {
        backgroundColor:
          border !== TextBorderType.solid && !showHighlight
            ? backgroundColor
            : undefined,
        minHeight,
        textAlign,
        color,
        flex: focusType === FocusType.absolute && isFocused ? 1 : 0,
        height:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,
        width:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,
        fontSize: this.fontSizeValue,
        ...textShadow
      }
    ];

    const selectionColor = contrastingColor(backgroundColor);

    return (
      <TapGestureHandler
        enabled={editable && !this.state.isFocused}
        ref={this.props.gestureRef}
        onHandlerStateChange={this.handleHandlerChange}
      >
        <View key={`${format}-${layout}`} style={containerStyles}>
          <TextInputComponent
            {...otherProps}
            editable={editable}
            pointerEvents={editable ? "auto" : "none"}
            ref={inputRef}
            style={inputStyles}
            multiline
            autoCorrect
            spellCheck={false}
            adjustsFontSizeToFit
            inputAccessoryViewID={editable ? `new-post-input` : undefined}
            minimumFontScale={0.4}
            selectionColor={selectionColor}
            template={template}
            highlightInset={highlightRadius / -20}
            highlightCornerRadius={highlightRadius}
            lengthPerLine={50}
            blurOnSubmit={false}
            fontSizeRange={textInputStyles[template].fontSizes}
            showHighlight={showHighlight}
            placeholderTextColor={getPlaceholderColor(selectionColor)}
            onBlur={this.handleBlur}
            onFocus={this.handleFocus}
            scrollEnabled={false}
            placeholder={placeholder}
            defaultValue={this.props.text}
            highlightColor={backgroundColor}
            onChangeText={this.handleChange}
            keyboardAppearance="dark"
            textContentType="none"
            autoFocus={false}
          />
          {editable && <View style={StyleSheet.absoluteFill}></View>}
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
      </TapGestureHandler>
    );
  }
}
export default TextInput;
