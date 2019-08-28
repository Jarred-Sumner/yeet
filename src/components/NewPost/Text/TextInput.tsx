import * as React from "react";
import { ReText } from "react-native-redash";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import Animated from "react-native-reanimated";
import { TextPostBlock } from "../NewPostFormat";

const TextInputComponent = RNTextInput;

const textInputStyles = {
  standard: {
    fontSizes: {
      "0": 64,
      "8": 48,
      "16": 36,
      "24": 20
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

  get value() {
    return this.props.text;
  }

  getFontSize = () => {
    const {
      config: { variant }
    } = this.props.block;
    const { fontSizes } = textInputStyles[variant];
    return fontSizes[
      getClosestNumber(this.value.length, Object.keys(fontSizes))
    ];
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
        fontSize: this.getFontSize()
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
          blurOnSubmit={false}
          onBlur={onBlur}
          scrollEnabled={false}
          defaultValue={this.value}
          keyboardAppearance="dark"
          autoFocus={false}
          onChangeText={this.props.onChangeValue}
        />
        {editable && <View style={StyleSheet.absoluteFill}></View>}
      </View>
    );
  }
}
export default TextInput;
