import * as React from "react";
// import { ReText } from "react-native-redash";
import {
  View,
  StyleSheet,
  NativeModules,
  InteractionManager,
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
  PostLayout
} from "../NewPostFormat";
import { COLORS } from "../../../lib/styles";
import {
  normalizeBackgroundColor,
  CurrentUserCommentAvatar,
  TextCommentAvatar
} from "../../Posts/CommentsViewer";
import { TextInput as RNTextInput } from "./CustomTextInputComponent";
import { memoize } from "lodash";
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
const textShadowColor = memoize((color: string) => {
  const _color = tinycolor(color);
  if (_color.isDark()) {
    return "rgba(255, 255, 255, 0.25)";
  } else {
    return "rgba(0, 0, 0, 0.25)";
  }
});

const textInputStyles = {
  [PostFormat.comment]: {
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
  [PostFormat.post]: {
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
  [PostFormat.sticker]: {
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
      textShadowRadius: 1
    }
  }
};

const textInputTypeStylesheets = {
  [PostFormat.comment]: StyleSheet.create({
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
  [PostFormat.sticker]: StyleSheet.create({
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
      paddingLeft: 6,
      textAlignVertical: "center",
      paddingRight: 6,
      color: textInputStyles[PostFormat.post].presets.color,
      fontWeight: "bold",
      textShadowColor: textInputStyles[PostFormat.post].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[PostFormat.post].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[PostFormat.post].presets.textShadowRadius
    }
  }),
  [PostFormat.post]: StyleSheet.create({
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
      color: textInputStyles[PostFormat.post].presets.color,
      fontWeight: "500",
      textShadowColor: textInputStyles[PostFormat.post].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[PostFormat.post].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[PostFormat.post].presets.textShadowRadius
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
    const fontSizes = textInputStyles[props.block.format].fontSizes;
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
        overrides = {
          color: undefined,
          backgroundColor: undefined
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

    console.log({ layout, width, format });

    const containerStyles = [
      styles.container,
      textInputTypeStylesheets[format].container,
      {
        height,
        width
      }
    ];

    const showHighlight =
      format === PostFormat.sticker || format === PostFormat.comment;

    const backgroundColor =
      overrides?.backgroundColor ??
      textInputStyles[format].presets.backgroundColor;

    const color = overrides?.color ?? textInputStyles[format].presets.color;

    const inputStyles = [
      styles.input,
      textInputTypeStylesheets[format].input,
      {
        backgroundColor: showHighlight ? "transparent" : backgroundColor,
        minHeight,
        color,
        flex: focusType === FocusType.absolute && isFocused ? 1 : 0,
        height:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,
        width:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,
        fontSize: this.fontSizeValue,
        textShadowColor:
          format === PostFormat.comment
            ? textShadowColor(backgroundColor)
            : undefined
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
            inputAccessoryViewID={`new-post-input`}
            minimumFontScale={0.4}
            selectionColor={selectionColor}
            highlightInset={-4}
            highlightCornerRadius={8}
            lengthPerLine={50}
            blurOnSubmit={false}
            fontSizeRange={textInputStyles[format].fontSizes}
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
