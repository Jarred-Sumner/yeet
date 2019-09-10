import * as React from "react";
// import { ReText } from "react-native-redash";
import { View, StyleSheet } from "react-native";
import {
  TextInput as RNTextInput,
  TapGestureHandler,
  GestureHandlerGestureEvent,
  State
} from "react-native-gesture-handler";
import Animated, { Easing } from "react-native-reanimated";
import { TextPostBlock, PostFormat, presetsByFormat } from "../NewPostFormat";
import { COLORS } from "../../../lib/styles";
import tinycolor from "tinycolor2";

const ZERO_WIDTH_SPACE = "​";

const RawAnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

const AnimatedTextInput = React.forwardRef((props, ref) => {
  const inputRef = React.useRef();

  React.useImperativeHandle(ref, () => inputRef.current.getNode());

  return <RawAnimatedTextInput ref={inputRef} {...props} />;
});

const TextInputComponent = AnimatedTextInput;

const textInputStyles = {
  [PostFormat.screenshot]: {
    fontSizes: {
      "0": 64,
      "8": 48,
      "12": 42,
      "16": 38,
      "18": 36,
      "24": 32
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
  [PostFormat.screenshot]: StyleSheet.create({
    container: {
      backgroundColor:
        textInputStyles[PostFormat.screenshot].presets.backgroundColor,
      borderRadius: 4
    },
    input: {
      textAlign: "left",
      fontFamily: "Helvetica",
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 10,
      paddingRight: 10,
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
    type: PostFormat.screenshot
  };

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

  handleChange = text => {
    if (this.props.text.length !== text.length) {
      this.fontSizeClock = Animated.timing(this.fontSizeValue, {
        duration: 100,
        easing: Easing.linear,
        toValue: this.getFontSizeValue(this.props, text) || 16
      }).start();
    }

    this.props.onChangeValue(text);

    return true;
  };

  handleHandlerChange = (handler: GestureHandlerGestureEvent) => {
    if (handler.nativeEvent.state === State.END) {
      this.props.focusedBlockValue.setValue(this.props.block.id.hashCode());
      this.props.focusTypeValue.setValue(this.props.focusType);
      this.props.inputRef && this.props.inputRef.current.focus();
    }
  };

  render() {
    const {
      config: { placeholder = " " },
      value,
      format,
      id,
      ...otherProps
    } = this.props.block;
    const { editable, inputRef, onBlur, onLayout, focusType } = this.props;

    const containerStyles = [
      styles.container,
      textInputTypeStylesheets[format].container
    ];

    const inputStyles = [
      styles.input,
      textInputTypeStylesheets[format].input,
      {
        fontSize: this.fontSizeValue,
        lineHeight:
          format === PostFormat.caption
            ? Animated.multiply(this.fontSizeValue, 1.4)
            : undefined
      }
    ];

    return (
      <TapGestureHandler
        enabled={editable}
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
            onFocus={this.props.onFocus}
            multiline
            adjustsFontSizeToFit
            minimumFontScale={0.4}
            blurOnSubmit={false}
            placeholderTextColor={
              textInputStyles[format].presets.placeholderColor || undefined
            }
            onBlur={onBlur}
            scrollEnabled={false}
            placeholder={placeholder}
            defaultValue={this.props.text}
            onChangeText={this.handleChange}
            keyboardAppearance="dark"
            autoFocus={false}
          />
          {editable && <View style={StyleSheet.absoluteFill}></View>}
        </View>
      </TapGestureHandler>
    );
  }
}
export default TextInput;
