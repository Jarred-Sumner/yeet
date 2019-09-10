import * as React from "react";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import { TextPostBlock as TextPostBlockType } from "./NewPostFormat";
import { TextInput } from "./Text/TextInput";

type Props = {
  block: TextPostBlockType;
  onChange: ChangeBlockFunction;
};

export class TextPostBlock extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {
      text: props.block.value || ""
    };
  }

  handleChange = text => {
    this.setState({ text });
  };

  handleFocus = () => this.props.onFocus(this.props.block);

  handleBlur = () => {
    this.props.onBlur({ ...this.props.block, value: this.state.text });
  };

  focus = () => {
    this.textInput.current.focus();
  };

  blur = () => {
    this.textInput.current.blur();
  };

  setNativeProps = (...args) => this.textInput.current.setNativeProps.call(this.textInput.current, args)

  textInput = React.createRef<TextInput>();

  render() {
    const {
      block,
      onLayout,
      inputRef,
      disabled,
      gestureRef,
      focusTypeValue,
      focusType,
      focusedBlockValue
    } = this.props;

    return (
      <TextInput
        editable={!disabled}
        block={block}
        inputRef={this.textInput}
        focusedBlockValue={focusedBlockValue}
        focusTypeValue={focusTypeValue}
        focusType={focusType}
        gestureRef={gestureRef}
        onLayout={onLayout}
        text={this.state.text}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onChangeValue={this.handleChange}
      />
    );
  }
}

export default TextPostBlock;
