import * as React from "react";
// import { ReText } from "react-native-redash";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import { TextPostBlock } from "../NewPostFormat";

const ZERO_WIDTH_SPACE = "​";

const RawAnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

class AnimatedTextInput extends React.PureComponent {
  inputRef = React.createRef();
  focus = () => {
    this.inputRef.current.getNode().focus();
  };

  blur = () => {
    this.inputRef.current.getNode().blur();
  };

  setNativeProps = blah => {
    this.inputRef.current.setNativeProps(blah);
  };

  render() {
    return <RawAnimatedTextInput ref={this.inputRef} {...this.props} />;
  }
}

const TextInputComponent = AnimatedTextInput;

const textInputStyles = {
  standard: {
    fontSizes: {
      "0": 64,
      "8": 48,
      "12": 42,
      "16": 38,
      "18": 36,
      "24": 32
    },
    presets: {
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: 1
    }
  }
};

const textInputTypeStylesheets = {
  standard: StyleSheet.create({
    container: {
      backgroundColor: textInputStyles.standard.presets.backgroundColor,
      borderRadius: 4
    },
    input: {
      textAlign: "left",
      fontFamily: "Helvetica",
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 10,
      paddingRight: 10,
      color: textInputStyles.standard.presets.color,
      fontWeight: "bold",
      textShadowColor: textInputStyles.standard.presets.textShadowColor,
      textShadowOffset: textInputStyles.standard.presets.textShadowOffset,

      textShadowRadius: textInputStyles.standard.presets.textShadowRadius
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
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0
  }
});

const getClosestNumber = (goal, counts) =>
  counts.reduce(function(prev, curr) {
    return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
  });

type Props = {
  block: TextPostBlock;
  onChangeValue: (value: string) => void;
};

export class TextInput extends React.Component<Props> {
  static defaultProps = {
    type: "standard"
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
    const fontSizes = textInputStyles[props.block.config.variant].fontSizes;
    return fontSizes[getClosestNumber(text.length, Object.keys(fontSizes))];
  };

  handleChange = text => {
    if (this.props.text.length !== text.length) {
      this.fontSizeClock = Animated.timing(this.fontSizeValue, {
        duration: 100,
        easing: Easing.elastic(0.25),
        toValue: this.getFontSizeValue(this.props, text) || 16
      }).start();
    }

    this.props.onChangeValue(text);

    return true;
  };

  render() {
    const {
      config: { variant },
      value,
      ...otherProps
    } = this.props.block;
    const { editable, inputRef, onBlur, onLayout } = this.props;

    const containerStyles = [
      styles.container,
      textInputTypeStylesheets[variant].container
    ];

    const inputStyles = [
      styles.input,
      textInputTypeStylesheets[variant].input,
      {
        fontSize: this.fontSizeValue
      }
    ];

    return (
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
          onBlur={onBlur}
          scrollEnabled={false}
          placeholder=" "
          defaultValue={this.props.text}
          onChangeText={this.handleChange}
          keyboardAppearance="dark"
          autoFocus={false}
        />
        {editable && <View style={StyleSheet.absoluteFill}></View>}
      </View>
    );
  }
}
export default TextInput;
