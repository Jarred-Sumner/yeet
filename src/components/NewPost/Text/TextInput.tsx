import * as React from "react";
// import { ReText } from "react-native-redash";
import {
  View,
  StyleSheet,
  NativeModules,
  InteractionManager
} from "react-native";
import {
  // TextInput as RNTextInput,
  TapGestureHandler,
  GestureHandlerGestureEvent,
  State,
  BaseButton,
  createNativeWrapper
} from "react-native-gesture-handler";

import Animated, { Easing } from "react-native-reanimated";
import {
  TextPostBlock,
  PostFormat,
  presetsByFormat,
  FocusType
} from "../NewPostFormat";
import { COLORS } from "../../../lib/styles";
import tinycolor from "tinycolor2";

import { TextInput as RNTextInput } from "./CustomTextInputComponent";

const ZERO_WIDTH_SPACE = "​";

const RawAnimatedTextInput = Animated.createAnimatedComponent(
  createNativeWrapper(RNTextInput)
);

const AnimatedTextInput = React.forwardRef((props, ref) => {
  const inputRef = React.useRef();

  React.useImperativeHandle(ref, () => inputRef.current.getNode());

  return <RawAnimatedTextInput ref={inputRef} {...props} />;
});

const TextInputComponent = AnimatedTextInput;

const textInputStyles = {
  [PostFormat.comment]: {
    fontSizes: {
      "0": 14,
      "8": 14,
      "12": 14,
      "24": 14
    },
    presets: {
      backgroundColor: "green",
      color: "white"
    }
  },
  [PostFormat.screenshot]: {
    fontSizes: {
      "0": 48,
      "8": 48,
      "12": 36,
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
  },
  [PostFormat.caption]: {
    fontSizes: {
      "7": 42,
      "8": 32,
      "12": 32,
      "16": 32,
      "18": 28,
      "24": 24
    },
    presets: {
      backgroundColor: "rgba(255, 255, 255, 0.99)",
      color: "black",
      placeholderColor: "#666"
    }
  }
};

const textInputTypeStylesheets = {
  [PostFormat.comment]: StyleSheet.create({
    input: {
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      overflow: "hidden"
    }
  }),
  [PostFormat.screenshot]: StyleSheet.create({
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
      color: textInputStyles[PostFormat.screenshot].presets.color,
      fontWeight: "bold",
      textShadowColor:
        textInputStyles[PostFormat.screenshot].presets.textShadowColor,
      textShadowOffset:
        textInputStyles[PostFormat.screenshot].presets.textShadowOffset,

      textShadowRadius:
        textInputStyles[PostFormat.screenshot].presets.textShadowRadius
    }
  }),
  [PostFormat.caption]: StyleSheet.create({
    container: {
      justifyContent: "center",
      borderTopColor: tinycolor(
        presetsByFormat[PostFormat.caption].backgroundColor
      )
        .setAlpha(0.1)
        .toString(),
      marginTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tinycolor(
        presetsByFormat[PostFormat.caption].backgroundColor
      )
        .setAlpha(0.1)
        .toString(),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderRadius: 0
    },
    input: {
      textAlign: "left",
      fontFamily: "Helvetica",
      paddingTop: presetsByFormat[PostFormat.caption].paddingVertical,
      paddingBottom: presetsByFormat[PostFormat.caption].paddingVertical,
      paddingLeft: presetsByFormat[PostFormat.caption].paddingHorizontal,
      paddingRight: presetsByFormat[PostFormat.caption].paddingHorizontal,
      color: presetsByFormat[PostFormat.caption].color,
      flexGrow: 0,
      fontWeight: "bold"
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
  block: TextPostBlocfk;
  onChangeValue: (value: string) => void;
};

export class TextInput extends React.Component<Props> {
  static defaultProps = {
    type: PostFormat.screenshot
  };
  state = {
    isFocused: false
  };

  fontSizeValue = new Animated.Value(48);
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

    this.lastAnimationFrame = window.requestAnimationFrame(() => {
      this.fontSizeClock = Animated.timing(this.fontSizeValue, {
        toValue: this.getFontSizeValue(this.props, text),
        duration: 50,
        easing: Easing.linear
      }).start();

      this.props.onChangeValue(text);
    });

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
      config: { placeholder = " " },
      value,
      format,
      id,
      ...otherProps
    } = this.props.block;
    const {
      editable,
      inputRef,
      onBlur,
      onLayout,
      focusType,
      onFocus
    } = this.props;
    const { isFocused } = this.state;

    const containerStyles = [
      styles.container,
      textInputTypeStylesheets[format].container,
      {
        height:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,
        width:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined
      }
    ];

    const inputStyles = [
      styles.input,
      textInputTypeStylesheets[format].input,
      {
        flex: focusType === FocusType.absolute && isFocused ? 1 : 0,
        height:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,
        width:
          focusType === FocusType.absolute && isFocused ? "100%" : undefined,
        fontSize: this.fontSizeValue,
        lineHeight:
          format === PostFormat.caption
            ? Animated.multiply(this.fontSizeValue, 1.4)
            : undefined
      }
    ];

    return (
      <TapGestureHandler
        enabled={editable && !this.state.isFocused}
        ref={this.props.gestureRef}
        onHandlerStateChange={this.handleHandlerChange}
      >
        <View style={containerStyles}>
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
            minimumFontScale={0.4}
            selectionColor="white"
            highlightInset={-4}
            highlightCornerRadius={8}
            lengthPerLine={50}
            blurOnSubmit={false}
            fontSizeRange={textInputStyles[format].fontSizes}
            showHighlight={format === PostFormat.screenshot}
            placeholderTextColor={
              textInputStyles[format].presets.placeholderColor || undefined
            }
            onBlur={this.handleBlur}
            onFocus={this.handleFocus}
            scrollEnabled={false}
            placeholder={placeholder}
            defaultValue={this.props.text}
            highlightColor={
              textInputStyles[PostFormat.screenshot].presets.backgroundColor
            }
            onChangeText={this.handleChange}
            keyboardAppearance="dark"
            textContentType="none"
            autoFocus={false}
          />
          {editable && <View style={StyleSheet.absoluteFill}></View>}
        </View>
      </TapGestureHandler>
    );
  }
}
export default TextInput;
